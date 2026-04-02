import logging

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from apps.api.serializers import QuantResponseSerializer
from ._services import get_portfolio_service
from ._utils import api_endpoint

logger = logging.getLogger('apps.api')

@api_view(['POST'])
@api_endpoint("Error in portfolio analysis")
def portfolio_analyze(request):
    index_name = request.data.get('index_name')
    candidate_tickers = request.data.get('candidate_tickers')

    if not index_name and not candidate_tickers:
        return Response(
            {"error": "candidate_tickers or index_name is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    start_date = request.data.get('start_date', '')
    end_date = request.data.get('end_date', '')
    config = request.data.get('config')

    service = get_portfolio_service()

    if index_name:
        result = service.analyze_from_index(index_name, start_date, end_date, config)
    else:
        result = service.analyze_portfolio(candidate_tickers, start_date, end_date, config)

    clean_result = QuantResponseSerializer.clean_response(result)
    logger.info("portfolio_analyze — response serialized (%d chars)", len(str(clean_result)))
    return Response(clean_result, status=status.HTTP_200_OK)


@api_view(['GET'])
@api_endpoint("Error getting portfolio indices")
def portfolio_indices(request):
    result = get_portfolio_service().get_supported_indices()
    clean_result = QuantResponseSerializer.clean_response(result)
    return Response(clean_result, status=status.HTTP_200_OK)
