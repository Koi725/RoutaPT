from django.contrib.gis import admin
from .models import Road, RoadNode


@admin.register(Road)
class RoadAdmin(admin.GISModelAdmin):
    list_display = ("osm_id", "name", "highway", "maxspeed", "oneway")
    list_filter = ("highway", "oneway")
    search_fields = ("name", "osm_id")
    readonly_fields = (
        "osm_id",
        "name",
        "highway",
        "ref",
        "maxspeed",
        "oneway",
        "source",
        "target",
    )


@admin.register(RoadNode)
class RoadNodeAdmin(admin.GISModelAdmin):
    list_display = ("pk",)
    readonly_fields = ("the_geom",)
