from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, ProjectViewSet, SiteViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'sites', SiteViewSet, basename='site')

urlpatterns = [
    path('', include(router.urls)),
]

