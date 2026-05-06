from django.contrib.gis.geos import Point
from django.db import connection
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    RouteRequestSerializer,
    RouteResponseSerializer,
    GeocodeRequestSerializer,
)

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
        """
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

        return {
            "route": route_geojson,
            "distance_km": distance_km,
            "duration_min": duration_min,
            "steps": steps,
            "mode": mode,
        }

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
