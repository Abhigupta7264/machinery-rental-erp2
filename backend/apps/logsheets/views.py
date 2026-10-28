from decimal import Decimal
from django.db import models, transaction
from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Logsheet, LogsheetAudit, LogsheetAttachment
from .serializers import LogsheetListSerializer, LogsheetDetailSerializer, LogsheetAuditSerializer
from .pdf_generator import generate_logsheet_pdf
from apps.common.models import AuditLog

class LogsheetViewSet(viewsets.ModelViewSet):
    queryset = Logsheet.objects.all().select_related(
        'machine', 'machine__category', 'customer', 'project', 'site', 'operator', 'supervisor', 'prepared_by', 'approved_by'
    )
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return LogsheetListSerializer
        return LogsheetDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        # Filters
        date_from = params.get('date_from')
        date_to = params.get('date_to')
        machine_id = params.get('machine')
        customer_id = params.get('customer')
        site_id = params.get('site')
        operator_id = params.get('operator')
        log_status = params.get('status')
        search = params.get('search')
        billed = params.get('billed')

        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        if machine_id:
            qs = qs.filter(machine_id=machine_id)
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        if site_id:
            qs = qs.filter(site_id=site_id)
        if operator_id:
            qs = qs.filter(operator_id=operator_id)
        if log_status:
            qs = qs.filter(status=log_status)
        if billed is not None:
            qs = qs.filter(billed=(billed.lower() in ['true', '1']))
        if search:
            qs = qs.filter(
                models.Q(logsheet_number__icontains=search) |
                models.Q(machine__asset_code__icontains=search) |
                models.Q(machine__name__icontains=search) |
                models.Q(customer__name__icontains=search) |
                models.Q(operator__name__icontains=search)
            )

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        submit_raw = self.request.data.get('submit_now', False)
        if isinstance(submit_raw, str):
            submit_now = submit_raw.lower() in ('true', '1')
        else:
            submit_now = bool(submit_raw)
        target_status = Logsheet.Status.SUBMITTED if submit_now else Logsheet.Status.DRAFT
        submitted_at = timezone.now() if submit_now else None

        logsheet = serializer.save(
            prepared_by=user,
            status=target_status,
            submitted_at=submitted_at
        )

        # Audit Entry
        action_name = 'CREATED & SUBMITTED' if submit_now else 'CREATED AS DRAFT'
        LogsheetAudit.objects.create(
            logsheet=logsheet,
            action=action_name,
            performed_by=user,
            performed_by_name=user.get_full_name() or user.username,
            notes=f"Logsheet created with status {logsheet.status}",
            snapshot={'status': logsheet.status, 'working_hours': float(logsheet.working_hours)}
        )

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()

        # Enforce business rule: only draft or rejected can be edited, unless admin
        if instance.status in [Logsheet.Status.APPROVED, Logsheet.Status.VOIDED] and not (user.is_superuser or user.role == 'ADMINISTRATOR'):
            raise serializers.ValidationError({
                'detail': f"Approved or Voided logsheet cannot be modified directly. Use authorized correction or void-and-reissue workflow."
            })

        logsheet = serializer.save()

        # Audit
        LogsheetAudit.objects.create(
            logsheet=logsheet,
            action='UPDATED',
            performed_by=user,
            performed_by_name=user.get_full_name() or user.username,
            notes="Logsheet details edited",
            snapshot={'working_hours': float(logsheet.working_hours), 'status': logsheet.status}
        )

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit draft or rejected logsheet for supervisor approval"""
        logsheet = self.get_object()
        if logsheet.status not in [Logsheet.Status.DRAFT, Logsheet.Status.REJECTED]:
            return Response(
                {'error': f"Cannot submit a logsheet with status {logsheet.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        logsheet.status = Logsheet.Status.SUBMITTED
        logsheet.submitted_at = timezone.now()
        logsheet.save(update_fields=['status', 'submitted_at', 'updated_at'])

        LogsheetAudit.objects.create(
            logsheet=logsheet,
            action='SUBMITTED',
            performed_by=request.user,
            performed_by_name=request.user.get_full_name() or request.user.username,
            notes="Submitted for site supervisor approval"
        )
        return Response(LogsheetDetailSerializer(logsheet).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve logsheet by authorized supervisor or manager"""
        user = request.user
        if not (user.is_superuser or getattr(user, 'can_approve_logsheets', False)):
            return Response({'error': 'Unauthorized: Only supervisors or managers can approve logsheets'}, status=status.HTTP_403_FORBIDDEN)

        logsheet = self.get_object()
        if logsheet.status != Logsheet.Status.SUBMITTED and not user.is_superuser:
            return Response(
                {'error': f"Only SUBMITTED logsheets can be approved. Current status: {logsheet.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            logsheet.status = Logsheet.Status.APPROVED
            logsheet.approved_by = user
            logsheet.approved_at = timezone.now()
            logsheet.rejection_reason = ''
            logsheet.save()

            # Record in machine and audit
            LogsheetAudit.objects.create(
                logsheet=logsheet,
                action='APPROVED',
                performed_by=user,
                performed_by_name=user.get_full_name() or user.username,
                notes="Approved for billing and operational records."
            )

        return Response(LogsheetDetailSerializer(logsheet).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject logsheet with mandatory explanation"""
        user = request.user
        if not (user.is_superuser or getattr(user, 'can_approve_logsheets', False)):
            return Response({'error': 'Unauthorized: Only supervisors or managers can reject logsheets'}, status=status.HTTP_403_FORBIDDEN)

        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response({'error': 'A rejection reason is required to reject a logsheet'}, status=status.HTTP_400_BAD_REQUEST)

        logsheet = self.get_object()
        logsheet.status = Logsheet.Status.REJECTED
        logsheet.rejection_reason = reason
        logsheet.approved_by = user
        logsheet.approved_at = timezone.now()
        logsheet.save(update_fields=['status', 'rejection_reason', 'approved_by', 'approved_at', 'updated_at'])

        LogsheetAudit.objects.create(
            logsheet=logsheet,
            action='REJECTED',
            performed_by=user,
            performed_by_name=user.get_full_name() or user.username,
            notes=f"Rejection Reason: {reason}"
        )
        return Response(LogsheetDetailSerializer(logsheet).data)

    @action(detail=True, methods=['post'])
    def void(self, request, pk=None):
        """Void an approved or existing logsheet with audit reason"""
        user = request.user
        if not (user.is_superuser or user.role in ['ADMINISTRATOR', 'OPERATIONS_MANAGER']):
            return Response({'error': 'Unauthorized: Only Admins or Operations Managers can void logsheets'}, status=status.HTTP_403_FORBIDDEN)

        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response({'error': 'A reason is required to void a logsheet'}, status=status.HTTP_400_BAD_REQUEST)

        logsheet = self.get_object()
        if logsheet.billed:
            return Response({'error': 'Cannot void a logsheet that has already been billed. Please credit note the invoice first.'}, status=status.HTTP_400_BAD_REQUEST)

        logsheet.status = Logsheet.Status.VOIDED
        logsheet.rejection_reason = f"VOIDED: {reason}"
        logsheet.save(update_fields=['status', 'rejection_reason', 'updated_at'])

        LogsheetAudit.objects.create(
            logsheet=logsheet,
            action='VOIDED',
            performed_by=user,
            performed_by_name=user.get_full_name() or user.username,
            notes=f"Voided with reason: {reason}"
        )
        return Response(LogsheetDetailSerializer(logsheet).data)

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """Generate and stream high-quality A4 ReportLab PDF for download"""
        logsheet = self.get_object()
        pdf_buffer = generate_logsheet_pdf(logsheet)

        # Audit PDF generation
        LogsheetAudit.objects.create(
            logsheet=logsheet,
            action='PDF_DOWNLOAD',
            performed_by=request.user if request.user.is_authenticated else None,
            performed_by_name=request.user.get_full_name() if request.user.is_authenticated else 'Public/Download',
            notes="Logsheet PDF downloaded"
        )

        filename = f"Logsheet_{logsheet.logsheet_number}.pdf"
        response = FileResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=['get'])
    def next_number(self, request):
        """Preview next sequential logsheet number"""
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
        return Response({'next_number': f"LOG-{year}-{next_num:05d}"})
