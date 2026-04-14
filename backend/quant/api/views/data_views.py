import logging

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from quant.utils.serializers import QuantResponseSerializer
from ._services import get_data_service
from ._utils import api_endpoint

logger = logging.getLogger('quant.api')

@api_view(['POST'])
@api_endpoint("Error downloading data")
def download_sample_data(request):
    tickers = request.data.get('tickers', ['AAPL', 'GOOGL', 'MSFT'])

    if not isinstance(tickers, list):
        return Response(
            {"error": "tickers must be a list"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    start_date = request.data.get('start_date')
    end_date = request.data.get('end_date')
    data_type = request.data.get('type', 'returns')

    result = get_data_service().download_tickers(tickers, start_date, end_date, data_type)
    return Response(result, status=status.HTTP_200_OK)

@api_view(['POST'])
@api_endpoint("Error downloading macro factors")
def download_macro_factors(request):
    factors = request.data.get('factors')
    start_date = request.data.get('start_date')
    end_date = request.data.get('end_date')

    logger.debug("download_macro_factors — factors: %s, dates: %s → %s", factors, start_date, end_date)

    result = get_data_service().download_macro_factors(factors, start_date, end_date)
    clean_result = QuantResponseSerializer.clean_response(result)

    logger.info("download_macro_factors — %d dates returned", len(clean_result.get('data', {})))
    return Response(clean_result, status=status.HTTP_200_OK)
