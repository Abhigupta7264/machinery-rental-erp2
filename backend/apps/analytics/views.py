from decimal import Decimal
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from apps.fleet.models import Machine
from apps.logsheets.models import Logsheet
from apps.fuel.models import FuelRecord
from apps.billing.models import Invoice
from apps.common.models import AuditLog

class DashboardMetricsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        params = request.query_params
        import uuid
        site_id = (params.get('site') or '').strip()
        date_from = (params.get('date_from') or '').strip()
        date_to = (params.get('date_to') or '').strip()

        # Validate UUID if site provided
        valid_site_id = None
        if site_id and site_id.lower() not in ('all', 'null', 'undefined', ''):
            try:
                uuid.UUID(str(site_id))
                valid_site_id = site_id
            except (ValueError, TypeError):
                valid_site_id = None

        # 1. Machinery Counts
        machines_qs = Machine.objects.all()
        if valid_site_id:
            machines_qs = machines_qs.filter(current_site_id=valid_site_id)

        total_machines = machines_qs.count()
        available_machines = machines_qs.filter(status=Machine.Status.AVAILABLE).count()
        rented_machines = machines_qs.filter(status=Machine.Status.RENTED).count()
        maintenance_machines = machines_qs.filter(status__in=[Machine.Status.UNDER_MAINTENANCE, Machine.Status.BREAKDOWN]).count()

        # 2. Logsheet Metrics
        logsheets_qs = Logsheet.objects.all()
        if valid_site_id:
            logsheets_qs = logsheets_qs.filter(site_id=valid_site_id)
        if date_from:
            logsheets_qs = logsheets_qs.filter(date__gte=date_from)
        if date_to:
            logsheets_qs = logsheets_qs.filter(date__lte=date_to)

        pending_logsheets = logsheets_qs.filter(status=Logsheet.Status.SUBMITTED).count()
        draft_logsheets = logsheets_qs.filter(status=Logsheet.Status.DRAFT).count()
        approved_logsheets = logsheets_qs.filter(status=Logsheet.Status.APPROVED).count()
        rejected_logsheets = logsheets_qs.filter(status=Logsheet.Status.REJECTED).count()

        # Aggregated working hours
        hours_agg = logsheets_qs.aggregate(
            total_working_hours=Sum('working_hours'),
            total_idle_hours=Sum('idle_hours'),
            total_breakdown_hours=Sum('breakdown_hours'),
            total_diesel_consumed=Sum('diesel_consumed_litres')
        )
        total_working_hours = float(hours_agg['total_working_hours'] or Decimal('0.00'))
        total_idle_hours = float(hours_agg['total_idle_hours'] or Decimal('0.00'))
        total_breakdown_hours = float(hours_agg['total_breakdown_hours'] or Decimal('0.00'))
        total_diesel_consumed = float(hours_agg['total_diesel_consumed'] or Decimal('0.00'))

        # 3. Fuel Records
        fuel_qs = FuelRecord.objects.all()
        if valid_site_id:
            fuel_qs = fuel_qs.filter(site_id=valid_site_id)
        if date_from:
            fuel_qs = fuel_qs.filter(issue_date__gte=date_from)
        if date_to:
            fuel_qs = fuel_qs.filter(issue_date__lte=date_to)

        fuel_agg = fuel_qs.aggregate(
            total_issued=Sum('litres_issued'),
            total_cost=Sum('total_cost')
        )
        total_fuel_issued = float(fuel_agg['total_issued'] or Decimal('0.00'))
        total_fuel_cost = float(fuel_agg['total_cost'] or Decimal('0.00'))

        # 4. Financial & Invoicing Metrics
        invoices_qs = Invoice.objects.all()
        unpaid_invoices_count = invoices_qs.filter(status__in=[Invoice.Status.ISSUED, Invoice.Status.PARTIALLY_PAID]).count()
        outstanding_agg = invoices_qs.filter(status__in=[Invoice.Status.ISSUED, Invoice.Status.PARTIALLY_PAID]).aggregate(
            outstanding=Sum('balance_due')
        )
        outstanding_amount = float(outstanding_agg['outstanding'] or Decimal('0.00'))

        # 5. Top 5 Machine Utilization
        top_machines = (
            logsheets_qs.filter(status=Logsheet.Status.APPROVED)
            .values('machine__asset_code', 'machine__name')
            .annotate(hours=Sum('working_hours'))
            .order_by('-hours')[:5]
        )
        machine_utilization = [
            {'machine': f"{m['machine__asset_code']} - {m['machine__name']}", 'hours': float(m['hours'] or 0)}
            for m in top_machines
        ]

        # 6. Recent Audit / Activity Trail
        recent_audits = AuditLog.objects.all().order_by('-timestamp')[:8]
        recent_activity = [
            {
                'id': str(a.id),
                'action': a.action,
                'entity': a.entity_name,
                'entity_id': a.entity_id,
                'actor': a.actor_name,
                'timestamp': a.timestamp.strftime('%d-%b %H:%M')
            }
            for a in recent_audits
        ]

        return Response({
            'fleet': {
                'total': total_machines,
                'available': available_machines,
                'rented': rented_machines,
                'maintenance': maintenance_machines,
                'utilization_rate': round((rented_machines / total_machines * 100), 1) if total_machines > 0 else 0
            },
            'logsheets': {
                'pending_approval': pending_logsheets,
                'draft': draft_logsheets,
                'approved': approved_logsheets,
                'rejected': rejected_logsheets,
                'total': pending_logsheets + draft_logsheets + approved_logsheets + rejected_logsheets
            },
            'operations': {
                'total_working_hours': total_working_hours,
                'total_idle_hours': total_idle_hours,
                'total_breakdown_hours': total_breakdown_hours,
                'diesel_consumed_litres': total_diesel_consumed,
            },
            'fuel': {
                'total_issued_litres': total_fuel_issued,
                'total_cost': total_fuel_cost,
            },
            'finance': {
                'pending_invoices_count': unpaid_invoices_count,
                'outstanding_amount': outstanding_amount
            },
            'machine_utilization': machine_utilization,
            'recent_activity': recent_activity
        })

