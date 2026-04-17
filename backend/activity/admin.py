from django.contrib import admin
from .models import ActivityLog

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'file', 'action', 'ip_address', 'timestamp')
    list_filter = ('action', 'timestamp')
    search_fields = ('user__email', 'file__filename')
    readonly_fields = ('user', 'file', 'action', 'ip_address', 'user_agent', 'timestamp')
    date_hierarchy = 'timestamp'
    ordering = ('-timestamp',)
