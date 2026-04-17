from rest_framework.permissions import BasePermission
from .models import File, FileShare


class IsFileOwner(BasePermission):
    """Only the file owner can access."""
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class CanAccessSharedFile(BasePermission):
    """Owner OR users the file is shared with can access."""
    def has_object_permission(self, request, view, obj):
        if obj.user == request.user:
            return True
        return FileShare.objects.filter(file=obj, shared_with=request.user).exists()


class IsPublicOrOwnerOrShared(BasePermission):
    """Public files, owner, or shared users can access."""
    def has_object_permission(self, request, view, obj):
        if obj.is_public:
            return True
        if not request.user.is_authenticated:
            return False
        if obj.user == request.user:
            return True
        return FileShare.objects.filter(file=obj, shared_with=request.user).exists()
