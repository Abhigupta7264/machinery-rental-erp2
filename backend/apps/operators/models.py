from django.db import models
from apps.common.models import TimeStampedModel

class Operator(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active / On Duty'
        ON_LEAVE = 'ON_LEAVE', 'On Leave'
        INACTIVE = 'INACTIVE', 'Inactive / Relieved'

    employee_id = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=50)
    alternate_phone = models.CharField(max_length=50, blank=True)
    license_number = models.CharField(max_length=100, blank=True)
    license_type = models.CharField(max_length=100, default='HEMM / Heavy Commercial')
    license_expiry = models.DateField(null=True, blank=True)
    aadhaar_number = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    experience_years = models.PositiveIntegerField(default=3)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} [{self.employee_id}] - {self.phone}"

