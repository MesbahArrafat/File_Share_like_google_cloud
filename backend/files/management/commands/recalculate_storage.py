"""
Management command: recalculate storage_used for all users.
Usage: python manage.py recalculate_storage
"""
from django.core.management.base import BaseCommand
from django.db.models import Sum
from authentication.models import User
from files.models import File


class Command(BaseCommand):
    help = 'Recalculate storage_used for all users based on actual file sizes'

    def handle(self, *args, **options):
        users = User.objects.all()
        updated = 0
        for user in users:
            total = File.objects.filter(user=user, is_deleted=False).aggregate(
                total=Sum('size')
            )['total'] or 0
            if user.storage_used != total:
                user.storage_used = total
                user.save(update_fields=['storage_used'])
                updated += 1

        self.stdout.write(self.style.SUCCESS(
            f'Recalculated storage for {users.count()} users ({updated} updated).'
        ))
