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

    GET /api/routing/route/?from_lat=38.70&from_lon=-9.13&to_lat=41.14&to_lon=-8.61

    Pipeline:
        1. Validate coordinates via serializer
        2. Find nearest graph nodes on actual roads
        3. Run pgr_dijkstra on the road network
        4. Merge edge geometries into a single LineString
        5. Return GeoJSON + distance + estimated duration
    """

    def get(self, request):
        serializer = RouteRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        origin = Point(data["from_lon"], data["from_lat"], srid=4326)
        destination = Point(data["to_lon"], data["to_lat"], srid=4326)

        try:
            route = self._calculate_route(origin, destination)
        except Exception as e:
            return Response(
                {"error": f"Route calculation failed: {str(e)}"},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        response_serializer = RouteResponseSerializer(route)
        return Response(response_serializer.data)

    def _calculate_route(self, origin, destination):
        """
        Core routing logic — encapsulated as a private method.

        Uses raw SQL because pgRouting functions (pgr_dijkstra)
        are not accessible through Django ORM.
        """
        with connection.cursor() as cursor:
            # Step 1: Find nearest source node ON A ROAD
            cursor.execute(
                """
                SELECT source FROM planet_osm_line
                WHERE highway IS NOT NULL AND source IS NOT NULL
                ORDER BY way <-> ST_SetSRID(ST_MakePoint(%s, %s), 4326)
                LIMIT 1
            """,
                [origin.x, origin.y],
            )
            source_node = cursor.fetchone()[0]

            # Step 2: Find nearest target node ON A ROAD
            cursor.execute(
                """
                SELECT source FROM planet_osm_line
                WHERE highway IS NOT NULL AND source IS NOT NULL
                ORDER BY way <-> ST_SetSRID(ST_MakePoint(%s, %s), 4326)
                LIMIT 1
            """,
                [destination.x, destination.y],
            )
            target_node = cursor.fetchone()[0]

            # Step 3: Run Dijkstra shortest path
            cursor.execute(
                """
                SELECT 
                    ST_AsGeoJSON(ST_LineMerge(ST_Union(r.way))) AS route_geom,
                    SUM(ST_Length(r.way::geography)) / 1000 AS distance_km,
                    array_agg(r.name ORDER BY seq) AS street_names
                FROM pgr_dijkstra(
                    'SELECT gid AS id, source, target,
                            ST_Length(way::geography) AS cost,
                            ST_Length(way::geography) AS reverse_cost
                     FROM planet_osm_line
                     WHERE source IS NOT NULL AND target IS NOT NULL
                     AND highway IS NOT NULL',
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

        # Estimate duration based on average 60 km/h
        duration_min = round((distance_km / 60) * 60, 1)

        # Build turn-by-turn steps
        steps = self._build_steps(street_names)

        return {
            "route": route_geojson,
            "distance_km": distance_km,
            "duration_min": duration_min,
            "steps": steps,
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
