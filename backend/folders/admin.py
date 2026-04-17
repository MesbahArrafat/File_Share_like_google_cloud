from django.contrib import admin
from .models import Folder

@admin.register(Folder)
class FolderAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'parent', 'created_at')
    search_fields = ('name', 'user__email')
    list_filter = ('user',)
    readonly_fields = ('created_at', 'updated_at')
