from django.db import connection


class HeatmapService:
    """
    Encapsulates all spatial aggregation queries for heatmap data.

    Raw SQL is necessary here because these are pure PostGIS
    aggregations that have no Django ORM equivalent.
    Each method returns a list of dicts ready for JSON serialization.
    """

    @staticmethod
    def road_density(resolution=0.01):
        """
        Aggregate road segments into a density grid.

        ST_SnapToGrid groups nearby road centroids into cells.
        resolution=0.01 degrees is roughly 1km cells.
        Returns: [{ lat, lon, weight }, ...]
        """
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT 
                    ST_Y(centroid) AS lat,
                    ST_X(centroid) AS lon,
                    count AS weight
                FROM (
                    SELECT 
                        ST_SnapToGrid(ST_Centroid(way), %s) AS centroid,
                        COUNT(*) AS count
                    FROM planet_osm_line
                    WHERE highway IS NOT NULL
                    GROUP BY centroid
                    HAVING COUNT(*) > 1
                ) AS grid
                ORDER BY count DESC
                LIMIT 5000
            """,
                [resolution],
            )

            return [
                {"lat": row[0], "lon": row[1], "weight": row[2]}
                for row in cursor.fetchall()
            ]

    @staticmethod
    def incident_density(days=30):
        """
        Aggregate incidents by location over a time period.

        Groups nearby incidents using ST_SnapToGrid.
        Returns: [{ lat, lon, weight }, ...]
        """
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT 
                    ST_Y(centroid) AS lat,
                    ST_X(centroid) AS lon,
                    count AS weight
                FROM (
                    SELECT 
                        ST_SnapToGrid(location, 0.005) AS centroid,
                        COUNT(*) AS count
                    FROM incidents
                    WHERE created_at > NOW() - INTERVAL '%s days'
                    GROUP BY centroid
                ) AS grid
                ORDER BY count DESC
                LIMIT 2000
            """,
                [days],
            )

            return [
                {"lat": row[0], "lon": row[1], "weight": row[2]}
                for row in cursor.fetchall()
            ]

    @staticmethod
    def network_stats():
        """
        Aggregate statistics about the Portuguese road network.

        Returns total km, road count, and breakdown by type.
        """
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT 
                    highway,
                    COUNT(*) AS segment_count,
                    ROUND(SUM(ST_Length(way::geography)) / 1000) AS total_km
                FROM planet_osm_line
                WHERE highway IN (
                    'motorway','trunk','primary','secondary',
                    'tertiary','residential','unclassified',
                    'motorway_link','trunk_link','primary_link'
                )
                GROUP BY highway
                ORDER BY total_km DESC
            """
            )

            breakdown = [
                {
                    "highway_type": row[0],
                    "segment_count": row[1],
                    "total_km": float(row[2]),
                }
                for row in cursor.fetchall()
            ]

            total_km = sum(item["total_km"] for item in breakdown)
            total_segments = sum(item["segment_count"] for item in breakdown)

            return {
                "total_km": round(total_km, 1),
                "total_segments": total_segments,
                "breakdown": breakdown,
            }
