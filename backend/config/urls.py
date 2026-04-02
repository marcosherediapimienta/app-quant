from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', lambda _: JsonResponse({"status": "healthy"})),
    path('api/v1/', include('apps.api.urls')),
]
