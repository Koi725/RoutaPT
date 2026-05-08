from django.contrib.gis.db import models


class Road(models.Model):
    """
    Unmanaged model mapping to the road network imported by osm2pgsql.

    osm2pgsql creates 'planet_osm_line' with all linear features.
    This model filters to routable highway types only via a custom manager.
    pgRouting topology adds 'source' and 'target' node columns.
    """

    gid = models.IntegerField(primary_key=True)
    osm_id = models.BigIntegerField()
    name = models.CharField(max_length=255, blank=True, null=True)
    highway = models.CharField(max_length=64, blank=True, null=True)
    ref = models.CharField(max_length=64, blank=True, null=True)
    maxspeed = models.CharField(max_length=32, blank=True, null=True)
    oneway = models.CharField(max_length=8, blank=True, null=True)
    way = models.LineStringField(srid=4326)

    # pgRouting topology columns (added by pgr_createTopology)
    source = models.IntegerField(blank=True, null=True)
    target = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "planet_osm_line"

    def __str__(self):
        return f"{self.highway}: {self.name or 'unnamed'} ({self.osm_id})"

    @property
    def speed_limit(self):
        """Parse maxspeed tag to integer km/h with sensible defaults."""
        defaults = {
            "motorway": 120,
            "trunk": 100,
            "primary": 90,
            "secondary": 70,
            "tertiary": 50,
            "residential": 30,
            "unclassified": 50,
            "living_street": 20,
        }
        if self.maxspeed and self.maxspeed.isdigit():
            return int(self.maxspeed)
        return defaults.get(self.highway, 50)


class RoadNode(models.Model):
    """
    Unmanaged model for pgRouting topology nodes.

    Created by pgr_createTopology() — each node is an intersection
    point in the road network graph.
    """

    id = models.BigIntegerField(primary_key=True)
    the_geom = models.PointField(srid=4326)

    class Meta:
        managed = False
        db_table = "planet_osm_line_vertices_pgr"

    def __str__(self):
        return f"Node {self.pk}"
