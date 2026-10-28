from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FuelRecordViewSet

router = DefaultRouter()
router.register(r'', FuelRecordViewSet, basename='fuel')

urlpatterns = [
    path('', include(router.urls)),
]

