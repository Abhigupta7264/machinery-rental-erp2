from rest_framework import serializers, viewsets, permissions
from .models import RentalContract

class RentalContractSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    machine_code = serializers.CharField(source='machine.asset_code', read_only=True)
    machine_name = serializers.CharField(source='machine.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = RentalContract
        fields = '__all__'

class RentalContractViewSet(viewsets.ModelViewSet):
    queryset = RentalContract.objects.all().select_related('customer', 'project', 'site', 'machine')
    serializer_class = RentalContractSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        cust = self.request.query_params.get('customer')
        mach = self.request.query_params.get('machine')
        if cust:
            qs = qs.filter(customer_id=cust)
        if mach:
            qs = qs.filter(machine_id=mach)
        return qs

