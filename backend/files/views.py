import hashlib
import io
import os
import zipfile
import mimetypes
from django.http import FileResponse, HttpResponse
from django.utils import timezone
from django.conf import settings
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import File, FileShare, ChunkUpload
from .serializers import (
    FileSerializer, FileUploadSerializer, FileRenameSerializer,
    FileMoveSerializer, FileShareSerializer, ChunkUploadSerializer, ZipDownloadSerializer
)
from .tasks import process_file_async, log_activity_async
from .filters import FileFilter
from activity.models import ActivityLog


def compute_hash(file_obj):
    sha256 = hashlib.sha256()
    for chunk in file_obj.chunks():
        sha256.update(chunk)
    return sha256.hexdigest()


class FileViewSet(viewsets.ModelViewSet):
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['filename']
    filterset_class = FileFilter
    ordering_fields = ['filename', 'size', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = File.objects.filter(user=user, is_deleted=False)
        folder = self.request.query_params.get('folder')
        if folder == 'root':
            qs = qs.filter(folder__isnull=True)
        elif folder:
            qs = qs.filter(folder_id=folder)
        return qs

    # ── Upload ──────────────────────────────────────────────────────────────
    def create(self, request):
        serializer = FileUploadSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data['file']
        folder = serializer.validated_data.get('folder')
        is_public = serializer.validated_data.get('is_public', False)

        # Compute hash
        file_hash = compute_hash(uploaded_file)
        uploaded_file.seek(0)

        # Duplicate detection
        existing = File.objects.filter(
            user=request.user, hash=file_hash, is_deleted=False
        ).first()
        if existing:
            return Response({
                'message': 'Duplicate file detected.',
                'file': FileSerializer(existing, context={'request': request}).data
            }, status=status.HTTP_200_OK)

        # Storage quota check
        user = request.user
        if user.storage_used + uploaded_file.size > user.storage_limit:
            return Response({'error': 'Storage quota exceeded.'}, status=status.HTTP_400_BAD_REQUEST)

        mime_type, _ = mimetypes.guess_type(uploaded_file.name)

        file_obj = File.objects.create(
            file=uploaded_file,
            filename=uploaded_file.name,
            size=uploaded_file.size,
            hash=file_hash,
            mime_type=mime_type or 'application/octet-stream',
            folder=folder,
            user=user,
            is_public=is_public,
        )

        # Update storage usage
        user.storage_used += uploaded_file.size
        user.save(update_fields=['storage_used'])

        # Async tasks
        process_file_async.delay(str(file_obj.id))
        log_activity_async.delay(user.id, str(file_obj.id), 'upload')

        return Response(
            FileSerializer(file_obj, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    # ── Download ─────────────────────────────────────────────────────────────
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        file_obj = self.get_object()
        log_activity_async.delay(request.user.id, str(file_obj.id), 'download')
        response = FileResponse(
            file_obj.file.open('rb'),
            as_attachment=True,
            filename=file_obj.filename
        )
        return response

    # ── Rename ───────────────────────────────────────────────────────────────
    @action(detail=True, methods=['patch'])
    def rename(self, request, pk=None):
        file_obj = self.get_object()
        serializer = FileRenameSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file_obj.filename = serializer.validated_data['filename']
        file_obj.save(update_fields=['filename', 'updated_at'])
        return Response(FileSerializer(file_obj, context={'request': request}).data)

    # ── Move ─────────────────────────────────────────────────────────────────
    @action(detail=True, methods=['patch'])
    def move(self, request, pk=None):
        file_obj = self.get_object()
        serializer = FileMoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        folder_id = serializer.validated_data['folder']
        if folder_id:
            from folders.models import Folder
            try:
                folder = Folder.objects.get(id=folder_id, user=request.user)
                file_obj.folder = folder
            except Folder.DoesNotExist:
                return Response({'error': 'Folder not found.'}, status=404)
        else:
            file_obj.folder = None
        file_obj.save(update_fields=['folder', 'updated_at'])
        return Response(FileSerializer(file_obj, context={'request': request}).data)

    # ── Trash / Restore ──────────────────────────────────────────────────────
    def destroy(self, request, *args, **kwargs):
        file_obj = self.get_object()
        file_obj.is_deleted = True
        file_obj.deleted_at = timezone.now()
        file_obj.save(update_fields=['is_deleted', 'deleted_at'])
        return Response({'message': 'File moved to trash.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        file_obj = File.objects.get(pk=pk, user=request.user, is_deleted=True)
        file_obj.is_deleted = False
        file_obj.deleted_at = None
        file_obj.save(update_fields=['is_deleted', 'deleted_at'])
        return Response(FileSerializer(file_obj, context={'request': request}).data)

    @action(detail=True, methods=['delete'])
    def permanent_delete(self, request, pk=None):
        file_obj = File.objects.get(pk=pk, user=request.user)
        request.user.storage_used -= file_obj.size
        request.user.save(update_fields=['storage_used'])
        file_obj.file.delete(save=False)
        file_obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── Star ─────────────────────────────────────────────────────────────────
    @action(detail=True, methods=['post'])
    def star(self, request, pk=None):
        file_obj = self.get_object()
        file_obj.is_starred = not file_obj.is_starred
        file_obj.save(update_fields=['is_starred'])
        return Response({'is_starred': file_obj.is_starred})

    # ── Share with specific user ──────────────────────────────────────────────
    @action(detail=True, methods=['post', 'get', 'delete'])
    def share_with(self, request, pk=None):
        file_obj = self.get_object()
        if request.method == 'GET':
            shares = FileShare.objects.filter(file=file_obj)
            return Response(FileShareSerializer(shares, many=True).data)
        elif request.method == 'POST':
            from authentication.models import User
            email = request.data.get('email')
            try:
                target_user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({'error': 'User not found.'}, status=404)
            share, created = FileShare.objects.get_or_create(
                file=file_obj, shared_with=target_user,
                defaults={'can_download': request.data.get('can_download', True)}
            )
            return Response(FileShareSerializer(share).data, status=201 if created else 200)
        elif request.method == 'DELETE':
            email = request.data.get('email')
            FileShare.objects.filter(file=file_obj, shared_with__email=email).delete()
            return Response(status=204)

    # ── Zip Download ──────────────────────────────────────────────────────────
    @action(detail=False, methods=['post'])
    def zip_download(self, request):
        serializer = ZipDownloadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file_ids = serializer.validated_data['file_ids']

        files = File.objects.filter(id__in=file_ids, user=request.user, is_deleted=False)
        if not files.exists():
            return Response({'error': 'No files found.'}, status=404)

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            for f in files:
                zf.write(f.file.path, f.filename)

        buffer.seek(0)
        response = HttpResponse(buffer.read(), content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="files.zip"'
        return response


# ── Trash List ────────────────────────────────────────────────────────────────
class TrashListView(generics.ListAPIView):
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return File.objects.filter(user=self.request.user, is_deleted=True)


# ── Starred List ──────────────────────────────────────────────────────────────
class StarredListView(generics.ListAPIView):
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return File.objects.filter(user=self.request.user, is_starred=True, is_deleted=False)


# ── Search ────────────────────────────────────────────────────────────────────
class SearchView(generics.ListAPIView):
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        query = self.request.query_params.get('q', '')
        folder_id = self.request.query_params.get('folder')
        qs = File.objects.filter(user=user, is_deleted=False, filename__icontains=query)
        if folder_id:
            qs = qs.filter(folder_id=folder_id)
        return qs


# ── Chunk Upload ──────────────────────────────────────────────────────────────
class ChunkUploadInitView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        filename = request.data.get('filename')
        total_size = request.data.get('total_size')
        total_chunks = request.data.get('total_chunks')
        folder_id = request.data.get('folder')

        from folders.models import Folder
        folder = None
        if folder_id:
            folder = Folder.objects.get(id=folder_id, user=request.user)

        chunk_upload = ChunkUpload.objects.create(
            user=request.user,
            filename=filename,
            total_size=total_size,
            total_chunks=total_chunks,
            folder=folder
        )
        return Response({'upload_id': str(chunk_upload.upload_id)}, status=201)


class ChunkUploadView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, upload_id):
        try:
            chunk_upload = ChunkUpload.objects.get(upload_id=upload_id, user=request.user)
        except ChunkUpload.DoesNotExist:
            return Response({'error': 'Upload session not found.'}, status=404)

        chunk_number = int(request.data.get('chunk_number'))
        chunk_file = request.FILES.get('chunk')

        chunk_dir = settings.CHUNK_UPLOAD_DIR / str(upload_id)
        os.makedirs(chunk_dir, exist_ok=True)
        chunk_path = chunk_dir / f'chunk_{chunk_number}'

        with open(chunk_path, 'wb') as f:
            for part in chunk_file.chunks():
                f.write(part)

        if chunk_number not in chunk_upload.uploaded_chunks:
            chunk_upload.uploaded_chunks.append(chunk_number)
            chunk_upload.save(update_fields=['uploaded_chunks'])

        # All chunks received → assemble
        if len(chunk_upload.uploaded_chunks) == chunk_upload.total_chunks:
            from .tasks import assemble_chunks_async
            assemble_chunks_async.delay(str(upload_id), request.user.id)
            return Response({'status': 'assembling', 'upload_id': str(upload_id)})

        return Response({
            'status': 'chunk_received',
            'chunk_number': chunk_number,
            'uploaded': len(chunk_upload.uploaded_chunks),
            'total': chunk_upload.total_chunks
        })
