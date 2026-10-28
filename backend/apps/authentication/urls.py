from django.urls import path
from .views import LoginView, LogoutView, CurrentUserView, UserListView

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', CurrentUserView.as_view(), name='auth-me'),
    path('users/', UserListView.as_view(), name='auth-users'),
]

