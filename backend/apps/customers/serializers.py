from rest_framework import serializers
from .models import Customer, Project, Site

class SiteSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    customer_name = serializers.CharField(source='project.customer.name', read_only=True)
    customer_id = serializers.CharField(source='project.customer.id', read_only=True)
    supervisor_name = serializers.CharField(source='supervisor.get_full_name', read_only=True)

    class Meta:
        model = Site
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    sites = SiteSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = '__all__'

class CustomerSerializer(serializers.ModelSerializer):
    projects = ProjectSerializer(many=True, read_only=True)
    deployed_machine_count = serializers.IntegerField(source='deployed_machines.count', read_only=True)

    class Meta:
        model = Customer
        fields = '__all__'

