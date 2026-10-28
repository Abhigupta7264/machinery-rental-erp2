from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RentalContractViewSet

router = DefaultRouter()
router.register(r'', RentalContractViewSet, basename='contract')

urlpatterns = [
    path('', include(router.urls)),
]

