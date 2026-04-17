from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FileViewSet, TrashListView, StarredListView,
    SearchView, ChunkUploadInitView, ChunkUploadView
)

router = DefaultRouter()
router.register(r'', FileViewSet, basename='file')

urlpatterns = [
    path('trash/', TrashListView.as_view(), name='trash'),
    path('starred/', StarredListView.as_view(), name='starred'),
    path('search/', SearchView.as_view(), name='search'),
    path('upload/chunk/init/', ChunkUploadInitView.as_view(), name='chunk-init'),
    path('upload/chunk/<uuid:upload_id>/', ChunkUploadView.as_view(), name='chunk-upload'),
    path('', include(router.urls)),
]
