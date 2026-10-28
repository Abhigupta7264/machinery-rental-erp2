from django.urls import path
from .views import CompanySettingsView, AuditLogListView

urlpatterns = [
    path('settings/', CompanySettingsView.as_view(), name='company-settings'),
    path('audit-logs/', AuditLogListView.as_view(), name='audit-logs'),
]

