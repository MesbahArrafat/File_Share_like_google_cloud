from django.urls import path
from .views import PublicShareView, GenerateShareLinkView

urlpatterns = [
    path('<uuid:token>/', PublicShareView.as_view(), name='public-share'),
    path('generate/<uuid:pk>/', GenerateShareLinkView.as_view(), name='generate-share'),
]
