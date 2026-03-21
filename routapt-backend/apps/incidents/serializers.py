from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from .models import Incident


class IncidentSerializer(GeoFeatureModelSerializer):
    """Full incident representation as GeoJSON Feature."""

    is_verified = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = Incident
        geo_field = "location"
        fields = (
            "id",
            "incident_type",
            "severity",
            "description",
            "confirmations",
            "dismissals",
            "is_active",
            "is_verified",
            "is_expired",
            "created_at",
            "expires_at",
        )
        read_only_fields = (
            "id",
            "confirmations",
            "dismissals",
            "is_active",
            "created_at",
            "expires_at",
        )


class IncidentCreateSerializer(serializers.Serializer):
    """
    Separate serializer for incident creation.

    Why not use IncidentSerializer for both read and write?
    Because the input shape differs from the output shape.
    Creating needs lat/lon floats. Reading returns GeoJSON geometry.
    Mixing both in one serializer leads to messy conditional logic.
    """

    incident_type = serializers.ChoiceField(choices=Incident.Type.choices)
    severity = serializers.ChoiceField(
        choices=Incident.Severity.choices,
        default=Incident.Severity.MEDIUM,
    )
    description = serializers.CharField(max_length=500, required=False, default="")
    lat = serializers.FloatField(min_value=-90, max_value=90)
    lon = serializers.FloatField(min_value=-180, max_value=180)


class IncidentBBoxSerializer(serializers.Serializer):
    """Validates bounding box query for incident listing."""

    sw_lat = serializers.FloatField(min_value=-90, max_value=90)
    sw_lon = serializers.FloatField(min_value=-180, max_value=180)
    ne_lat = serializers.FloatField(min_value=-90, max_value=90)
    ne_lon = serializers.FloatField(min_value=-180, max_value=180)
    incident_type = serializers.CharField(required=False, default="all")
