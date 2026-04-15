from __future__ import annotations

import logging
from typing import Dict, Iterable, Tuple

import numpy as np
import pandas as pd

from ...tools.config import ADJ_CLOSE_COL, CLOSE_COL
from .data_loader import DataLoader

logger = logging.getLogger(__name__)

_EXCHANGE_SUFFIX_TO_CCY: Dict[str, str] = {
    # Eurozone 
    "MC": "EUR",
    "PA": "EUR",
    "DE": "EUR",
    "MI": "EUR",
    "AS": "EUR",
    "BR": "EUR",
    "LS": "EUR",
    "WA": "EUR",
    "VI": "EUR",
    "CO": "EUR",
    "HE": "EUR",
    "IR": "EUR",
    "F": "EUR",
    "SW": "CHF",
    "ST": "SEK",
    "OL": "NOK",
    "IC": "ISK",
    # UK
    "L": "GBP",
    # Japan
    "T": "JPY",
    # Hong Kong / China
    "HK": "HKD",
    "SS": "CNY",
    "SZ": "CNY",
    # Americas (non-US)
    "TO": "CAD",
    "V": "CAD",
    "MX": "MXN",
    # APAC
    "AX": "AUD",
    "NZ": "NZD",
    "SI": "SGD",
    "KS": "KRW",
    "TW": "TWD",
    "NS": "INR",
    "BO": "INR",
    "SA": "BRL",
    "JO": "ZAR",
    "IS": "TRY",
    "TA": "ILS",
}

_INDEX_TICKER_CCY: Dict[str, str] = {
    "^IBEX": "EUR",
    "^STOXX50E": "EUR",
    "^N225": "JPY",
    "^GSPC": "USD",
    "^IXIC": "USD",
    "^DJI": "USD",
    "^RUT": "USD",
    "^RUA": "USD",
    "^990100-USD-STRD": "USD",
}

_FX_PAIR: Dict[str, Tuple[str, str]] = {
    "EUR": ("EURUSD=X", "direct"),
    "GBP": ("GBPUSD=X", "direct"),
    "JPY": ("USDJPY=X", "inverse_usd"),
    "CHF": ("USDCHF=X", "inverse_usd"),
    "CAD": ("USDCAD=X", "inverse_usd"),
    "AUD": ("AUDUSD=X", "direct"),
    "HKD": ("USDHKD=X", "inverse_usd"),
    "CNY": ("USDCNY=X", "inverse_usd"),
    "SEK": ("USDSEK=X", "inverse_usd"),
    "NOK": ("USDNOK=X", "inverse_usd"),
    "DKK": ("USDDKK=X", "inverse_usd"),
    "NZD": ("NZDUSD=X", "direct"),
    "SGD": ("USDSGD=X", "inverse_usd"),
    "KRW": ("USDKRW=X", "inverse_usd"),
    "INR": ("USDINR=X", "inverse_usd"),
    "MXN": ("USDMXN=X", "inverse_usd"),
    "ZAR": ("USDZAR=X", "inverse_usd"),
    "TRY": ("USDTRY=X", "inverse_usd"),
    "PLN": ("USDPLN=X", "inverse_usd"),
    "ISK": ("ISKUSD=X", "direct"),
    "TWD": ("USDTWD=X", "inverse_usd"),
    "BRL": ("USDBRL=X", "inverse_usd"),
    "ILS": ("USDILS=X", "inverse_usd"),
}


def infer_listing_currency(ticker: str) -> str:
    t = str(ticker).strip()
    if not t:
        return "USD"

    upper = t.upper()
    if upper in _INDEX_TICKER_CCY:
        return _INDEX_TICKER_CCY[upper]

    if "." not in upper:
        return "USD"

    suffix = upper.rsplit(".", 1)[-1]
    return _EXCHANGE_SUFFIX_TO_CCY.get(suffix, "USD")


def _extract_first_price_column(raw: pd.DataFrame, fx_ticker: str) -> pd.Series:

    if raw is None or raw.empty:
        return pd.Series(dtype=float)

    want = str(fx_ticker).strip().upper()

    if isinstance(raw.columns, pd.MultiIndex):
        lev0 = list(raw.columns.get_level_values(0).unique())
        matched = None
        for t in lev0:
            if str(t).strip().upper() == want:
                matched = t
                break
        if matched is not None:
            for col in (ADJ_CLOSE_COL, CLOSE_COL):
                key = (matched, col)
                if key in raw.columns:
                    return pd.to_numeric(raw[key], errors="coerce").dropna()
        for col in (ADJ_CLOSE_COL, CLOSE_COL):
            if col in raw.columns.get_level_values(1):
                u = raw.columns.get_level_values(0).unique()
                if len(u) == 1 and (u[0], col) in raw.columns:
                    return pd.to_numeric(raw[(u[0], col)], errors="coerce").dropna()
    else:
        for col in (ADJ_CLOSE_COL, CLOSE_COL):
            if col in raw.columns:
                return pd.to_numeric(raw[col], errors="coerce").dropna()
    return pd.Series(dtype=float)


def _usd_per_local_series(fx_raw: pd.Series, mode: str) -> pd.Series:
    fx_raw = pd.to_numeric(fx_raw, errors="coerce").replace(0, np.nan)
    if mode == "direct":
        return fx_raw
    if mode == "inverse_usd":
        return 1.0 / fx_raw
    raise ValueError(f"Unknown FX mode: {mode}")


def _download_fx_rates(
    loader: DataLoader,
    fx_tickers: Iterable[str],
    start_date: str,
    end_date: str,
    progress: bool,
) -> Dict[str, pd.Series]:
    tickers = list(dict.fromkeys(fx_tickers))
    if not tickers:
        return {}

    raw = loader.download(tickers, start_date, end_date, progress=progress, threads=True)
    out: Dict[str, pd.Series] = {}
    for fx in tickers:
        s = _extract_first_price_column(raw, fx)
        if not s.empty:
            out[fx] = s.sort_index()
        else:
            logger.warning("FX download returned empty series for %s", fx)
    return out


def normalize_adj_close_to_usd(
    prices: pd.DataFrame,
    start_date: str,
    end_date: str,
    loader: DataLoader,
    *,
    progress: bool = False,
) -> pd.DataFrame:

    if prices is None or prices.empty:
        return prices

    df = prices.copy()
    df.index = pd.to_datetime(df.index)
    df = df.sort_index()

    tickers = [str(c) for c in df.columns]
    ticker_ccy = {t: infer_listing_currency(t) for t in tickers}

    needed_fx: Dict[str, Tuple[str, str]] = {}
    for t, ccy in ticker_ccy.items():
        if ccy == "USD":
            continue
        if ccy not in _FX_PAIR:
            logger.warning(
                "No FX mapping for currency %s (ticker %s); leaving prices in local currency",
                ccy,
                t,
            )
            continue
        pair, mode = _FX_PAIR[ccy]
        needed_fx[pair] = (pair, mode)

    if not needed_fx:
        return df

    logger.info(
        "FX normalization to USD: currencies=%s fx_pairs=%s",
        sorted({ticker_ccy[t] for t in tickers if ticker_ccy[t] != "USD"}),
        sorted(needed_fx.keys()),
    )

    fx_series_by_pair = _download_fx_rates(
        loader,
        needed_fx.keys(),
        start_date,
        end_date,
        progress=progress,
    )

    for t in tickers:
        ccy = ticker_ccy[t]
        if ccy == "USD":
            continue
        if ccy not in _FX_PAIR:
            continue
        pair, mode = _FX_PAIR[ccy]
        raw_fx = fx_series_by_pair.get(pair)
        if raw_fx is None or raw_fx.empty:
            logger.warning("Missing FX data for %s (%s); skipping conversion for %s", pair, ccy, t)
            continue

        usd_per = _usd_per_local_series(raw_fx, mode)
        usd_per = usd_per.reindex(df.index).ffill().bfill()
        if usd_per.isna().all():
            logger.warning("FX alignment failed for %s on %s; skipping conversion for %s", pair, ccy, t)
            continue

        df[t] = pd.to_numeric(df[t], errors="coerce") * usd_per

    return df


def normalize_close_series_to_usd(
    price_series: pd.Series,
    listing_ticker: str,
    start_date: str,
    end_date: str,
    loader: DataLoader,
    *,
    progress: bool = False,
) -> pd.Series:

    if price_series is None or price_series.empty:
        return price_series

    col = str(listing_ticker).strip() or "price"
    df = pd.DataFrame({col: price_series})
    df.index = price_series.index
    out_df = normalize_adj_close_to_usd(df, start_date, end_date, loader, progress=progress)
    out = out_df[col].copy()
    out.name = price_series.name
    return out
