import logging

import pandas as pd
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from quant.utils.serializers import QuantResponseSerializer
from ._services import get_risk_service
from ._utils import api_endpoint, parse_returns_df, parse_weights, require_fields

logger = logging.getLogger('quant.api')

@api_view(['POST'])
@api_endpoint("Error calculating risk ratios")
def risk_calculate_ratios(request):
    err = require_fields(request.data, 'returns', 'weights', 'risk_free_rate')
    if err:
        return err

    returns_df = parse_returns_df(request.data['returns'])
    if returns_df.empty:
        return Response({"error": "Returns DataFrame is empty"}, status=status.HTTP_400_BAD_REQUEST)

    weights = parse_weights(request.data['weights'])
    risk_free_rate = request.data['risk_free_rate']
    ddof = request.data.get('ddof', 0)

    result = get_risk_service().calculate_ratios(returns_df, weights, risk_free_rate, ddof)
    return Response(QuantResponseSerializer.clean_response(result), status=status.HTTP_200_OK)

@api_view(['POST'])
@api_endpoint("Error calculating VaR/ES")
def risk_calculate_var_es(request):
    err = require_fields(request.data, 'returns', 'weights')
    if err:
        return err

    returns_df = parse_returns_df(request.data['returns'])
    weights = parse_weights(request.data['weights'])
    confidence_level = request.data.get('confidence_level', 0.95)
    method = request.data.get('method', 'historical')

    result = get_risk_service().calculate_var_es(returns_df, weights, confidence_level, method)
    return Response(QuantResponseSerializer.clean_response(result), status=status.HTTP_200_OK)

@api_view(['POST'])
@api_endpoint("Error calculating drawdown")
def risk_calculate_drawdown(request):
    err = require_fields(request.data, 'returns', 'weights')
    if err:
        return err

    returns_df = parse_returns_df(request.data['returns'])
    weights = parse_weights(request.data['weights'])
    risk_free_rate = request.data.get('risk_free_rate', 0.0)

    result = get_risk_service().calculate_drawdown(returns_df, weights, risk_free_rate)
    return Response(QuantResponseSerializer.clean_response(result), status=status.HTTP_200_OK)

@api_view(['POST'])
@api_endpoint("Error in benchmark analysis")
def risk_analyze_benchmark(request):
    err = require_fields(request.data, 'returns', 'weights', 'benchmark_returns', 'risk_free_rate')
    if err:
        return err

    returns_df = parse_returns_df(request.data['returns'])
    weights = parse_weights(request.data['weights'])
    risk_free_rate = request.data['risk_free_rate']
    ddof = request.data.get('ddof', 1)

    benchmark_returns = pd.Series(request.data['benchmark_returns'])
    benchmark_returns.index = pd.to_datetime(benchmark_returns.index)

    common = returns_df.index.intersection(benchmark_returns.index)
    result = get_risk_service().analyze_benchmark(
        returns_df.loc[common],
        weights,
        benchmark_returns.loc[common],
        risk_free_rate,
        ddof,
    )
    return Response(QuantResponseSerializer.clean_response(result), status=status.HTTP_200_OK)

@api_view(['POST'])
@api_endpoint("Error analyzing distribution")
def risk_analyze_distribution(request):
    err = require_fields(request.data, 'returns', 'weights')
    if err:
        return err

    returns_df = parse_returns_df(request.data['returns'])
    weights = parse_weights(request.data['weights'])

    result = get_risk_service().analyze_distribution(returns_df, weights)
    return Response(QuantResponseSerializer.clean_response(result), status=status.HTTP_200_OK)


@api_view(['POST'])
@api_endpoint("Error analyzing correlation")
def risk_analyze_correlation(request):
    err = require_fields(request.data, 'returns')
    if err:
        return err

    returns_df = parse_returns_df(request.data['returns'])

    result = get_risk_service().analyze_correlation(returns_df)
    return Response(QuantResponseSerializer.clean_response(result), status=status.HTTP_200_OK)

@api_view(['POST'])
@api_endpoint("Error in complete risk analysis")
def risk_analyze_complete(request):
    tickers = request.data.get('tickers')
    if not tickers or not isinstance(tickers, list) or len(tickers) == 0:
        return Response(
            {"error": "tickers is required and must be a non-empty list"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    result = get_risk_service().analyze_complete(
        tickers=tickers,
        benchmark_name=request.data.get('benchmark_name', 'SP500'),
        start_date=request.data.get('start_date', ''),
        end_date=request.data.get('end_date', ''),
        weights=request.data.get('weights'),
        risk_free_rate=request.data.get('risk_free_rate', 0.03),
        confidence_level=request.data.get('confidence_level', 0.95),
        var_methods=request.data.get('var_methods'),
    )
    return Response(QuantResponseSerializer.clean_response(result), status=status.HTTP_200_OK)
