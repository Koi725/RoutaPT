from django.contrib.gis.db import models
from django.utils import timezone
from datetime import timedelta


class IncidentManager(models.Manager):
    """Custom manager for common incident queries."""

    def active(self):
        """Return only non-expired, non-dismissed incidents."""
        return self.get_queryset().filter(
            is_active=True,
            expires_at__gt=timezone.now(),
        )

    def in_bbox(self, sw_lon, sw_lat, ne_lon, ne_lat):
        """Return active incidents within a bounding box."""
        from django.contrib.gis.geos import Polygon

        bbox = Polygon.from_bbox((sw_lon, sw_lat, ne_lon, ne_lat))
        return self.active().filter(location__within=bbox)


class Incident(models.Model):
    """
    User-reported road incident with spatial location.

    Incidents auto-expire after a configurable duration.
    Crowd validation: confirmations boost visibility,
    dismissals above threshold deactivate the incident.
    """

    class Type(models.TextChoices):
        ACCIDENT = "accident", "Accident"
        ROADWORK = "roadwork", "Road work"
        HAZARD = "hazard", "Hazard on road"
        POLICE = "police", "Police presence"
        CLOSURE = "closure", "Road closure"
        TRAFFIC = "traffic", "Heavy traffic"
        WEATHER = "weather", "Weather hazard"

    class Severity(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    # Expiration defaults per type (in hours)
    EXPIRY_HOURS = {
        "accident": 2,
        "roadwork": 48,
        "hazard": 6,
        "police": 1,
        "closure": 24,
        "traffic": 1,
        "weather": 12,
    }

    DISMISS_THRESHOLD = 3

    incident_type = models.CharField(max_length=16, choices=Type.choices)
    severity = models.CharField(
        max_length=16, choices=Severity.choices, default=Severity.MEDIUM
    )
    description = models.TextField(max_length=500, blank=True)
    location = models.PointField(srid=4326)
    confirmations = models.PositiveIntegerField(default=0)
    dismissals = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    objects = IncidentManager()

    class Meta:
        db_table = "incidents"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["is_active", "expires_at"]),
            models.Index(fields=["incident_type"]),
        ]

    def __str__(self):
        return f"{self.get_incident_type_display()} at ({self.location.y:.4f}, {self.location.x:.4f})"

    def save(self, *args, **kwargs):
        """Auto-set expiration based on incident type if not provided."""
        if not self.expires_at:
            hours = self.EXPIRY_HOURS.get(self.incident_type, 6)
            self.expires_at = timezone.now() + timedelta(hours=hours)
        super().save(*args, **kwargs)

    def confirm(self):
        """Increment confirmation count."""
        self.confirmations = models.F("confirmations") + 1
        self.save(update_fields=["confirmations"])

    def dismiss(self):
        """Increment dismissal count. Deactivate if threshold reached."""
        self.dismissals = models.F("dismissals") + 1
        if self.dismissals + 1 >= self.DISMISS_THRESHOLD:
            self.is_active = False
            self.save(update_fields=["dismissals", "is_active"])
        else:
            self.save(update_fields=["dismissals"])

    @property
    def is_verified(self):
        """An incident is verified when it has 3+ confirmations."""
        return self.confirmations >= 3

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at
