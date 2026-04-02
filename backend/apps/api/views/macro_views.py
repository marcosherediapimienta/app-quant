import logging
from typing import Optional, Tuple

import pandas as pd
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from apps.api.serializers import QuantResponseSerializer
from ._services import get_macro_service
from ._utils import (
    api_endpoint,
    parse_portfolio_series,
    parse_macro_factors,
    build_macro_df,
)

logger = logging.getLogger('apps.api')

MIN_OBSERVATIONS = 100

def _prepare_macro_data(
    raw_returns,
    raw_factors,
    min_obs: int = MIN_OBSERVATIONS,
) -> Tuple[Optional[Response], Optional[pd.Series], Optional[pd.DataFrame]]:

    if not raw_returns or not raw_factors:
        return (
            Response(
                {"error": "portfolio_returns and macro_factors are required"},
                status=status.HTTP_400_BAD_REQUEST,
            ),
            None,
            None,
        )

    portfolio_series = parse_portfolio_series(raw_returns)

    cleaned_factors = parse_macro_factors(raw_factors)
    if not cleaned_factors:
        sample = (
            list(raw_factors.get(list(raw_factors.keys())[0], {}).keys())
            if raw_factors
            else []
        )
        return (
            Response(
                {
                    "error": "Could not process macro factors",
                    "debug": {"sample_factors": sample, "total_dates": len(raw_factors)},
                },
                status=status.HTTP_400_BAD_REQUEST,
            ),
            None,
            None,
        )

    factors_df = build_macro_df(cleaned_factors)

    if factors_df.empty or len(factors_df.columns) == 0:
        return (
            Response(
                {"error": "No valid factor columns found"},
                status=status.HTTP_400_BAD_REQUEST,
            ),
            None,
            None,
        )

    # Macro factors arrive as prices → convert to returns
    factors_returns = factors_df.pct_change().dropna()

    common_dates = portfolio_series.index.intersection(factors_returns.index)
    if len(common_dates) < min_obs:
        return (
            Response(
                {"error": f"Insufficient observations: {len(common_dates)} < {min_obs}"},
                status=status.HTTP_400_BAD_REQUEST,
            ),
            None,
            None,
        )

    return None, portfolio_series.loc[common_dates], factors_returns.loc[common_dates]


@api_view(['POST'])
@api_endpoint("Error in macro factor analysis")
def macro_analyze_factors(request):
    use_hac = request.data.get('use_hac', True)

    err, portfolio_series, factors_returns = _prepare_macro_data(
        request.data.get('portfolio_returns'),
        request.data.get('macro_factors'),
    )
    if err:
        return err

    result = get_macro_service().analyze_factors(portfolio_series, factors_returns, use_hac)
    return Response(QuantResponseSerializer.clean_response(result), status=status.HTTP_200_OK)


@api_view(['POST'])
@api_endpoint("Error in macro correlation analysis")
def macro_analyze_correlation(request):
    err, portfolio_series, factors_returns = _prepare_macro_data(
        request.data.get('portfolio_returns'),
        request.data.get('macro_factors'),
    )
    if err:
        return err

    result = get_macro_service().analyze_correlation(portfolio_series, factors_returns)
    return Response(QuantResponseSerializer.clean_response(result), status=status.HTTP_200_OK)


@api_view(['POST'])
@api_endpoint("Error in macro situation analysis")
def macro_analyze_situation(request):
    factors_data = request.data.get('factors_data')
    if not factors_data:
        return Response(
            {"error": "factors_data is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    factors_dict = {}
    for k, v in factors_data.items():
        if not v:
            logger.debug("macro_analyze_situation — factor '%s' has no data, skipping", k)
            continue
        try:
            series = pd.Series(v)
            series.index = pd.to_datetime(series.index)
            if len(series) > 0 and not series.isna().all():
                factors_dict[k] = series
            else:
                logger.warning("macro_analyze_situation — factor '%s' is empty or all-NaN, skipping", k)
        except Exception as exc:
            logger.warning("macro_analyze_situation — error processing factor '%s': %s", k, exc)

    logger.debug("macro_analyze_situation — factors with data: %s", list(factors_dict.keys()))

    result = get_macro_service().analyze_situation(factors_dict)

    if 'global_bonds' in result:
        logger.debug("macro_analyze_situation — bonds found: %s", list(result['global_bonds'].keys()))

    return Response(QuantResponseSerializer.clean_response(result), status=status.HTTP_200_OK)
