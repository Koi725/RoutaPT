from django.contrib.gis.geos import Point
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Incident
from .serializers import (
    IncidentSerializer,
    IncidentCreateSerializer,
    IncidentBBoxSerializer,
)


class IncidentListCreateView(APIView):
    """
    List active incidents in viewport or create a new one.

    GET  /api/incidents/?sw_lat=38.7&sw_lon=-9.2&ne_lat=38.8&ne_lon=-9.1
    POST /api/incidents/
    """

    def get(self, request):
        serializer = IncidentBBoxSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        queryset = Incident.objects.in_bbox(
            data["sw_lon"],
            data["sw_lat"],
            data["ne_lon"],
            data["ne_lat"],
        )

        if data["incident_type"] != "all":
            queryset = queryset.filter(incident_type=data["incident_type"])

        return Response(IncidentSerializer(queryset, many=True).data)

    def post(self, request):
        serializer = IncidentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        incident = Incident.objects.create(
            incident_type=data["incident_type"],
            severity=data["severity"],
            description=data["description"],
            location=Point(data["lon"], data["lat"], srid=4326),
        )

        return Response(
            IncidentSerializer(incident).data,
            status=status.HTTP_201_CREATED,
        )


class IncidentDetailView(APIView):
    """
    Retrieve a single incident by ID.

    GET /api/incidents/42/
    """

    def get(self, request, pk):
        try:
            incident = Incident.objects.get(pk=pk)
        except Incident.DoesNotExist:
            return Response(
                {"error": "Incident not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(IncidentSerializer(incident).data)


class IncidentVoteView(APIView):
    """
    Confirm or dismiss an incident.

    POST /api/incidents/42/vote/
    Body: { "vote": "confirm" } or { "vote": "dismiss" }

    Uses the model's confirm() and dismiss() methods
    which handle atomic updates and threshold logic internally.
    """

    def post(self, request, pk):
        try:
            incident = Incident.objects.get(pk=pk, is_active=True)
        except Incident.DoesNotExist:
            return Response(
                {"error": "Active incident not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        vote = request.data.get("vote")

        if vote == "confirm":
            incident.confirm()
        elif vote == "dismiss":
            incident.dismiss()
        else:
            return Response(
                {"error": 'Vote must be "confirm" or "dismiss"'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        incident.refresh_from_db()
        return Response(IncidentSerializer(incident).data)
