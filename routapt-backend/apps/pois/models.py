from django.contrib.gis.db import models


class PointOfInterest(models.Model):
    """
    Unmanaged model mapping to POIs imported from OpenStreetMap.

    Reads from planet_osm_point, filtered by amenity/tourism tags.
    Categories are derived from OSM tags at query time.
    """

    CATEGORY_MAPPING = {
        "fuel": ["fuel"],
        "hospital": ["hospital", "clinic"],
        "police": ["police"],
        "parking": ["parking"],
        "restaurant": ["restaurant", "fast_food", "cafe"],
        "hotel": ["hotel", "hostel", "guest_house"],
        "pharmacy": ["pharmacy"],
        "bank": ["bank", "atm"],
    }

    osm_id = models.BigIntegerField(primary_key=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    amenity = models.CharField(max_length=64, blank=True, null=True)
    tourism = models.CharField(max_length=64, blank=True, null=True)
    shop = models.CharField(max_length=64, blank=True, null=True)
    way = models.PointField(srid=4326)

    class Meta:
        managed = False
        db_table = "planet_osm_point"

    def __str__(self):
        return f"{self.amenity or self.tourism or 'POI'}: {self.name or 'unnamed'}"

    @property
    def category(self):
        """Resolve OSM tags into a clean category string."""
        tag = self.amenity or self.tourism or self.shop or ""
        for category, tags in self.CATEGORY_MAPPING.items():
            if tag in tags:
                return category
        return "other"


class SpeedCamera(models.Model):
    """
    Managed model for speed camera locations.

    Unlike POIs, this is a managed table because we extract and
    clean camera data from OSM into our own structure during import.
    This gives us proper typed fields instead of raw OSM tags.
    """

    osm_id = models.BigIntegerField(unique=True)
    speed_limit = models.IntegerField(null=True, blank=True)
    direction = models.CharField(max_length=32, blank=True, null=True)
    location = models.PointField(srid=4326)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "speed_cameras"
        ordering = ["speed_limit"]

    def __str__(self):
        return f"Camera {self.osm_id} — {self.speed_limit} km/h"
