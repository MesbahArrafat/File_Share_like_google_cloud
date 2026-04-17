from rest_framework import serializers
from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    file_name = serializers.ReadOnlyField(source='file.filename')
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = ActivityLog
        fields = ('id', 'user_email', 'file_name', 'action', 'ip_address', 'timestamp')
