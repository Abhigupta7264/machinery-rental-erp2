from rest_framework import serializers, viewsets, permissions
from .models import FuelRecord

class FuelRecordSerializer(serializers.ModelSerializer):
    machine_code = serializers.CharField(source='machine.asset_code', read_only=True)
    machine_name = serializers.CharField(source='machine.name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)

    class Meta:
        model = FuelRecord
        fields = '__all__'
        read_only_fields = ['id', 'total_cost', 'created_at', 'updated_at']

class FuelRecordViewSet(viewsets.ModelViewSet):
    queryset = FuelRecord.objects.all().select_related('machine', 'site')
    serializer_class = FuelRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        mach = self.request.query_params.get('machine')
        site = self.request.query_params.get('site')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if mach:
            qs = qs.filter(machine_id=mach)
        if site:
            qs = qs.filter(site_id=site)
        if date_from:
            qs = qs.filter(issue_date__gte=date_from)
        if date_to:
            qs = qs.filter(issue_date__lte=date_to)
        return qs

