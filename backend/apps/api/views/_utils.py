import logging
from functools import wraps

import numpy as np
import pandas as pd
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('apps.api')


def api_endpoint(error_message: str):
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            try:
                return func(request, *args, **kwargs)
            except Exception:
                logger.exception("Error in %s", func.__name__)
                return Response(
                    {"error": error_message},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        return wrapper
    return decorator

_INVALID_FACTOR_COLS = {'Open', 'High', 'Low', 'Close', 'Adj Close', 'Volume'}

def parse_returns_df(returns_data: dict) -> pd.DataFrame:
    df = pd.DataFrame(returns_data).T
    df.index = pd.to_datetime(df.index)
    df = df.apply(pd.to_numeric, errors='coerce')
    df = df.dropna(how='all')
    return df


def _parse_series(data: dict, *, drop_na: bool = False) -> pd.Series:

    if isinstance(data, dict):
        cleaned: dict = {}

        for date, value in data.items():
            if isinstance(value, dict):
                if value:
                    cleaned[date] = next(iter(value.values()))
            else:
                cleaned[date] = value
        series = pd.Series(cleaned)
    else:
        series = pd.Series(data)

    series.index = pd.to_datetime(series.index)
    series = pd.to_numeric(series, errors='coerce')

    if drop_na:
        series = series.dropna()

    return series


def parse_portfolio_series(portfolio_returns: dict) -> pd.Series:
    return _parse_series(portfolio_returns, drop_na=False)


def parse_market_returns(market_returns_data: dict) -> pd.Series:
    return _parse_series(market_returns_data, drop_na=True)


def parse_weights(weights) -> np.ndarray:
    return np.array(weights)

def parse_macro_factors(macro_factors: dict) -> dict:
    cleaned: dict = {}

    for date, factors in macro_factors.items():
        if isinstance(factors, (int, float)):
            logger.warning("parse_macro_factors — scalar value for date %s, skipping", date)
            continue
        if not isinstance(factors, dict):
            continue

        row: dict = {}
        for factor, value in factors.items():
            if isinstance(value, dict):
                if 'Close' in value:
                    row[factor] = value['Close']
                elif value:
                    row[factor] = next(iter(value.values()))
            elif value is None:
                continue
            else:
                try:
                    row[factor] = float(value)
                except (ValueError, TypeError):
                    continue

        if row:
            cleaned[date] = row

    return cleaned


def build_macro_df(cleaned_factors: dict, drop_invalid_cols: bool = True) -> pd.DataFrame:
    df = pd.DataFrame(cleaned_factors).T
    df.index = pd.to_datetime(df.index)

    if drop_invalid_cols:
        valid = [c for c in df.columns if c not in _INVALID_FACTOR_COLS]
        df = df[valid]

    df = df.dropna(how='all').ffill().bfill().dropna()
    return df

def require_fields(data: dict, *fields: str):
    missing = [f for f in fields if not data.get(f) and data.get(f) != 0]
    
    if missing:
        return Response(
            {"error": f"Required fields missing: {', '.join(missing)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return None
