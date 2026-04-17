from rest_framework import serializers
from django.conf import settings
from .models import File, FileShare, ChunkUpload


class FileSerializer(serializers.ModelSerializer):
    extension = serializers.ReadOnlyField()
    is_image = serializers.ReadOnlyField()
    is_pdf = serializers.ReadOnlyField()
    preview_url = serializers.ReadOnlyField()
    download_url = serializers.SerializerMethodField()
    share_link = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = (
            'id', 'filename', 'size', 'mime_type', 'hash',
            'folder', 'is_public', 'share_token', 'is_deleted',
            'is_starred', 'extension', 'is_image', 'is_pdf',
            'preview_url', 'download_url', 'share_link',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'size', 'hash', 'mime_type', 'share_token',
                            'created_at', 'updated_at')

    def get_download_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(f'/api/files/{obj.id}/download/')
        return None

    def get_share_link(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/share/{obj.share_token}/')
        return None


class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    folder = serializers.PrimaryKeyRelatedField(
        queryset=__import__('folders.models', fromlist=['Folder']).Folder.objects.all(),
        required=False, allow_null=True
    )
    is_public = serializers.BooleanField(default=False)

    def validate_file(self, value):
        max_size = getattr(settings, 'MAX_FILE_SIZE', 500 * 1024 * 1024)
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File size exceeds limit of {max_size // (1024*1024)}MB."
            )
        return value


class FileRenameSerializer(serializers.Serializer):
    filename = serializers.CharField(max_length=500)

    def validate_filename(self, value):
        if not value.strip():
            raise serializers.ValidationError("Filename cannot be empty.")
        forbidden = ['/', '\\', '..', '<', '>', ':', '"', '|', '?', '*']
        for char in forbidden:
            if char in value:
                raise serializers.ValidationError(f"Filename cannot contain '{char}'.")
        return value.strip()


class FileMoveSerializer(serializers.Serializer):
    folder = serializers.IntegerField(allow_null=True)


class FileShareSerializer(serializers.ModelSerializer):
    shared_with_email = serializers.EmailField(write_only=True)
    shared_with_username = serializers.ReadOnlyField(source='shared_with.username')
    shared_with_email_read = serializers.ReadOnlyField(source='shared_with.email')

    class Meta:
        model = FileShare
        fields = ('id', 'file', 'shared_with_email', 'shared_with_username',
                  'shared_with_email_read', 'can_download', 'created_at')
        read_only_fields = ('id', 'file', 'created_at')


class ChunkUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChunkUpload
        fields = ('upload_id', 'filename', 'total_size', 'total_chunks',
                  'uploaded_chunks', 'folder', 'created_at')
        read_only_fields = ('upload_id', 'created_at')


class ZipDownloadSerializer(serializers.Serializer):
    file_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)
