from django.urls import path
from . import views

app_name = "routing"

urlpatterns = [
    path("route/", views.RouteView.as_view(), name="route"),
    path("geocode/", views.GeocodeView.as_view(), name="geocode"),
]
