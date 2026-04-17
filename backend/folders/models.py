from django.db import models
from django.conf import settings


class Folder(models.Model):
    name = models.CharField(max_length=255)
    parent = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.CASCADE, related_name='children'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='folders'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('name', 'parent', 'user')
        ordering = ['name']

    def __str__(self):
        return self.get_full_path()

    def get_full_path(self):
        if self.parent:
            return f"{self.parent.get_full_path()}/{self.name}"
        return self.name

    @property
    def breadcrumbs(self):
        crumbs = []
        folder = self
        while folder:
            crumbs.insert(0, {'id': folder.id, 'name': folder.name})
            folder = folder.parent
        return crumbs
