import logging

import numpy as np
import pandas as pd
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from quant.utils.serializers import QuantResponseSerializer
from ._services import get_capm_service
from ._utils import api_endpoint, parse_returns_df, parse_market_returns, require_fields

logger = logging.getLogger('quant.api')

@api_view(['POST'])
@api_endpoint("Error in CAPM analysis")
def capm_analyze(request):
    err = require_fields(request.data, 'asset_returns', 'market_returns', 'risk_free_rate')
    if err:
        return err

    asset_array = np.array(request.data['asset_returns'])
    market_array = np.array(request.data['market_returns'])
    risk_free_rate = request.data['risk_free_rate']
    market_ticker = request.data.get('market_ticker')

    result = get_capm_service().analyze_capm(asset_array, market_array, risk_free_rate, market_ticker=market_ticker)
    return Response(QuantResponseSerializer.clean_response(result), status=status.HTTP_200_OK)

@api_view(['POST'])
@api_endpoint("Error in multi-asset CAPM analysis")
def capm_multi_asset(request):
    err = require_fields(request.data, 'returns', 'market_returns', 'risk_free_rate')
    if err:
        return err

    returns_df = parse_returns_df(request.data['returns'])
    market_returns = parse_market_returns(request.data['market_returns'])
    risk_free_rate = request.data['risk_free_rate']
    market_ticker = request.data.get('market_ticker')

    combined = pd.concat(
        [returns_df, market_returns.rename('__market__')], axis=1, join='inner',
    ).dropna()

    if combined.empty:
        return Response(
            {"error": "No valid overlapping data between assets and market"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    returns_aligned = combined.drop(columns='__market__')
    market_aligned = combined['__market__']

    result = get_capm_service().analyze_multi_asset(
        returns_aligned,
        market_aligned,
        risk_free_rate,
        market_ticker=market_ticker,
    )
    return Response(QuantResponseSerializer.clean_response(result), status=status.HTTP_200_OK)

@api_view(['POST'])
@api_endpoint("Error optimizing CAPM portfolio")
def capm_optimize(request):
    err = require_fields(request.data, 'returns', 'risk_free_rate')
    if err:
        return err

    risk_free_rate = request.data['risk_free_rate']
    n_points = request.data.get('n_points', 50)
    allow_short = request.data.get('allow_short', False)

    logger.debug(
        "capm_optimize — rfr=%s, n_points=%s, allow_short=%s, dates=%d",
        risk_free_rate, n_points, allow_short,
        len(request.data['returns']),
    )

    returns_df = parse_returns_df(request.data['returns'])
    returns_df = returns_df.dropna()

    if returns_df.empty:
        return Response(
            {"error": "DataFrame empty after cleaning NaN"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    result = get_capm_service().optimize_portfolio(returns_df, risk_free_rate, n_points, allow_short)

    logger.debug(
        "capm_optimize — %d frontier points, %d cml points, tangent=%s",
        len(result.get('frontier', [])), len(result.get('cml', [])), result.get('tangent_point'),
    )

    return Response(QuantResponseSerializer.clean_response(result), status=status.HTTP_200_OK)

@api_view(['POST'])
@api_endpoint("Error calculating CAPM expected return")
def capm_expected_return(request):
    err = require_fields(request.data, 'beta', 'risk_free_rate', 'market_return')
    if err:
        return err

    beta = request.data['beta']
    risk_free_rate = request.data['risk_free_rate']
    market_return = request.data['market_return']

    expected_return = get_capm_service().expected_return(beta, risk_free_rate, market_return)
    return Response(
        {
            "expected_return": float(expected_return),
            "beta": beta,
            "risk_free_rate": risk_free_rate,
            "market_return": market_return,
        },
        status=status.HTTP_200_OK,
    )
