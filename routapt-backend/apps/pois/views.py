from django.contrib.gis.geos import Polygon, GEOSGeometry
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import connection

from .models import PointOfInterest, SpeedCamera
from .serializers import (
    POISerializer,
    SpeedCameraSerializer,
    POIQuerySerializer,
    NearRouteQuerySerializer,
)

import json


class POIListView(APIView):
    """
    Get points of interest within a map bounding box.

    GET /api/pois/?sw_lat=38.7&sw_lon=-9.2&ne_lat=38.8&ne_lon=-9.1&category=fuel

    Returns GeoJSON FeatureCollection filtered by bbox and optional category.
    The frontend calls this whenever the map viewport changes.
    """

    def get(self, request):
        serializer = POIQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        bbox = Polygon.from_bbox(
            (
                data["sw_lon"],
                data["sw_lat"],
                data["ne_lon"],
                data["ne_lat"],
            )
        )

        queryset = PointOfInterest.objects.filter(
            way__within=bbox,
            amenity__isnull=False,
        )

        if data["category"] != "all":
            tags = PointOfInterest.CATEGORY_MAPPING.get(data["category"], [])
            if tags:
                queryset = queryset.filter(amenity__in=tags)

        # Limit results to prevent overloading the frontend
        queryset = queryset[:200]

        return Response(POISerializer(queryset, many=True).data)


class SpeedCameraListView(APIView):
    """
    Get speed cameras within a map bounding box.

    GET /api/pois/cameras/?sw_lat=38.7&sw_lon=-9.2&ne_lat=38.8&ne_lon=-9.1

    Queries planet_osm_point directly because the OSM import does not
    populate the managed speed_cameras table for Portugal.
    """

    def get(self, request):
        serializer = POIQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT osm_id, name,
                    COALESCE(tags->'maxspeed', '') AS speed_limit,
                    ST_Y(way) AS lat, ST_X(way) AS lon
                FROM planet_osm_point
                WHERE (highway = 'speed_camera'
                    OR amenity = 'speed_camera'
                    OR (tags ? 'enforcement'))
                AND way && ST_MakeEnvelope(%s, %s, %s, %s, 4326)
                LIMIT 100
            """,
                [data["sw_lon"], data["sw_lat"], data["ne_lon"], data["ne_lat"]],
            )

            features = []
            for row in cursor.fetchall():
                features.append(
                    {
                        "type": "Feature",
                        "properties": {
                            "osm_id": row[0],
                            "name": row[1],
                            "speed_limit": row[2],
                        },
                        "geometry": {
                            "type": "Point",
                            "coordinates": [row[4], row[3]],
                        },
                    }
                )

        return Response({"type": "FeatureCollection", "features": features})


class NearRouteView(APIView):
    """
    Find POIs and cameras within a buffer distance of an active route.

    POST /api/pois/near-route/
    Body: { "route_geojson": {...}, "buffer_m": 500, "category": "fuel" }

    This powers the "alerts along your route" feature.
    ST_DWithin creates a corridor around the route LineString.
    """

    def post(self, request):
        serializer = NearRouteQuerySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        route_geom = GEOSGeometry(json.dumps(data["route_geojson"]), srid=4326)
        buffer_m = data["buffer_m"]

        # POIs near route
        pois = PointOfInterest.objects.filter(
            way__dwithin=(route_geom, buffer_m / 111320),  # degrees approx
            amenity__isnull=False,
        )

        if data["category"] != "all":
            tags = PointOfInterest.CATEGORY_MAPPING.get(data["category"], [])
            if tags:
                pois = pois.filter(amenity__in=tags)

        # Cameras near route
        cameras = SpeedCamera.objects.filter(
            location__dwithin=(route_geom, buffer_m / 111320),
        )

        return Response(
            {
                "pois": POISerializer(pois[:100], many=True).data,
                "cameras": SpeedCameraSerializer(cameras, many=True).data,
            }
        )


class POISearchView(APIView):
    """
    Search POIs by name in the database.

    GET /api/pois/search/?q=norte+shopping
    """

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if len(query) < 2:
            return Response([])

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT 
                    name,
                    COALESCE(amenity, tourism, shop, '') AS category,
                    ST_Y(way) AS lat,
                    ST_X(way) AS lon
                FROM planet_osm_point
                WHERE name ILIKE %s
                AND name IS NOT NULL
                ORDER BY name
                LIMIT 10
            """,
                [f"%{query}%"],
            )

            results = [
                {
                    "display_name": row[0],
                    "category": row[1],
                    "lat": row[2],
                    "lon": row[3],
                }
                for row in cursor.fetchall()
            ]

        return Response(results)
