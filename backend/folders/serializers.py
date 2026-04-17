from rest_framework import serializers
from .models import Folder


class FolderSerializer(serializers.ModelSerializer):
    breadcrumbs = serializers.ReadOnlyField()
    children_count = serializers.SerializerMethodField()
    files_count = serializers.SerializerMethodField()

    class Meta:
        model = Folder
        fields = ('id', 'name', 'parent', 'breadcrumbs',
                  'children_count', 'files_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_children_count(self, obj):
        return obj.children.count()

    def get_files_count(self, obj):
        return obj.files.filter(is_deleted=False).count()

    def validate_name(self, value):
        if '/' in value or '\\' in value:
            raise serializers.ValidationError("Folder name cannot contain slashes.")
        return value

    def validate(self, attrs):
        user = self.context['request'].user
        parent = attrs.get('parent')
        name = attrs.get('name')
        instance = self.instance

        qs = Folder.objects.filter(name=name, parent=parent, user=user)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A folder with this name already exists here.")
        return attrs


class FolderTreeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Folder
        fields = ('id', 'name', 'children')

    def get_children(self, obj):
        return FolderTreeSerializer(obj.children.all(), many=True).data
