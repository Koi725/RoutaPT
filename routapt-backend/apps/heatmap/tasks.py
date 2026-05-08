from celery import shared_task
from django.core.cache import cache

from .services import HeatmapService


@shared_task
def prefetch_heatmap_data():
    """Pre-compute and cache heatmap data so requests are instant."""
    road_data = HeatmapService.road_density(resolution=0.01)
    cache.set("heatmap_roads_0.01", road_data, timeout=3600)

    stats = HeatmapService.network_stats()
    cache.set("network_stats", stats, timeout=3600)

    return f"Cached {len(road_data)} road density points + network stats"
