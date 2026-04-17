import django_filters
from .models import File


class FileFilter(django_filters.FilterSet):
    filename = django_filters.CharFilter(lookup_expr='icontains')
    min_size = django_filters.NumberFilter(field_name='size', lookup_expr='gte')
    max_size = django_filters.NumberFilter(field_name='size', lookup_expr='lte')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    extension = django_filters.CharFilter(method='filter_by_extension')

    class Meta:
        model = File
        fields = ['folder', 'is_starred', 'is_public', 'mime_type',
                  'filename', 'min_size', 'max_size']

    def filter_by_extension(self, queryset, name, value):
        return queryset.filter(filename__iendswith=f'.{value.lstrip(".")}')
