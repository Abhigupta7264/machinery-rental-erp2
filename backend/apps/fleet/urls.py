from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MachineViewSet, MachineCategoryViewSet

router = DefaultRouter()
router.register(r'machines', MachineViewSet, basename='machine')
router.register(r'categories', MachineCategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),
]

