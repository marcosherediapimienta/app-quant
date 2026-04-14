import logging

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from quant.utils.serializers import QuantResponseSerializer
from ._services import get_valuation_service
from ._utils import api_endpoint, require_fields

logger = logging.getLogger('quant.api')

@api_view(['POST'])
@api_endpoint("Error in company analysis")
def valuation_analyze_company(request):
    err = require_fields(request.data, 'ticker')
    if err:
        return err

    result = get_valuation_service().analyze_company(request.data['ticker'])
    return Response(QuantResponseSerializer.clean_response(result), status=status.HTTP_200_OK)


@api_view(['POST'])
@api_endpoint("Error in company comparison")
def valuation_compare(request):
    err = require_fields(request.data, 'tickers')
    if err:
        return err

    result = get_valuation_service().compare_companies(request.data['tickers'])
    return Response(QuantResponseSerializer.clean_response(result), status=status.HTTP_200_OK)


@api_view(['POST'])
@api_endpoint("Error in sector analysis")
def valuation_analyze_sector(request):
    err = require_fields(request.data, 'ticker')
    if err:
        return err

    result = get_valuation_service().analyze_sector(
        request.data['ticker'],
        request.data.get('peers'),
        request.data.get('fetch_peers', True),
    )
    return Response(QuantResponseSerializer.clean_response(result), status=status.HTTP_200_OK)


@api_view(['POST'])
@api_endpoint("Error generating valuation signals")
def valuation_generate_signals(request):
    err = require_fields(request.data, 'tickers')
    if err:
        return err

    result = get_valuation_service().generate_signals(request.data['tickers'])
    return Response(QuantResponseSerializer.clean_response(result), status=status.HTTP_200_OK)
