import uuid
import secrets
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMINISTRATOR = 'ADMINISTRATOR', 'Administrator'
        OPERATIONS_MANAGER = 'OPERATIONS_MANAGER', 'Operations Manager'
        SITE_SUPERVISOR = 'SITE_SUPERVISOR', 'Site Supervisor'
        OPERATOR = 'OPERATOR', 'Equipment Operator'
        ACCOUNTANT = 'ACCOUNTANT', 'Accountant / Billing Officer'
        VIEWER = 'VIEWER', 'Read-Only Viewer'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.SITE_SUPERVISOR,
        db_index=True
    )
    phone = models.CharField(max_length=20, blank=True)
    employee_code = models.CharField(max_length=50, blank=True, unique=True, null=True)
    site_access = models.CharField(max_length=255, blank=True, help_text="Comma-separated site IDs or 'ALL'")

    def __str__(self):
        full = self.get_full_name()
        return f"{full or self.username} ({self.get_role_display()})"

    @property
    def is_ops_or_admin(self):
        return self.role in [self.Role.ADMINISTRATOR, self.Role.OPERATIONS_MANAGER] or self.is_superuser

    @property
    def can_approve_logsheets(self):
        return self.role in [self.Role.ADMINISTRATOR, self.Role.OPERATIONS_MANAGER, self.Role.SITE_SUPERVISOR] or self.is_superuser

    @property
    def can_edit_billing(self):
        return self.role in [self.Role.ADMINISTRATOR, self.Role.OPERATIONS_MANAGER, self.Role.ACCOUNTANT] or self.is_superuser

class UserAuthToken(models.Model):
    key = models.CharField(max_length=64, primary_key=True)
    user = models.ForeignKey(User, related_name='auth_tokens', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def generate_token(cls, user):
        token_key = secrets.token_hex(32)
        token, _ = cls.objects.get_or_create(user=user, defaults={'key': token_key})
        return token

