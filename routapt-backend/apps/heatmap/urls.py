from django.urls import path
from . import views

app_name = "heatmap"

urlpatterns = [
    path("roads/", views.RoadDensityView.as_view(), name="road-density"),
    path("incidents/", views.IncidentDensityView.as_view(), name="incident-density"),
    path("stats/", views.NetworkStatsView.as_view(), name="network-stats"),
]
