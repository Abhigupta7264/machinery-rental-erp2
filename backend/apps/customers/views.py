from rest_framework import viewsets, permissions
from .models import Customer, Project, Site
from .serializers import CustomerSerializer, ProjectSerializer, SiteSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().prefetch_related('projects', 'deployed_machines')
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().select_related('customer').prefetch_related('sites')
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        cust = self.request.query_params.get('customer')
        if cust:
            qs = qs.filter(customer_id=cust)
        return qs

class SiteViewSet(viewsets.ModelViewSet):
    queryset = Site.objects.all().select_related('project', 'project__customer', 'supervisor')
    serializer_class = SiteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        proj = self.request.query_params.get('project')
        cust = self.request.query_params.get('customer')
        if proj:
            qs = qs.filter(project_id=proj)
        if cust:
            qs = qs.filter(project__customer_id=cust)
        return qs

