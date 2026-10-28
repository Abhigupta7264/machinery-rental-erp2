import uuid
from decimal import Decimal
from django.db import models
from apps.common.models import TimeStampedModel

class MachineCategory(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = 'Machine Categories'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"

class Machine(TimeStampedModel):
    class Ownership(models.TextChoices):
        OWNED = 'OWNED', 'Company Owned'
        LEASED = 'LEASED', 'Leased / Financed'
        SUBCONTRACTED = 'SUBCONTRACTED', 'Subcontracted / Attached'

    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available / Yard Ready'
        RENTED = 'RENTED', 'Rented / Deployed on Site'
        UNDER_MAINTENANCE = 'UNDER_MAINTENANCE', 'Under Routine Service'
        BREAKDOWN = 'BREAKDOWN', 'Breakdown / Need Repair'
        STANDBY = 'STANDBY', 'Standby at Site'
        DECOMMISSIONED = 'DECOMMISSIONED', 'Decommissioned / Sold'

    class BillingType(models.TextChoices):
        HOURLY = 'HOURLY', 'Per Hour Basis'
        SHIFT = 'SHIFT', 'Per Shift (8 or 10 Hours)'
        DAILY = 'DAILY', 'Per Day Basis'
        MONTHLY = 'MONTHLY', 'Monthly Lump-sum / Fixed'

    asset_code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=150)
    category = models.ForeignKey(MachineCategory, on_delete=models.PROTECT, related_name='machines')
    make_model = models.CharField(max_length=150, help_text="e.g. Komatsu PC210-10M0")
    registration_number = models.CharField(max_length=50, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    year_of_manufacture = models.PositiveIntegerField(null=True, blank=True)

    ownership_type = models.CharField(max_length=20, choices=Ownership.choices, default=Ownership.OWNED)
    status = models.CharField(max_length=25, choices=Status.choices, default=Status.AVAILABLE, db_index=True)

    current_hour_meter = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    billing_type = models.CharField(max_length=20, choices=BillingType.choices, default=BillingType.HOURLY)
    rental_rate = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    # Deployments
    current_customer = models.ForeignKey(
        'customers.Customer',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deployed_machines'
    )
    current_site = models.ForeignKey(
        'customers.Site',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='site_machines'
    )
    current_operator = models.ForeignKey(
        'operators.Operator',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_machines'
    )

    # Compliance
    insurance_expiry = models.DateField(null=True, blank=True)
    fitness_expiry = models.DateField(null=True, blank=True)
    pollution_expiry = models.DateField(null=True, blank=True)
    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ['asset_code']

    def __str__(self):
        return f"[{self.asset_code}] {self.name} - {self.make_model}"

