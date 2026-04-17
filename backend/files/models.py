import uuid
import os
from django.db import models
from django.conf import settings
from folders.models import Folder


def upload_to(instance, filename):
    ext = filename.rsplit('.', 1)[-1] if '.' in filename else ''
    return f'files/{instance.user.id}/{uuid.uuid4().hex}.{ext}'


class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to=upload_to)
    filename = models.CharField(max_length=500)
    size = models.BigIntegerField(default=0)
    mime_type = models.CharField(max_length=200, blank=True)
    hash = models.CharField(max_length=64, db_index=True, blank=True)

    folder = models.ForeignKey(
        Folder, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='files'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='files'
    )

    is_public = models.BooleanField(default=False)
    share_token = models.UUIDField(default=uuid.uuid4, unique=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    is_starred = models.BooleanField(default=False, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_deleted']),
            models.Index(fields=['user', 'is_starred']),
            models.Index(fields=['hash']),
        ]

    def __str__(self):
        return self.filename

    @property
    def extension(self):
        return self.filename.rsplit('.', 1)[-1].lower() if '.' in self.filename else ''

    @property
    def is_image(self):
        return self.extension in ('jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg')

    @property
    def is_pdf(self):
        return self.extension == 'pdf'

    @property
    def preview_url(self):
        if (self.is_image or self.is_pdf) and self.file:
            return self.file.url
        return None


class FileShare(models.Model):
    """Specific user access permissions for a file"""
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name='shares')
    shared_with = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='shared_files'
    )
    can_download = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('file', 'shared_with')

    def __str__(self):
        return f"{self.file.filename} -> {self.shared_with.email}"


class ChunkUpload(models.Model):
    """Track chunked file uploads"""
    upload_id = models.UUIDField(default=uuid.uuid4, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    filename = models.CharField(max_length=500)
    total_size = models.BigIntegerField()
    total_chunks = models.IntegerField()
    uploaded_chunks = models.JSONField(default=list)
    folder = models.ForeignKey(Folder, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.filename} ({len(self.uploaded_chunks)}/{self.total_chunks})"
