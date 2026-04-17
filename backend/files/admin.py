from django.contrib import admin
from .models import File, FileShare, ChunkUpload

@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ('filename', 'user', 'size', 'mime_type', 'folder', 'is_public', 'is_deleted', 'is_starred', 'created_at')
    list_filter = ('is_deleted', 'is_starred', 'is_public', 'mime_type')
    search_fields = ('filename', 'user__email', 'hash')
    readonly_fields = ('id', 'hash', 'size', 'share_token', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

@admin.register(FileShare)
class FileShareAdmin(admin.ModelAdmin):
    list_display = ('file', 'shared_with', 'can_download', 'created_at')
    search_fields = ('file__filename', 'shared_with__email')

@admin.register(ChunkUpload)
class ChunkUploadAdmin(admin.ModelAdmin):
    list_display = ('filename', 'user', 'total_chunks', 'created_at')
    readonly_fields = ('upload_id', 'created_at')
