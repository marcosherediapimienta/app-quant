import logging

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from apps.api.serializers import QuantResponseSerializer
from ._services import get_chat_service
from ._utils import api_endpoint

logger = logging.getLogger('apps.api')

@api_view(['POST'])
@api_endpoint("Error processing message")
def chat_send_message(request):
    message = request.data.get('message')

    if not message:
        return Response({"error": "message is required"}, status=status.HTTP_400_BAD_REQUEST)

    result = get_chat_service().send_message(
        message,
        request.data.get('session_id'),
        request.data.get('context'),
    )
    return Response(QuantResponseSerializer.clean_response(result), status=status.HTTP_200_OK)

@api_view(['GET'])
@api_endpoint("Error getting welcome message")
def chat_welcome(request):
    message = get_chat_service().get_welcome_message()
    return Response({"message": message}, status=status.HTTP_200_OK)

@api_view(['POST'])
@api_endpoint("Error clearing memory")
def chat_clear_memory(request):
    get_chat_service().clear_memory(request.data.get('session_id'))
    return Response({"message": "Memory cleared"}, status=status.HTTP_200_OK)

@api_view(['GET'])
@api_endpoint("Error getting history")
def chat_history(request):
    session_id = request.GET.get('session_id')
    last_n = int(request.GET.get('last_n', 10))
    history = get_chat_service().get_history(session_id, last_n)
    return Response({"history": history}, status=status.HTTP_200_OK)
