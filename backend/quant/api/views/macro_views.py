import logging
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from quant.utils.serializers import QuantResponseSerializer
from ._services import get_macro_service
from ._utils import (
    api_endpoint,
    parse_portfolio_series,
    parse_macro_factors,
    build_macro_df,
)

logger = logging.getLogger('quant.api')

MIN_OBSERVATIONS = 100
MIN_OBS_CORRELATION_MATRIX = 60
TOP_PAIR_LIMIT = 20


def _compute_correlation_matrix_log_returns(
    cleaned_factors: dict,
    min_obs: int = MIN_OBS_CORRELATION_MATRIX,
    corr_method: str = "pearson",
) -> Tuple[Optional[Response], Optional[Dict[str, Any]]]:
    """
    Pairwise correlation on daily log-returns: ln(P_t) - ln(P_{t-1}).
    corr_method: 'pearson' (linear) or 'spearman' (monotonic / rank-based).
    Requires strictly positive price levels (non-positive cells masked before log).
    """
    method = (corr_method or "pearson").strip().lower()
    if method not in ("pearson", "spearman"):
        return (
            Response(
                {"error": "correlation_method must be 'pearson' or 'spearman'"},
                status=status.HTTP_400_BAD_REQUEST,
            ),
            None,
        )
    if not cleaned_factors:
        return (
            Response(
                {"error": "Could not parse series payload"},
                status=status.HTTP_400_BAD_REQUEST,
            ),
            None,
        )

    prices_df = build_macro_df(cleaned_factors)
    if prices_df.empty or prices_df.shape[1] < 2:
        return (
            Response(
                {
                    "error": "Need at least two series with overlapping data for a correlation matrix",
                    "debug": {"columns": list(prices_df.columns), "rows": int(len(prices_df))},
                },
                status=status.HTTP_400_BAD_REQUEST,
            ),
            None,
        )

    prices_df = prices_df.apply(pd.to_numeric, errors="coerce")
    prices_df = prices_df.where(prices_df > 0)
    log_prices = np.log(prices_df)
    log_returns = log_prices.diff().dropna(how="all")
    log_returns = log_returns.dropna(axis=1, how="all")

    if log_returns.shape[1] < 2:
        return (
            Response(
                {"error": "After log-returns, fewer than 2 valid series remain (check for non-positive prices)"},
                status=status.HTTP_400_BAD_REQUEST,
            ),
            None,
        )

    if len(log_returns) < min_obs:
        return (
            Response(
                {
                    "error": f"Insufficient observations for correlation matrix: {len(log_returns)} < {min_obs}",
                },
                status=status.HTTP_400_BAD_REQUEST,
            ),
            None,
        )

    min_periods = max(10, min(30, len(log_returns) // 4))
    corr = log_returns.corr(method=method, min_periods=min_periods)
    corr = corr.replace([np.inf, -np.inf], np.nan)

    pairs: List[Tuple[str, str, float]] = []
    cols = list(corr.columns)
    for i, a in enumerate(cols):
        for b in cols[i + 1 :]:
            val = corr.loc[a, b]
            if pd.isna(val):
                continue
            pairs.append((a, b, float(val)))

    positive = [(a, b, c) for a, b, c in pairs if c > 0]
    positive.sort(key=lambda x: -x[2])
    negative = [(a, b, c) for a, b, c in pairs if c < 0]
    negative.sort(key=lambda x: x[2])

    def _pair_rows(items: List[Tuple[str, str, float]]) -> List[Dict[str, Any]]:
        out = []
        for a, b, c in items[:TOP_PAIR_LIMIT]:
            out.append({"series_a": a, "series_b": b, "correlation": c})
        return out

    result = {
        "analysis_mode": "correlation_matrix_log_returns",
        "return_type": "log",
        "correlation_method": method,
        "n_observations": int(len(log_returns)),
        "n_series": int(log_returns.shape[1]),
        "min_periods": int(min_periods),
        "correlation_matrix": corr.to_dict(),
        "top_positive_pairs": _pair_rows(positive),
        "top_negative_pairs": _pair_rows(negative),
    }
    return None, result

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
@api_endpoint("Error in macro correlation matrix analysis")
def macro_analyze_correlation_matrix(request):
    """
    All-to-all correlation matrix on log-returns of price series.
    Body: { "macro_factors": { "<date>": { "<ticker>": <float>, ... }, ... } }
    or alias key "series" with the same nested shape as macro factor downloads.
    Optional: min_observations (default 60).
    Optional: correlation_method — 'pearson' (default) or 'spearman'.
    """
    raw = request.data.get('macro_factors') or request.data.get('series')
    try:
        min_obs = int(request.data.get('min_observations', MIN_OBS_CORRELATION_MATRIX))
    except (TypeError, ValueError):
        min_obs = MIN_OBS_CORRELATION_MATRIX

    raw_method = request.data.get("correlation_method", "pearson")
    if isinstance(raw_method, str) and raw_method.strip():
        corr_method = raw_method.strip().lower()
    else:
        corr_method = "pearson"

    cleaned = parse_macro_factors(raw) if raw else {}
    err, result = _compute_correlation_matrix_log_returns(
        cleaned,
        min_obs=min_obs,
        corr_method=corr_method,
    )
    if err:
        return err

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
            series = series.sort_index()
            series = series.dropna()
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
