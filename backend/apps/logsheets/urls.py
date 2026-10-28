from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LogsheetViewSet

router = DefaultRouter()
router.register(r'', LogsheetViewSet, basename='logsheet')

urlpatterns = [
    path('', include(router.urls)),
]

