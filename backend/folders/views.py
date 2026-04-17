from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Folder
from .serializers import FolderSerializer, FolderTreeSerializer


class FolderViewSet(viewsets.ModelViewSet):
    serializer_class = FolderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Folder.objects.filter(user=user)
        parent = self.request.query_params.get('parent')
        if parent == 'root':
            qs = qs.filter(parent__isnull=True)
        elif parent:
            qs = qs.filter(parent_id=parent)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def tree(self, request):
        root_folders = Folder.objects.filter(user=request.user, parent__isnull=True)
        serializer = FolderTreeSerializer(root_folders, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        folder = self.get_object()
        new_parent_id = request.data.get('parent')
        if new_parent_id:
            try:
                new_parent = Folder.objects.get(id=new_parent_id, user=request.user)
                # Prevent circular reference
                if new_parent == folder or self._is_descendant(new_parent, folder):
                    return Response({'error': 'Cannot move folder into its own descendant.'}, status=400)
                folder.parent = new_parent
            except Folder.DoesNotExist:
                return Response({'error': 'Target folder not found.'}, status=404)
        else:
            folder.parent = None
        folder.save()
        return Response(FolderSerializer(folder, context={'request': request}).data)

    def _is_descendant(self, folder, potential_ancestor):
        current = folder
        while current.parent:
            if current.parent == potential_ancestor:
                return True
            current = current.parent
        return False
