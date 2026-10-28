from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.contrib.auth import login as django_login, logout as django_logout
from .serializers import LoginSerializer, UserSerializer
from .models import User
from .backends import UserAuthToken
from apps.common.models import AuditLog

class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            django_login(request, user)
            # Create or get auth token
            token = UserAuthToken.generate_token(user)
            
            # Audit log
            AuditLog.objects.create(
                actor=user,
                actor_name=user.get_full_name() or user.username,
                entity_name='User',
                entity_id=str(user.id),
                action='LOGIN',
                details={'ip': request.META.get('REMOTE_ADDR')}
            )

            return Response({
                'token': token.key,
                'user': UserSerializer(user).data,
                'message': 'Successfully logged in.'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() in ('bearer', 'token'):
                UserAuthToken.objects.filter(key=parts[1]).delete()
        django_logout(request)
        return Response({'message': 'Successfully logged out.'})

class CurrentUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UserListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        users = User.objects.all().order_by('first_name', 'username')
        role = request.query_params.get('role')
        if role:
            users = users.filter(role=role)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

