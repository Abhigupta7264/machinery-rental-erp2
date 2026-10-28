from rest_framework import viewsets, permissions, filters
from django.db.models import Q
from .models import Machine, MachineCategory
from .serializers import MachineSerializer, MachineCategorySerializer

class MachineCategoryViewSet(viewsets.ModelViewSet):
    queryset = MachineCategory.objects.all()
    serializer_class = MachineCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class MachineViewSet(viewsets.ModelViewSet):
    queryset = Machine.objects.all().select_related('category', 'current_customer', 'current_site', 'current_operator')
    serializer_class = MachineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        status_val = params.get('status')
        category_id = params.get('category')
        search = params.get('search')
        customer_id = params.get('customer')

        if status_val:
            qs = qs.filter(status=status_val)
        if category_id:
            qs = qs.filter(category_id=category_id)
        if customer_id:
            qs = qs.filter(current_customer_id=customer_id)
        if search:
            qs = qs.filter(
                Q(asset_code__icontains=search) |
                Q(name__icontains=search) |
                Q(make_model__icontains=search) |
                Q(registration_number__icontains=search)
            )
        return qs

