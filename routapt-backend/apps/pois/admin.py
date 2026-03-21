from django.contrib.gis import admin
from .models import SpeedCamera


@admin.register(SpeedCamera)
class SpeedCameraAdmin(admin.GISModelAdmin):
    list_display = ("osm_id", "speed_limit", "direction", "created_at")
    list_filter = ("speed_limit",)
    search_fields = ("osm_id",)
