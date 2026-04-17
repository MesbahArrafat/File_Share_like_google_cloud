"""
Management command: permanently delete files in trash older than N days.
Usage: python manage.py cleanup_trash --days 30
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from files.models import File


class Command(BaseCommand):
    help = 'Permanently delete trashed files older than specified days'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=30,
                            help='Delete files trashed more than this many days ago (default: 30)')
        parser.add_argument('--dry-run', action='store_true',
                            help='Show what would be deleted without deleting')

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        cutoff = timezone.now() - timedelta(days=days)

        old_trash = File.objects.filter(is_deleted=True, deleted_at__lt=cutoff)
        count = old_trash.count()

        if dry_run:
            self.stdout.write(f'[DRY RUN] Would permanently delete {count} files.')
            for f in old_trash[:10]:
                self.stdout.write(f'  - {f.filename} (deleted {f.deleted_at})')
            return

        freed = sum(old_trash.values_list('size', flat=True))
        for f in old_trash:
            try:
                f.user.storage_used = max(0, f.user.storage_used - f.size)
                f.user.save(update_fields=['storage_used'])
                f.file.delete(save=False)
            except Exception:
                pass
        old_trash.delete()

        freed_mb = round(freed / (1024 * 1024), 2)
        self.stdout.write(
            self.style.SUCCESS(f'Deleted {count} files, freed {freed_mb} MB.')
        )
