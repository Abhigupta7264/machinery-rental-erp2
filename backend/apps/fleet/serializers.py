from rest_framework import serializers
from .models import Machine, MachineCategory
from apps.customers.models import Customer, Site
from apps.operators.models import Operator

class MachineCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MachineCategory
        fields = '__all__'

class MachineSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    customer_name = serializers.CharField(source='current_customer.name', read_only=True)
    site_name = serializers.CharField(source='current_site.name', read_only=True)
    operator_name = serializers.CharField(source='current_operator.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    ownership_display = serializers.CharField(source='get_ownership_type_display', read_only=True)
    billing_type_display = serializers.CharField(source='get_billing_type_display', read_only=True)

    class Meta:
        model = Machine
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

