from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/routing/", include("apps.routing.urls")),
    path("api/pois/", include("apps.pois.urls")),
    path("api/incidents/", include("apps.incidents.urls")),
    path("api/heatmap/", include("apps.heatmap.urls")),
]
