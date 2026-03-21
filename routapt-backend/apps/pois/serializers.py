from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from .models import PointOfInterest, SpeedCamera


class POISerializer(GeoFeatureModelSerializer):
    """GeoJSON serializer for points of interest."""

    category = serializers.CharField(read_only=True)

    class Meta:
        model = PointOfInterest
        geo_field = "way"
        fields = ("osm_id", "name", "amenity", "category")


class SpeedCameraSerializer(GeoFeatureModelSerializer):
    """GeoJSON serializer for speed cameras."""

    class Meta:
        model = SpeedCamera
        geo_field = "location"
        fields = ("osm_id", "speed_limit", "direction")


class POIQuerySerializer(serializers.Serializer):
    """Validates POI search parameters."""

    sw_lat = serializers.FloatField(min_value=-90, max_value=90)
    sw_lon = serializers.FloatField(min_value=-180, max_value=180)
    ne_lat = serializers.FloatField(min_value=-90, max_value=90)
    ne_lon = serializers.FloatField(min_value=-180, max_value=180)
    category = serializers.CharField(required=False, default="all")


class NearRouteQuerySerializer(serializers.Serializer):
    """Validates POI-near-route search parameters."""

    route_geojson = serializers.JSONField(
        help_text="GeoJSON LineString of the active route"
    )
    buffer_m = serializers.IntegerField(default=500, min_value=100, max_value=5000)
    category = serializers.CharField(required=False, default="all")
