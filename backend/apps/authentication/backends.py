from rest_framework import authentication, exceptions
from .models import UserAuthToken

class SessionOrTokenAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() in ('bearer', 'token'):
            token_key = parts[1]
            try:
                token = UserAuthToken.objects.select_related('user').get(key=token_key)
                if not token.user.is_active:
                    raise exceptions.AuthenticationFailed('User account is inactive.')
                return (token.user, token)
            except UserAuthToken.DoesNotExist:
                raise exceptions.AuthenticationFailed('Invalid authentication token.')

        return None
