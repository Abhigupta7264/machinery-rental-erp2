from rest_framework import serializers, viewsets, permissions
from .models import Operator

class OperatorSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Operator
        fields = '__all__'

class OperatorViewSet(viewsets.ModelViewSet):
    queryset = Operator.objects.all()
    serializer_class = OperatorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        status_val = self.request.query_params.get('status')
        if status_val:
            qs = qs.filter(status=status_val)
        return qs

