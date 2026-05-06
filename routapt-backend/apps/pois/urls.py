from django.urls import path
from . import views

app_name = "pois"

urlpatterns = [
    path("", views.POIListView.as_view(), name="list"),
    path("cameras/", views.SpeedCameraListView.as_view(), name="cameras"),
    path("near-route/", views.NearRouteView.as_view(), name="near-route"),
    path("search/", views.POISearchView.as_view(), name="search"),
]
