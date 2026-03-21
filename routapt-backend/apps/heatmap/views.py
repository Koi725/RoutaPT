from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    HeatmapPointSerializer,
    RoadDensityQuerySerializer,
    IncidentDensityQuerySerializer,
    NetworkStatsSerializer,
)
from .services import HeatmapService


class RoadDensityView(APIView):
    """
    Road network density heatmap data.

    GET /api/heatmap/roads/?resolution=0.01

    Returns a grid of points with density weights.
    Frontend renders this with leaflet.heat plugin.
    """

    def get(self, request):
        serializer = RoadDensityQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        points = HeatmapService.road_density(
            resolution=serializer.validated_data["resolution"],
        )

        return Response(HeatmapPointSerializer(points, many=True).data)


class IncidentDensityView(APIView):
    """
    Incident density heatmap data.

    GET /api/heatmap/incidents/?days=30

    Shows where incidents concentrate over time.
    Useful for identifying accident-prone zones.
    """

    def get(self, request):
        serializer = IncidentDensityQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        points = HeatmapService.incident_density(
            days=serializer.validated_data["days"],
        )

        return Response(HeatmapPointSerializer(points, many=True).data)


class NetworkStatsView(APIView):
    """
    Aggregate road network statistics.

    GET /api/heatmap/stats/

    Returns total km, segment count, and breakdown by road type.
    Used by the analytics sidebar on the frontend.
    """

    def get(self, request):
        stats = HeatmapService.network_stats()
        return Response(NetworkStatsSerializer(stats).data)
