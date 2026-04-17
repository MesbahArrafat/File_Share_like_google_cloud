from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'storage_used_mb', 'storage_limit_mb', 'storage_percent', 'is_staff', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active')
    search_fields = ('email', 'username')
    ordering = ('-date_joined',)
    fieldsets = UserAdmin.fieldsets + (
        ('Storage', {'fields': ('storage_used', 'storage_limit', 'avatar')}),
    )
