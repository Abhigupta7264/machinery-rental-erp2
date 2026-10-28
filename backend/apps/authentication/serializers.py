from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'role', 'role_display', 'phone', 'employee_code', 'is_active', 'can_approve_logsheets', 'can_edit_billing']
        read_only_fields = ['id', 'full_name', 'role_display', 'can_approve_logsheets', 'can_edit_billing']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        user = authenticate(username=username, password=password)
        if not user:
            # Also check if username matches email
            try:
                user_obj = User.objects.get(email=username)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass

        if not user:
            raise serializers.ValidationError('Invalid username/email or password.')
        if not user.is_active:
            raise serializers.ValidationError('User account is deactivated.')
        data['user'] = user
        return data

