from decimal import Decimal
from rest_framework import serializers
from .models import Logsheet, LogsheetAudit, LogsheetAttachment
from apps.fleet.models import Machine
from apps.customers.models import Customer, Project, Site
from apps.operators.models import Operator

class LogsheetAuditSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogsheetAudit
        fields = ['id', 'action', 'performed_by_name', 'timestamp', 'notes', 'snapshot']

class LogsheetAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogsheetAttachment
        fields = ['id', 'title', 'file', 'file_type', 'created_at']

class LogsheetListSerializer(serializers.ModelSerializer):
    machine_code = serializers.CharField(source='machine.asset_code', read_only=True)
    machine_name = serializers.CharField(source='machine.name', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    operator_name = serializers.CharField(source='operator.name', read_only=True)
    shift_display = serializers.CharField(source='get_shift_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Logsheet
        fields = [
            'id', 'logsheet_number', 'date', 'shift', 'shift_display',
            'machine', 'machine_code', 'machine_name',
            'customer', 'customer_name', 'site', 'site_name',
            'operator', 'operator_name',
            'opening_meter', 'closing_meter', 'working_hours',
            'idle_hours', 'breakdown_hours', 'overtime_hours',
            'diesel_consumed_litres', 'status', 'status_display',
            'billed', 'created_at'
        ]

class LogsheetDetailSerializer(serializers.ModelSerializer):
    machine_code = serializers.CharField(source='machine.asset_code', read_only=True)
    machine_name = serializers.CharField(source='machine.name', read_only=True)
    machine_make_model = serializers.CharField(source='machine.make_model', read_only=True)
    machine_reg = serializers.CharField(source='machine.registration_number', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    site_location = serializers.CharField(source='site.location', read_only=True)
    operator_name = serializers.CharField(source='operator.name', read_only=True)
    operator_phone = serializers.CharField(source='operator.phone', read_only=True)
    shift_display = serializers.CharField(source='get_shift_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    condition_display = serializers.CharField(source='get_equipment_condition_display', read_only=True)
    prepared_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    audit_trail = LogsheetAuditSerializer(many=True, read_only=True)
    attachments = LogsheetAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Logsheet
        fields = '__all__'
        read_only_fields = ['id', 'logsheet_number', 'working_hours', 'created_at', 'updated_at']

    def get_prepared_by_name(self, obj):
        return obj.prepared_by.get_full_name() or obj.prepared_by.username if obj.prepared_by else ''

    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() or obj.approved_by.username if obj.approved_by else ''

    def validate(self, data):
        opening = data.get('opening_meter', getattr(self.instance, 'opening_meter', None))
        closing = data.get('closing_meter', getattr(self.instance, 'closing_meter', None))
        
        if opening is not None and closing is not None:
            if Decimal(str(closing)) < Decimal(str(opening)):
                raise serializers.ValidationError({
                    'closing_meter': f"Closing meter ({closing}) cannot be less than opening meter ({opening})."
                })

        machine = data.get('machine', getattr(self.instance, 'machine', None))
        date = data.get('date', getattr(self.instance, 'date', None))
        shift = data.get('shift', getattr(self.instance, 'shift', None))
        
        # Check duplicate
        if machine and date and shift:
            qs = Logsheet.objects.filter(machine=machine, date=date, shift=shift).exclude(
                status__in=[Logsheet.Status.VOIDED, Logsheet.Status.REJECTED]
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                existing = qs.first()
                raise serializers.ValidationError(
                    f"A logsheet ({existing.logsheet_number}) already exists for this machine on {date} for shift {shift}."
                )

        return data

