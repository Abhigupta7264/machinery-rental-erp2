from decimal import Decimal
from django.db import models
from apps.common.models import TimeStampedModel

class RentalContract(TimeStampedModel):
    class DieselScope(models.TextChoices):
        CLIENT_SCOPE = 'CLIENT_SCOPE', 'Client Scope (Client provides fuel)'
        OWNER_SCOPE = 'OWNER_SCOPE', 'Owner Scope (Rental includes fuel)'
        DEBIT_NOTE = 'DEBIT_NOTE', 'Debit Note (Client issues, deducted in bill)'

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft Work Order'
        ACTIVE = 'ACTIVE', 'Active & Operating'
        COMPLETED = 'COMPLETED', 'Completed & Released'
        TERMINATED = 'TERMINATED', 'Terminated Early'

    contract_number = models.CharField(max_length=100, unique=True, db_index=True)
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='contracts')
    project = models.ForeignKey('customers.Project', on_delete=models.CASCADE, related_name='contracts')
    site = models.ForeignKey('customers.Site', on_delete=models.CASCADE, related_name='contracts')
    machine = models.ForeignKey('fleet.Machine', on_delete=models.CASCADE, related_name='contracts')

    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    billing_type = models.CharField(max_length=20, default='HOURLY')
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    minimum_guaranteed_hours = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('240.00'), help_text="Monthly guaranteed hours")
    overtime_rate = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    diesel_scope = models.CharField(max_length=30, choices=DieselScope.choices, default=DieselScope.CLIENT_SCOPE)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    terms = models.TextField(blank=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.contract_number} - {self.customer.name} - {self.machine.asset_code}"

