from decimal import Decimal
from django.db import models
from django.utils import timezone
from apps.common.models import TimeStampedModel

class MaintenanceRecord(TimeStampedModel):
    class ServiceType(models.TextChoices):
        PREVENTIVE_250 = 'PREVENTIVE_250', '250-Hour Periodic Service'
        PREVENTIVE_500 = 'PREVENTIVE_500', '500-Hour Major Engine & Filter'
        PREVENTIVE_1000 = 'PREVENTIVE_1000', '1000-Hour Hydraulic & Transmission'
        BREAKDOWN_REPAIR = 'BREAKDOWN_REPAIR', 'Emergency Breakdown Repair'
        UNDERCARRIAGE_TYRE = 'UNDERCARRIAGE_TYRE', 'Tracks / Undercarriage / Tyre'
        ELECTRICAL = 'ELECTRICAL', 'Electrical & Sensor Repair'

    class Status(models.TextChoices):
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed & Tested'
        CANCELLED = 'CANCELLED', 'Cancelled'

    job_card_number = models.CharField(max_length=50, unique=True, db_index=True)
    machine = models.ForeignKey('fleet.Machine', on_delete=models.CASCADE, related_name='maintenance_records')
    service_type = models.CharField(max_length=30, choices=ServiceType.choices, default=ServiceType.PREVENTIVE_250)
    hour_meter = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    start_date = models.DateField()
    completion_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)

    technician_name = models.CharField(max_length=150, blank=True)
    service_vendor = models.CharField(max_length=150, blank=True, help_text="In-house Team or Authorized Dealer (e.g. Komatsu, Sany)")
    spares_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    labour_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    problem_reported = models.TextField()
    action_taken = models.TextField(blank=True)
    parts_replaced = models.TextField(blank=True)

    class Meta:
        ordering = ['-start_date', '-created_at']

    def save(self, *args, **kwargs):
        self.total_cost = (self.spares_cost or Decimal('0.00')) + (self.labour_cost or Decimal('0.00'))
        if not self.job_card_number:
            last = MaintenanceRecord.objects.order_by('-created_at').first()
            num = (last.id if last else 1)
            self.job_card_number = f"JC-{timezone.now().strftime('%Y')}-{abs(hash(str(num))) % 10000:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.job_card_number} - {self.machine.asset_code} ({self.get_service_type_display()})"
