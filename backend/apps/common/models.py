import uuid
from django.db import models
from django.conf import settings

class TimeStampedModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True

class CompanySettings(models.Model):
    company_name = models.CharField(max_length=200, default='INFRA-EQUIP RENTALS & HEAVY FLEET PVT LTD')
    tagline = models.CharField(max_length=255, default='Heavy Machinery Rental, Earthmoving & Construction Plant Operations')
    registration_no = models.CharField(max_length=100, default='CIN: U29253MH2016PTC284910')
    gstin = models.CharField(max_length=50, default='27AAACI1234F1Z8')
    pan = models.CharField(max_length=50, default='AAACI1234F')
    email = models.EmailField(default='operations@infra-equip.com')
    phone = models.CharField(max_length=50, default='+91 98200 12345 / 022-28901234')
    website = models.URLField(default='https://www.infra-equip.com')
    registered_address = models.TextField(
        default='Plot No. 42-B, Industrial Area Phase II, MIDC, Andheri East, Mumbai, Maharashtra 400093, India'
    )
    regional_depot = models.TextField(
        default='Central Heavy Yard: Sector 18, Navi Mumbai Plant & Maintenance Hub'
    )
    logsheet_prefix = models.CharField(max_length=20, default='LOG')
    invoice_prefix = models.CharField(max_length=20, default='INV')
    enable_strict_meter_validation = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.company_name

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_entries'
    )
    actor_name = models.CharField(max_length=150, blank=True)
    entity_name = models.CharField(max_length=100, db_index=True)
    entity_id = models.CharField(max_length=100, db_index=True)
    action = models.CharField(max_length=50) # CREATE, UPDATE, SUBMIT, APPROVE, REJECT, VOID, PDF_DOWNLOAD
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} on {self.entity_name} ({self.entity_id}) by {self.actor_name or 'System'}"

