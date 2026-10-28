from decimal import Decimal
from django.db import models
from django.utils import timezone
from apps.common.models import TimeStampedModel

class Invoice(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        ISSUED = 'ISSUED', 'Issued / Sent to Client'
        PAID = 'PAID', 'Fully Paid'
        PARTIALLY_PAID = 'PARTIALLY_PAID', 'Partially Paid'
        CANCELLED = 'CANCELLED', 'Cancelled'

    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey('customers.Customer', on_delete=models.PROTECT, related_name='invoices')
    project = models.ForeignKey('customers.Project', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    invoice_date = models.DateField(default=timezone.localdate, db_index=True)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)

    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('18.00'), help_text="GST percentage")
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    payment_reference = models.CharField(max_length=150, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-invoice_date', '-created_at']

    def calculate_totals(self):
        items_total = sum(item.amount for item in self.items.all())
        self.subtotal = items_total
        self.tax_amount = round(self.subtotal * (self.tax_percent / Decimal('100.00')), 2)
        self.grand_total = self.subtotal + self.tax_amount
        self.balance_due = max(Decimal('0.00'), self.grand_total - (self.amount_paid or Decimal('0.00')))
        self.save(update_fields=['subtotal', 'tax_amount', 'grand_total', 'balance_due', 'updated_at'])

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            year = timezone.now().strftime('%Y')
            last = Invoice.objects.filter(invoice_number__startswith=f"INV-{year}-").order_by('-created_at').first()
            if last and last.invoice_number:
                try:
                    num = int(last.invoice_number.split('-')[-1]) + 1
                except (ValueError, IndexError):
                    num = 1
            else:
                num = 1
            self.invoice_number = f"INV-{year}-{num:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.invoice_number} - {self.customer.name} (₹{self.grand_total})"

class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    logsheet = models.ForeignKey('logsheets.Logsheet', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoice_entries')
    description = models.CharField(max_length=255)
    quantity_hours = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('1.00'))
    unit_rate = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    def save(self, *args, **kwargs):
        self.amount = round(self.quantity_hours * self.unit_rate, 2)
        super().save(*args, **kwargs)
        if self.logsheet:
            self.logsheet.billed = True
            self.logsheet.invoice_number = self.invoice.invoice_number
            self.logsheet.save(update_fields=['billed', 'invoice_number', 'updated_at'])

    def __str__(self):
        return f"{self.invoice.invoice_number}: {self.description} ({self.amount})"

