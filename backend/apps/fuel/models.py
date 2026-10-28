from decimal import Decimal
from django.db import models
from apps.common.models import TimeStampedModel

class FuelRecord(TimeStampedModel):
    issue_date = models.DateField(db_index=True)
    machine = models.ForeignKey('fleet.Machine', on_delete=models.CASCADE, related_name='fuel_records')
    site = models.ForeignKey('customers.Site', on_delete=models.CASCADE, related_name='fuel_records')
    litres_issued = models.DecimalField(max_digits=10, decimal_places=2)
    fuel_slip_number = models.CharField(max_length=60, blank=True)
    dispensed_by = models.CharField(max_length=150, blank=True)
    hour_meter_reading = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    fuel_rate = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('90.00'), help_text="Cost per litre")
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    bowser_source = models.CharField(max_length=150, blank=True, help_text="Site Bowser, Local Pump, Client Dispenser")
    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ['-issue_date', '-created_at']

    def save(self, *args, **kwargs):
        if self.litres_issued and self.fuel_rate:
            self.total_cost = round(Decimal(str(self.litres_issued)) * Decimal(str(self.fuel_rate)), 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.issue_date} - {self.machine.asset_code} - {self.litres_issued}L"

