from django.contrib.gis.geos import Point
from django.core.cache import cache
from django.db import connection
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    RouteRequestSerializer,
    RouteResponseSerializer,
    GeocodeRequestSerializer,
    IsochroneRequestSerializer,
)

import hashlib
import requests
import json


class RouteView(APIView):
    """
    Calculate shortest path between two points using pgRouting.

    GET /api/routing/route/?from_lat=38.70&from_lon=-9.13&to_lat=41.14&to_lon=-8.61&mode=drive

    Pipeline:
        1. Validate coordinates via serializer
        2. Find nearest graph nodes on actual roads
        3. Run pgr_dijkstra on the road network
        4. Merge edge geometries into a single LineString
        5. Return GeoJSON + distance + estimated duration
    """

    SPEED_PROFILES = {
        "drive": {
            "motorway": 120,
            "motorway_link": 80,
            "trunk": 100,
            "trunk_link": 70,
            "primary": 90,
            "primary_link": 60,
            "secondary": 70,
            "tertiary": 50,
            "residential": 30,
            "unclassified": 40,
            "living_street": 20,
            "service": 20,
        },
        "walk": {
            "footway": 5,
            "path": 5,
            "pedestrian": 5,
            "steps": 3,
            "residential": 5,
            "living_street": 5,
            "unclassified": 5,
            "tertiary": 5,
            "secondary": 4,
            "primary": 4,
            "service": 5,
            "track": 4,
            "cycleway": 5,
        },
        "bike": {
            "cycleway": 18,
            "path": 12,
            "residential": 15,
            "living_street": 15,
            "tertiary": 20,
            "secondary": 20,
            "primary": 18,
            "unclassified": 15,
            "service": 12,
            "track": 10,
            "footway": 8,
            "pedestrian": 8,
        },
    }

    AVG_SPEEDS = {"drive": 80, "walk": 5, "bike": 15}

    def get(self, request):
        serializer = RouteRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        origin = Point(data["from_lon"], data["from_lat"], srid=4326)
        destination = Point(data["to_lon"], data["to_lat"], srid=4326)
        mode = data.get("mode", "drive")

        try:
            route = self._calculate_route(origin, destination, mode)
        except Exception as e:
            return Response(
                {"error": f"Route calculation failed: {str(e)}"},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        response_serializer = RouteResponseSerializer(route)
        return Response(response_serializer.data)

    def _calculate_route(self, origin, destination, mode="drive"):
        """
        Core routing logic — encapsulated as a private method.

        Uses raw SQL because pgRouting functions (pgr_dijkstra)
        are not accessible through Django ORM.
        Supports drive, walk, and bike modes with different speed profiles.
        Results are cached in Redis for 1 hour keyed by coords + mode.
        """
        cache_key = (
            "route_"
            + hashlib.md5(
                f"{origin.x},{origin.y},{destination.x},{destination.y},{mode}".encode()
            ).hexdigest()
        )
        cached = cache.get(cache_key)
        if cached:
            return cached

        speeds = self.SPEED_PROFILES.get(mode, self.SPEED_PROFILES["drive"])

        # Build SQL fragments for this mode
        speed_cases = " ".join(
            f"WHEN ''{hw}'' THEN {spd}" for hw, spd in speeds.items()
        )
        highway_list_sql = ",".join(f"''{hw}''" for hw in speeds.keys())
        highway_list_plain = ",".join(f"'{hw}'" for hw in speeds.keys())

        with connection.cursor() as cursor:
            # Step 1: Find nearest source node ON A ROAD for this mode
            cursor.execute(
                f"""
                SELECT source FROM planet_osm_line
                WHERE highway IN ({highway_list_plain})
                AND source IS NOT NULL
                ORDER BY way <-> ST_SetSRID(ST_MakePoint(%s, %s), 4326)
                LIMIT 1
            """,
                [origin.x, origin.y],
            )
            result = cursor.fetchone()
            if not result:
                raise ValueError("No road found near origin for this travel mode")
            source_node = result[0]

            # Step 2: Find nearest target node ON A ROAD for this mode
            cursor.execute(
                f"""
                SELECT source FROM planet_osm_line
                WHERE highway IN ({highway_list_plain})
                AND source IS NOT NULL
                ORDER BY way <-> ST_SetSRID(ST_MakePoint(%s, %s), 4326)
                LIMIT 1
            """,
                [destination.x, destination.y],
            )
            result = cursor.fetchone()
            if not result:
                raise ValueError("No road found near destination for this travel mode")
            target_node = result[0]

            # Step 3: Run Dijkstra with mode-specific speed-weighted cost
            cursor.execute(
                f"""
                SELECT 
                    ST_AsGeoJSON(ST_LineMerge(ST_Union(r.way))) AS route_geom,
                    SUM(ST_Length(r.way::geography)) / 1000 AS distance_km,
                    array_agg(r.name ORDER BY seq) AS street_names
                FROM pgr_dijkstra(
                    'SELECT gid AS id, source, target,
                            ST_Length(way::geography) / (
                                CASE highway
                                    {speed_cases}
                                    ELSE 30
                                END * 1000.0 / 3600
                            ) AS cost,
                            ST_Length(way::geography) / (
                                CASE highway
                                    {speed_cases}
                                    ELSE 30
                                END * 1000.0 / 3600
                            ) AS reverse_cost
                     FROM planet_osm_line
                     WHERE source IS NOT NULL AND target IS NOT NULL
                     AND highway IN ({highway_list_sql})',
                    %s, %s, directed := false
                ) AS di
                JOIN planet_osm_line r ON di.edge = r.gid
            """,
                [source_node, target_node],
            )

            row = cursor.fetchone()

            if not row or not row[0]:
                raise ValueError("No route found between these points")

            route_geojson = json.loads(row[0])
            distance_km = round(row[1], 2)
            street_names = [n for n in (row[2] or []) if n]

        # Calculate duration based on mode average speed
        avg_speed = self.AVG_SPEEDS.get(mode, 80)
        duration_min = round(distance_km / avg_speed * 60, 1)

        # Build turn-by-turn steps
        steps = self._build_steps(street_names)

        result = {
            "route": route_geojson,
            "distance_km": distance_km,
            "duration_min": duration_min,
            "steps": steps,
            "mode": mode,
        }
        cache.set(cache_key, result, timeout=3600)
        return result

    @staticmethod
    def _build_steps(street_names):
        """
        Generate simplified navigation steps from ordered street names.
        Groups consecutive segments on the same street.
        """
        if not street_names:
            return []

        steps = []
        current_street = street_names[0]
        segment_count = 1

        for name in street_names[1:]:
            if name == current_street:
                segment_count += 1
            else:
                steps.append(
                    {
                        "instruction": (
                            f"Continue on {current_street}"
                            if current_street
                            else "Continue ahead"
                        ),
                        "street": current_street or "Unknown road",
                    }
                )
                current_street = name
                segment_count = 1

        # Last street
        steps.append(
            {
                "instruction": (
                    f"Arrive via {current_street}"
                    if current_street
                    else "Arrive at destination"
                ),
                "street": current_street or "Unknown road",
            }
        )

        return steps


class IsochroneView(APIView):
    """
    Compute a road-network-reachable area (isochrone) from a click point.

    GET /api/routing/isochrone/?lat=40.64&lon=-8.65&max_cost=5000&mode=distance

    Pipeline:
        1. Snap click point to nearest graph vertex.
        2. Run pgr_drivingDistance over an edges SQL restricted to a bbox
           around the start (keeps the query fast on 1.9M vertices).
        3. Build a polygon hull (ConcaveHull, fallback ConvexHull) around
           reachable vertex geometries.
        4. Count hospitals/clinics that fall inside the hull.

    cost = ST_Length(way)            for mode=distance (meters)
    cost = ST_Length(way) / (v*0.2778) for mode=time (seconds, v in km/h)
    """

    SPEED_BY_HIGHWAY = {
        "motorway": 110,
        "motorway_link": 80,
        "trunk": 90,
        "trunk_link": 70,
        "primary": 70,
        "primary_link": 55,
        "secondary": 50,
        "tertiary": 45,
        "residential": 30,
        "living_street": 20,
        "service": 20,
        "unclassified": 40,
    }
    DEFAULT_SPEED = 40

    def get(self, request):
        serializer = IsochroneRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        lat = data["lat"]
        lon = data["lon"]
        max_cost = float(data["max_cost"])
        mode = data.get("mode", "distance")

        cache_key = "iso_" + hashlib.md5(
            f"{lat:.5f},{lon:.5f},{max_cost},{mode}".encode()
        ).hexdigest()
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        try:
            result = self._compute(lat, lon, max_cost, mode)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(
                {"error": f"Isochrone computation failed: {str(e)}"},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        cache.set(cache_key, result, timeout=3600)
        return Response(result)

    def _compute(self, lat, lon, max_cost, mode):
        # bbox radius in meters around start. The graph (planet_osm_line,
        # vertices) is stored in EPSG:4326 here, so we compute the bbox in
        # 3857 via ST_Expand and intersect against ST_Transform(way, 3857)
        # — that keeps the spatial check fast and metric-correct.
        if mode == "time":
            # max_cost is minutes — convert to seconds for pgr cost.
            cost_seconds = max_cost * 60.0
            # Headroom: 110 km/h ceiling on a motorway * 1.3 detour padding
            bbox_radius_m = (max_cost / 60.0) * 110_000.0 * 1.3
            edge_cost_expr = self._time_cost_expr()
            pgr_cost = cost_seconds
        else:
            bbox_radius_m = max_cost * 1.3  # 30% padding for road detour
            edge_cost_expr = "ST_Length(way::geography)"
            pgr_cost = max_cost

        # Hard cap so a buggy or huge max_cost can't explode the bbox.
        bbox_radius_m = max(500.0, min(bbox_radius_m, 30000.0))

        with connection.cursor() as cursor:
            # Hard statement timeout so the routing call cannot hang gunicorn
            # for more than 15s even under pathological input.
            cursor.execute("SET LOCAL statement_timeout = '15000'")

            # 1) Nearest graph vertex to click point (graph is in 4326)
            cursor.execute(
                """
                SELECT id
                FROM planet_osm_line_vertices_pgr
                ORDER BY the_geom <-> ST_SetSRID(ST_MakePoint(%s, %s), 4326)
                LIMIT 1
                """,
                [lon, lat],
            )
            row = cursor.fetchone()
            if not row:
                raise ValueError("No graph vertex found near click point")
            start_vid = row[0]

            # 2) Build edges SQL constrained to a metric bbox around the start.
            # We pre-resolve start_geom_3857 to a literal in the inlined SQL
            # because pgr_drivingDistance treats this as plain text and we
            # don't want PG to re-evaluate ST_Transform per edge.
            # Metric bbox: expand the start point in 3857 by radius_m, then
            # transform the bbox back to 4326 so it can use the GIST index on
            # planet_osm_line(way).
            bbox_4326 = (
                "ST_Transform("
                "  ST_Expand("
                f"    ST_Transform(ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326), 3857),"
                f"    {float(bbox_radius_m)}"
                "  ), 4326)"
            )
            edges_sql = (
                "SELECT gid AS id, source, target, "
                f"{edge_cost_expr} AS cost, "
                f"{edge_cost_expr} AS reverse_cost "
                "FROM planet_osm_line "
                "WHERE source IS NOT NULL AND target IS NOT NULL "
                "AND highway IS NOT NULL "
                f"AND way && {bbox_4326}"
            )

            cursor.execute(
                """
                WITH reachable AS (
                    SELECT dd.node
                    FROM pgr_drivingDistance(%s, %s, %s, directed := false) AS dd
                ),
                pts AS (
                    SELECT v.the_geom AS g
                    FROM reachable r
                    JOIN planet_osm_line_vertices_pgr v ON v.id = r.node
                ),
                pts_3857 AS (
                    SELECT ST_Transform(g, 3857) AS g FROM pts
                ),
                hull AS (
                    SELECT COALESCE(
                        ST_ConcaveHull(ST_Collect(g), 0.8),
                        ST_ConvexHull(ST_Collect(g))
                    ) AS geom_3857
                    FROM pts_3857
                ),
                hull_4326 AS (
                    SELECT ST_Transform(geom_3857, 4326) AS geom FROM hull
                )
                SELECT
                    ST_AsGeoJSON(geom),
                    (
                        SELECT COUNT(*)
                        FROM planet_osm_point p, hull_4326 h
                        WHERE p.amenity IN ('hospital','clinic')
                        AND ST_Contains(h.geom, p.way)
                    )
                FROM hull_4326
                """,
                [edges_sql, int(start_vid), float(pgr_cost)],
            )
            row = cursor.fetchone()

        if not row or not row[0]:
            raise ValueError("No reachable area found from this point")

        hull_geojson = json.loads(row[0])
        facilities = int(row[1] or 0)

        return {
            "isochrone": hull_geojson,
            "reachable_facilities": facilities,
            "max_cost": max_cost,
            "mode": mode,
        }

    @classmethod
    def _time_cost_expr(cls):
        # Builds a CASE returning seconds for a road segment.
        # cost = ST_Length(way::geography) / (speed_kmh * 0.2778)
        cases = " ".join(
            f"WHEN '{hw}' THEN {spd}"
            for hw, spd in cls.SPEED_BY_HIGHWAY.items()
        )
        return (
            "ST_Length(way::geography) / (("
            f"CASE highway {cases} ELSE {cls.DEFAULT_SPEED} END"
            ") * 0.2778)"
        )


class GeocodeView(APIView):
    """
    Proxy geocoding requests to Nominatim.

    GET /api/routing/geocode/?q=Praca+do+Comercio+Lisboa

    We proxy instead of calling Nominatim directly from the frontend
    because:
        1. Nominatim has strict usage policies — one server = one User-Agent
        2. We can cache results in the future
        3. Frontend doesn't need to know about external dependencies
    """

    NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

    def get(self, request):
        serializer = GeocodeRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        response = requests.get(
            self.NOMINATIM_URL,
            params={
                "q": serializer.validated_data["q"],
                "format": "json",
                "limit": 5,
                "countrycodes": "pt",
                "addressdetails": 1,
            },
            headers={
                "User-Agent": "RoutaPT/1.0 (university project)",
            },
        )
        response.raise_for_status()

        results = [
            {
                "display_name": item["display_name"],
                "lat": float(item["lat"]),
                "lon": float(item["lon"]),
            }
            for item in response.json()
        ]

        return Response(results)
