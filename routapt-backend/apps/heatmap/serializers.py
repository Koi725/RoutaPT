from rest_framework import serializers


class HeatmapPointSerializer(serializers.Serializer):
    """Single heatmap data point."""

    lat = serializers.FloatField()
    lon = serializers.FloatField()
    weight = serializers.IntegerField()


class RoadDensityQuerySerializer(serializers.Serializer):
    """Validates road density heatmap parameters."""

    resolution = serializers.FloatField(
        default=0.01,
        min_value=0.001,
        max_value=0.1,
        help_text="Grid cell size in degrees. 0.01 ≈ 1km",
    )


class IncidentDensityQuerySerializer(serializers.Serializer):
    """Validates incident density heatmap parameters."""

    days = serializers.IntegerField(
        default=30,
        min_value=1,
        max_value=365,
        help_text="Look-back period in days",
    )


class NetworkStatsSerializer(serializers.Serializer):
    """Road network statistics response."""

    total_km = serializers.FloatField()
    total_segments = serializers.IntegerField()
    breakdown = serializers.ListField(child=serializers.DictField())
