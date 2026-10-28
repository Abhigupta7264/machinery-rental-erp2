import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.common.models import TimeStampedModel

class Logsheet(TimeStampedModel):
    class Shift(models.TextChoices):
        DAY = 'DAY', 'Day Shift (08:00 - 20:00)'
        NIGHT = 'NIGHT', 'Night Shift (20:00 - 08:00)'
        GENERAL = 'GENERAL', 'General / Single Shift (09:00 - 18:00)'

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SUBMITTED = 'SUBMITTED', 'Submitted for Approval'
        APPROVED = 'APPROVED', 'Approved by Site In-charge'
        REJECTED = 'REJECTED', 'Rejected / Requires Correction'
        VOIDED = 'VOIDED', 'Voided / Cancelled'

    class EquipmentCondition(models.TextChoices):
        EXCELLENT = 'EXCELLENT', 'Excellent / Ready for Heavy Load'
        NORMAL = 'NORMAL', 'Normal Working Condition'
        ATTENTION_NEEDED = 'ATTENTION_NEEDED', 'Minor Fault / Maintenance Needed'
        BREAKDOWN = 'BREAKDOWN', 'Breakdown / Non-Operational'

    # Section 1: General Info
    logsheet_number = models.CharField(max_length=60, unique=True, db_index=True)
    date = models.DateField(default=timezone.localdate, db_index=True)
    shift = models.CharField(max_length=20, choices=Shift.choices, default=Shift.DAY)

    customer = models.ForeignKey('customers.Customer', on_delete=models.PROTECT, related_name='logsheets')
    project = models.ForeignKey('customers.Project', on_delete=models.PROTECT, related_name='logsheets')
    site = models.ForeignKey('customers.Site', on_delete=models.PROTECT, related_name='logsheets')
    machine = models.ForeignKey('fleet.Machine', on_delete=models.PROTECT, related_name='logsheets')
    operator = models.ForeignKey('operators.Operator', on_delete=models.PROTECT, related_name='logsheets')
    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='supervised_logsheets'
    )
    rental_contract = models.ForeignKey(
        'rentals.RentalContract',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logsheets'
    )

    # Section 2: Working Hours Details
    opening_meter = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    closing_meter = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    working_hours = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    idle_hours = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    breakdown_hours = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    overtime_hours = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    work_description = models.TextField(help_text="Detailed description of excavation, lifting, compaction or transit work done")

    # Section 3: Diesel & Fuel Details
    opening_fuel_litres = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    diesel_received_litres = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    diesel_consumed_litres = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    closing_fuel_litres = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    fuel_remarks = models.TextField(blank=True, help_text="Bowser / diesel slip number or dispenser reading")

    # Section 4: Site & Operational Details
    equipment_condition = models.CharField(max_length=30, choices=EquipmentCondition.choices, default=EquipmentCondition.NORMAL)
    breakdown_details = models.TextField(blank=True)
    remarks = models.TextField(blank=True)
    customer_rep_name = models.CharField(max_length=150, blank=True)
    customer_signature_confirmed = models.BooleanField(default=False)

    # Section 5: Status & Approval Details
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    prepared_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='prepared_logsheets'
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_logsheets'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    # Billing Integration Flag
    billed = models.BooleanField(default=False, db_index=True)
    invoice_number = models.CharField(max_length=60, blank=True)

    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['machine', 'date', 'shift']),
            models.Index(fields=['status', 'date']),
        ]

    def __str__(self):
        return f"{self.logsheet_number} ({self.date}) - {self.machine.asset_code} [{self.get_status_display()}]"

    def clean(self):
        super().clean()
        # 1. Meter validation
        if self.closing_meter is not None and self.opening_meter is not None:
            if self.closing_meter < self.opening_meter:
                raise ValidationError({
                    'closing_meter': f"Closing meter ({self.closing_meter}) cannot be less than opening meter ({self.opening_meter})."
                })

        # 2. Duplicate validation for active/draft/submitted/approved records
        existing = Logsheet.objects.filter(
            machine=self.machine,
            date=self.date,
            shift=self.shift
        ).exclude(status__in=[self.Status.VOIDED, self.Status.REJECTED])
        if self.pk:
            existing = existing.exclude(pk=self.pk)

        if existing.exists():
            conflict = existing.first()
            raise ValidationError(
                f"A logsheet ({conflict.logsheet_number}) already exists for Machine {self.machine.asset_code} on {self.date} for {self.get_shift_display()}."
            )

        # 3. Numeric bounds
        if self.working_hours and self.working_hours < 0:
            raise ValidationError({'working_hours': 'Working hours cannot be negative.'})
        if self.idle_hours and self.idle_hours < 0:
            raise ValidationError({'idle_hours': 'Idle hours cannot be negative.'})
        if self.breakdown_hours and self.breakdown_hours < 0:
            raise ValidationError({'breakdown_hours': 'Breakdown hours cannot be negative.'})
        if self.diesel_consumed_litres and self.diesel_consumed_litres < 0:
            raise ValidationError({'diesel_consumed_litres': 'Diesel consumed cannot be negative.'})

    def save(self, *args, **kwargs):
        # Auto-calculate working hours from meter readings
        if self.closing_meter is not None and self.opening_meter is not None:
            computed_hours = Decimal(str(self.closing_meter)) - Decimal(str(self.opening_meter))
            if computed_hours >= 0:
                self.working_hours = round(computed_hours, 2)

        # Auto-generate logsheet number if blank
        if not self.logsheet_number:
            year = timezone.now().strftime('%Y')
            last_entry = Logsheet.objects.filter(logsheet_number__startswith=f"LOG-{year}-").order_by('-created_at').first()
            if last_entry and last_entry.logsheet_number:
                try:
                    last_num = int(last_entry.logsheet_number.split('-')[-1])
                    next_num = last_num + 1
                except (ValueError, IndexError):
                    next_num = 1
            else:
                next_num = 1
            self.logsheet_number = f"LOG-{year}-{next_num:05d}"

        # If approved, update machine current hour meter to closing meter
        if self.status == self.Status.APPROVED and self.closing_meter > self.machine.current_hour_meter:
            self.machine.current_hour_meter = self.closing_meter
            self.machine.save(update_fields=['current_hour_meter', 'updated_at'])

        super().save(*args, **kwargs)

class LogsheetAudit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    logsheet = models.ForeignKey(Logsheet, on_delete=models.CASCADE, related_name='audit_trail')
    action = models.CharField(max_length=50) # CREATED, UPDATED, SUBMITTED, APPROVED, REJECTED, VOIDED, PDF_GENERATED
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    performed_by_name = models.CharField(max_length=150, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    snapshot = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} on {self.logsheet.logsheet_number} by {self.performed_by_name} at {self.timestamp}"

class LogsheetAttachment(TimeStampedModel):
    logsheet = models.ForeignKey(Logsheet, on_delete=models.CASCADE, related_name='attachments')
    title = models.CharField(max_length=150)
    file = models.FileField(upload_to='logsheet_attachments/%Y/%m/')
    file_type = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"{self.title} ({self.logsheet.logsheet_number})"

