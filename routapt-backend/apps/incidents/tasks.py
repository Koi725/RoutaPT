from celery import shared_task
from django.utils import timezone


@shared_task
def cleanup_expired_incidents():
    from .models import Incident

    expired = Incident.objects.filter(
        expires_at__lt=timezone.now(),
        is_active=True,
    )
    count = expired.update(is_active=False)
    return f"Deactivated {count} expired incidents"
