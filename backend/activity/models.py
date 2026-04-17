from django.db import models
from django.conf import settings


class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ('upload', 'Upload'),
        ('download', 'Download'),
        ('delete', 'Delete'),
        ('restore', 'Restore'),
        ('share', 'Share'),
        ('rename', 'Rename'),
        ('move', 'Move'),
        ('star', 'Star'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='activities'
    )
    file = models.ForeignKey(
        'files.File',
        on_delete=models.SET_NULL,
        null=True,
        related_name='activities'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['file', 'action']),
        ]

    def __str__(self):
        return f"{self.user.email} {self.action} at {self.timestamp}"
