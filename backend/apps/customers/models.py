from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel

class Customer(TimeStampedModel):
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50)
    gstin = models.CharField(max_length=50, blank=True)
    pan = models.CharField(max_length=50, blank=True)
    billing_address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    credit_period_days = models.PositiveIntegerField(default=30)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"

class Project(TimeStampedModel):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='projects')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.customer.name}"

class Site(TimeStampedModel):
    name = models.CharField(max_length=200)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='sites')
    location = models.CharField(max_length=255, help_text="e.g. Metro Line 4, Package CA-54, Thane")
    site_incharge = models.CharField(max_length=150, blank=True)
    site_contact = models.CharField(max_length=50, blank=True)
    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_supervision_sites'
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.location})"

