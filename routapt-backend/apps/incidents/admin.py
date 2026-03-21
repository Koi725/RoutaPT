from django.contrib.gis import admin
from .models import Incident


@admin.register(Incident)
class IncidentAdmin(admin.GISModelAdmin):
    list_display = (
        "id",
        "incident_type",
        "severity",
        "confirmations",
        "dismissals",
        "is_active",
        "created_at",
        "expires_at",
    )
    list_filter = ("incident_type", "severity", "is_active")
    search_fields = ("description",)
    readonly_fields = ("created_at",)

    def get_queryset(self, request):
        """Show all incidents in admin, not just active ones."""
        return super().get_queryset(request).all()
