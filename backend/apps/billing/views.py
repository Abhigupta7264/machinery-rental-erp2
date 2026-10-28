from rest_framework import serializers, viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Invoice, InvoiceItem
from apps.logsheets.models import Logsheet

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = '__all__'
        read_only_fields = ['amount']

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['id', 'invoice_number', 'subtotal', 'tax_amount', 'grand_total', 'balance_due', 'created_at', 'updated_at']

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().select_related('customer', 'project').prefetch_related('items')
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def generate_from_logsheets(self, request):
        """Generate an invoice from a batch of approved, unbilled logsheets"""
        customer_id = request.data.get('customer')
        logsheet_ids = request.data.get('logsheet_ids', [])
        
        if not customer_id or not logsheet_ids:
            return Response({'error': 'customer and logsheet_ids are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get approved unbilled logsheets
        logsheets = Logsheet.objects.filter(
            id__in=logsheet_ids,
            customer_id=customer_id,
            status=Logsheet.Status.APPROVED,
            billed=False
        ).select_related('machine')

        if not logsheets.exists():
            return Response({'error': 'No eligible approved, unbilled logsheets found for this customer.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create Invoice
        invoice = Invoice.objects.create(
            customer_id=customer_id,
            project=logsheets.first().project,
            notes=f"Auto-generated from {logsheets.count()} approved daily machinery logsheet(s)."
        )

        for log in logsheets:
            rate = log.machine.rental_rate if log.machine.rental_rate > 0 else 1500
            desc = f"Logsheet {log.logsheet_number} ({log.date}) - Machine {log.machine.asset_code} [{log.machine.name}] - {log.working_hours} Run Hrs"
            InvoiceItem.objects.create(
                invoice=invoice,
                logsheet=log,
                description=desc,
                quantity_hours=log.working_hours,
                unit_rate=rate
            )

        invoice.calculate_totals()
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)

