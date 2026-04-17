import os
import hashlib
import mimetypes
from celery import shared_task
from django.conf import settings


@shared_task(bind=True, max_retries=3)
def process_file_async(self, file_id):
    """Post-upload processing: verify hash, set mime type"""
    try:
        from files.models import File
        file_obj = File.objects.get(id=file_id)
        # Re-verify mime type
        mime_type, _ = mimetypes.guess_type(file_obj.filename)
        if mime_type:
            file_obj.mime_type = mime_type
            file_obj.save(update_fields=['mime_type'])
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)


@shared_task(bind=True, max_retries=3)
def log_activity_async(self, user_id, file_id, action):
    """Log file activity asynchronously"""
    try:
        from activity.models import ActivityLog
        from authentication.models import User
        from files.models import File
        user = User.objects.get(id=user_id)
        file_obj = File.objects.get(id=file_id)
        ActivityLog.objects.create(user=user, file=file_obj, action=action)
    except Exception as exc:
        raise self.retry(exc=exc, countdown=10)


@shared_task(bind=True, max_retries=3)
def assemble_chunks_async(self, upload_id, user_id):
    """Assemble uploaded chunks into final file"""
    try:
        from files.models import File, ChunkUpload
        from authentication.models import User
        import io

        chunk_upload = ChunkUpload.objects.get(upload_id=upload_id)
        user = User.objects.get(id=user_id)

        chunk_dir = settings.CHUNK_UPLOAD_DIR / str(upload_id)
        final_hash = hashlib.sha256()

        # Build assembled file in memory (or stream to disk for large files)
        assembled_path = chunk_dir / 'assembled'
        with open(assembled_path, 'wb') as out_file:
            for i in range(chunk_upload.total_chunks):
                chunk_path = chunk_dir / f'chunk_{i}'
                with open(chunk_path, 'rb') as cf:
                    data = cf.read()
                    out_file.write(data)
                    final_hash.update(data)

        file_hash = final_hash.hexdigest()

        # Duplicate check
        existing = File.objects.filter(user=user, hash=file_hash, is_deleted=False).first()
        if existing:
            # Clean up chunks
            import shutil
            shutil.rmtree(chunk_dir, ignore_errors=True)
            chunk_upload.delete()
            return {'status': 'duplicate', 'file_id': str(existing.id)}

        # Save assembled file
        from django.core.files import File as DjangoFile
        mime_type, _ = mimetypes.guess_type(chunk_upload.filename)

        with open(assembled_path, 'rb') as f:
            file_obj = File(
                filename=chunk_upload.filename,
                size=chunk_upload.total_size,
                hash=file_hash,
                mime_type=mime_type or 'application/octet-stream',
                folder=chunk_upload.folder,
                user=user,
            )
            file_obj.file.save(chunk_upload.filename, DjangoFile(f), save=True)

        # Update storage
        user.storage_used += chunk_upload.total_size
        user.save(update_fields=['storage_used'])

        # Cleanup
        import shutil
        shutil.rmtree(chunk_dir, ignore_errors=True)
        chunk_upload.delete()

        log_activity_async.delay(user_id, str(file_obj.id), 'upload')
        return {'status': 'complete', 'file_id': str(file_obj.id)}

    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
