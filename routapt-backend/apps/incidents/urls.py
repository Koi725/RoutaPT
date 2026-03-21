from django.urls import path
from . import views

app_name = "incidents"

urlpatterns = [
    path("", views.IncidentListCreateView.as_view(), name="list-create"),
    path("<int:pk>/", views.IncidentDetailView.as_view(), name="detail"),
    path("<int:pk>/vote/", views.IncidentVoteView.as_view(), name="vote"),
]
