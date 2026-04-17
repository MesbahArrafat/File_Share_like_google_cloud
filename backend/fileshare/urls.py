from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/files/', include('files.urls')),
    path('api/folders/', include('folders.urls')),
    path('api/share/', include('sharing.urls')),
    path('api/activity/', include('activity.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
