from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.http import FileResponse
from files.models import File, FileShare
from files.serializers import FileSerializer
from files.tasks import log_activity_async


class PublicShareView(APIView):
    """Access file via share token - no auth needed for public files"""
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            file_obj = File.objects.get(share_token=token, is_deleted=False)
        except File.DoesNotExist:
            return Response({'error': 'File not found or link is invalid.'}, status=404)

        user = request.user if request.user.is_authenticated else None

        # Access check
        if not file_obj.is_public:
            if not user:
                return Response({'error': 'Authentication required.'}, status=401)
            is_owner = file_obj.user == user
            has_share = FileShare.objects.filter(file=file_obj, shared_with=user).exists()
            if not is_owner and not has_share:
                return Response({'error': 'Access denied.'}, status=403)

        # Log download if user is known
        if user:
            log_activity_async.delay(user.id, str(file_obj.id), 'download')

        # Return file info or direct download
        action = request.query_params.get('action', 'info')
        if action == 'download':
            return FileResponse(
                file_obj.file.open('rb'),
                as_attachment=True,
                filename=file_obj.filename
            )

        return Response(FileSerializer(file_obj, context={'request': request}).data)


class GenerateShareLinkView(APIView):
    """Generate or regenerate share token"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            file_obj = File.objects.get(pk=pk, user=request.user)
        except File.DoesNotExist:
            return Response({'error': 'File not found.'}, status=404)

        import uuid
        file_obj.share_token = uuid.uuid4()
        file_obj.save(update_fields=['share_token'])

        share_link = request.build_absolute_uri(f'/api/share/{file_obj.share_token}/')
        return Response({'share_link': share_link, 'share_token': str(file_obj.share_token)})
