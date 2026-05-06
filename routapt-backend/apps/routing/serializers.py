from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer


class RouteRequestSerializer(serializers.Serializer):
    """Validates incoming route calculation requests."""

    from_lat = serializers.FloatField(min_value=-90, max_value=90)
    from_lon = serializers.FloatField(min_value=-180, max_value=180)
    to_lat = serializers.FloatField(min_value=-90, max_value=90)
    to_lon = serializers.FloatField(min_value=-180, max_value=180)
    mode = serializers.ChoiceField(
        choices=["drive", "walk", "bike"],
        default="drive",
        required=False,
    )


class RouteResponseSerializer(serializers.Serializer):
    """Structures the route calculation response."""

    route = serializers.JSONField()
    distance_km = serializers.FloatField()
    duration_min = serializers.FloatField()
    steps = serializers.ListField(child=serializers.DictField())
    mode = serializers.CharField(default="drive")


class GeocodeRequestSerializer(serializers.Serializer):
    """Validates geocoding search requests."""

    q = serializers.CharField(
        max_length=255, help_text="Address or place name to search"
    )
