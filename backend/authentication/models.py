from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    storage_used = models.BigIntegerField(default=0)
    storage_limit = models.BigIntegerField(default=5 * 1024 * 1024 * 1024)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    @property
    def storage_used_mb(self):
        return round(self.storage_used / (1024 * 1024), 2)

    @property
    def storage_limit_mb(self):
        return round(self.storage_limit / (1024 * 1024), 2)

    @property
    def storage_percent(self):
        if self.storage_limit == 0:
            return 0
        return round((self.storage_used / self.storage_limit) * 100, 2)
