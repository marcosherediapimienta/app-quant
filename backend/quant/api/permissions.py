import os

from rest_framework.permissions import BasePermission


class HasApiKey(BasePermission):
    """
    If API_KEY is set in the environment, requires a matching
    X-API-Key header on every request.  When the variable is
    absent (local development) all requests are allowed.
    """

    def has_permission(self, request, view):
        api_key = os.getenv('API_KEY')
        if not api_key:
            return True
        return request.META.get('HTTP_X_API_KEY') == api_key
