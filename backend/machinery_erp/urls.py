from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/common/', include('apps.common.urls')),
    path('api/fleet/', include('apps.fleet.urls')),
    path('api/customers/', include('apps.customers.urls')),
    path('api/operators/', include('apps.operators.urls')),
    path('api/rentals/', include('apps.rentals.urls')),
    path('api/logsheets/', include('apps.logsheets.urls')),
    path('api/fuel/', include('apps.fuel.urls')),
    path('api/maintenance/', include('apps.maintenance.urls')),
    path('api/billing/', include('apps.billing.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

