from rest_framework import serializers, viewsets, permissions
from .models import MaintenanceRecord

class MaintenanceRecordSerializer(serializers.ModelSerializer):
    machine_code = serializers.CharField(source='machine.asset_code', read_only=True)
    machine_name = serializers.CharField(source='machine.name', read_only=True)
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = MaintenanceRecord
        fields = '__all__'
        read_only_fields = ['id', 'total_cost', 'created_at', 'updated_at']

class MaintenanceRecordViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceRecord.objects.all().select_related('machine')
    serializer_class = MaintenanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        mach = self.request.query_params.get('machine')
        stat = self.request.query_params.get('status')
        if mach:
            qs = qs.filter(machine_id=mach)
        if stat:
            qs = qs.filter(status=stat)
        return qs

