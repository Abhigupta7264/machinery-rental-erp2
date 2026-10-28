from rest_framework import views, status, permissions
from rest_framework.response import Response
from .models import CompanySettings, AuditLog
from .serializers import CompanySettingsSerializer, AuditLogSerializer

class CompanySettingsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        settings = CompanySettings.get_settings()
        serializer = CompanySettingsSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        if not (request.user.is_superuser or getattr(request.user, 'role', '') in ['ADMINISTRATOR', 'OPERATIONS_MANAGER']):
            return Response({'error': 'Unauthorized to change company settings'}, status=status.HTTP_403_FORBIDDEN)
        settings = CompanySettings.get_settings()
        serializer = CompanySettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AuditLogListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        entity = request.query_params.get('entity')
        entity_id = request.query_params.get('entity_id')
        logs = AuditLog.objects.all()
        if entity:
            logs = logs.filter(entity_name=entity)
        if entity_id:
            logs = logs.filter(entity_id=entity_id)
        serializer = AuditLogSerializer(logs[:100], many=True)
        return Response(serializer.data)

