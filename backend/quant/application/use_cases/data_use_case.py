import io
import logging
import urllib.request
import warnings
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Union

import pandas as pd
import yfinance as yf

from quant.domain.pm.utils.data.components.data_loader import DataLoader

warnings.filterwarnings('ignore', category=pd.errors.Pandas4Warning, module='yfinance')

logger = logging.getLogger('quant.application.data')

FRED_TICKER_PREFIX = 'FRED:'
DEFAULT_LOOKBACK_DAYS = 365
FRED_TIMEOUT = 15
PRICE_COLUMNS = ('Close', 'Adj Close')


def _normalize_ticker(ticker: str) -> str:
    return ticker.replace('^', '').replace('=', '').replace('-', '').replace('.', '').upper()


def _resolve_dates(
    start_date: Optional[str],
    end_date: Optional[str],
    lookback_days: int = DEFAULT_LOOKBACK_DAYS,
) -> Tuple[str, str]:
    if end_date is None:
        end_dt = datetime.now()
    else:
        end_dt = pd.to_datetime(end_date)

    if start_date is None:
        start_dt = end_dt - timedelta(days=lookback_days)
    else:
        start_dt = pd.to_datetime(start_date)

    return start_dt.strftime('%Y-%m-%d'), end_dt.strftime('%Y-%m-%d')


class DataUseCase:
    def __init__(self):
        try:
            self.data_loader = DataLoader()
            self.use_quant_loader = True
        except Exception:
            self.use_quant_loader = False

    def _download_yahoo(
        self,
        tickers: List[str],
        start_date_str: str,
        end_date_str: str,
    ) -> pd.DataFrame:
        if self.use_quant_loader:
            return self.data_loader.download(tickers, start_date_str, end_date_str, progress=False)
        return yf.download(tickers, start=start_date_str, end=end_date_str, progress=False)

    @staticmethod
    def _download_fred_series(
        series_id: str,
        start_date_str: str,
        end_date_str: str,
    ) -> pd.Series:
        url = (
            f"https://fred.stlouisfed.org/graph/fredgraph.csv"
            f"?id={series_id}&cosd={start_date_str}&coed={end_date_str}"
        )
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            response = urllib.request.urlopen(req, timeout=FRED_TIMEOUT)
            csv_data = response.read().decode('utf-8')
            df = pd.read_csv(
                io.StringIO(csv_data),
                parse_dates=['DATE'],
                index_col='DATE',
            )
            series = df[series_id].replace('.', float('nan')).astype(float).dropna()
            series.index.name = None
            logger.info("FRED %s: %d observations downloaded", series_id, len(series))
            return series
        except Exception as e:
            logger.error("Error downloading FRED series %s: %s", series_id, e)
            return pd.Series(dtype=float)

    def download_tickers(
        self,
        tickers: List[str],
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        data_type: str = 'returns',
    ) -> Dict:
        start_date_str, end_date_str = _resolve_dates(start_date, end_date)

        try:
            data = self._download_yahoo(tickers, start_date_str, end_date_str)
        except Exception as e:
            logger.exception("Error downloading tickers %s", tickers)
            raise ValueError(f"Error downloading data for {tickers}: {e}")

        if data.empty:
            raise ValueError(
                f"Could not download data for tickers: {tickers}. "
                f"Verify that the tickers are valid and data is available "
                f"for the period {start_date_str} to {end_date_str}"
            )

        processed_data = self._process_data(data, tickers, data_type)

        return {
            "data": processed_data,
            "tickers": list(next(iter(processed_data.values())).keys()) if processed_data else tickers,
            "start_date": start_date_str,
            "end_date": end_date_str,
            "type": data_type,
            "observations": len(processed_data),
        }

    def download_macro_factors(
        self,
        factors: Optional[List[str]] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict:
        if factors is None:
            factors = ['^VIX', '^TNX']

        start_date_str, end_date_str = _resolve_dates(start_date, end_date)

        fred_factors = []
        yahoo_factors = []
        for f in factors:
            f_str = str(f)
            if f_str.startswith(FRED_TICKER_PREFIX):
                fred_factors.append((f_str, f_str[len(FRED_TICKER_PREFIX):]))
            else:
                yahoo_factors.append(f_str)

        logger.debug("download_macro_factors — Yahoo: %s, FRED: %s", yahoo_factors, [s for _, s in fred_factors])

        processed_data: Dict = {}
        available_factors: List[str] = []

        if yahoo_factors:
            available_factors, processed_data = self._download_yahoo_factors(
                yahoo_factors, start_date_str, end_date_str,
            )

        for ticker_full, series_id in fred_factors:
            series = self._download_fred_series(series_id, start_date_str, end_date_str)
            if len(series) > 0:
                available_factors.append(ticker_full)
                for date_idx in series.index:
                    date_str = date_idx.strftime('%Y-%m-%d') if hasattr(date_idx, 'strftime') else str(date_idx)
                    if date_str not in processed_data:
                        processed_data[date_str] = {}
                    processed_data[date_str][ticker_full] = float(series[date_idx])
                logger.info("FRED %s merged: %d observations", ticker_full, len(series))
            else:
                logger.warning("FRED %s returned no data", ticker_full)

        if not available_factors:
            raise ValueError(f"None of the requested factors could be downloaded. Requested: {factors}")

        return {
            "data": processed_data,
            "factors": available_factors,
            "requested_factors": factors,
            "start_date": start_date_str,
            "end_date": end_date_str,
            "observations": len(processed_data),
        }

    def _download_yahoo_factors(
        self,
        yahoo_factors: List[str],
        start_date_str: str,
        end_date_str: str,
    ) -> Tuple[List[str], Dict]:
        try:
            data = self._download_yahoo(yahoo_factors, start_date_str, end_date_str)
        except Exception as e:
            logger.error("Error downloading Yahoo macro factors: %s", e)
            return [], {}

        if data.empty:
            return [], {}

        downloaded_factors = self._extract_factor_names(data, yahoo_factors)
        available = self._match_factors(yahoo_factors, downloaded_factors)

        logger.debug("download_macro_factors — available Yahoo factors: %s", available)

        try:
            processed_data = self._process_data(data, available, 'prices')
        except Exception:
            logger.exception("Error processing Yahoo macro data")
            processed_data = {}

        return available, processed_data

    @staticmethod
    def _extract_factor_names(data: pd.DataFrame, fallback: List[str]) -> List[str]:
        try:
            if isinstance(data.columns, pd.MultiIndex):
                level_names = data.columns.names or []
                ticker_level = 0
                for i, name in enumerate(level_names):
                    if name and 'ticker' in str(name).lower():
                        ticker_level = i
                        break
                return [str(f) for f in data.columns.get_level_values(ticker_level).unique()]
            return [str(col) for col in data.columns]
        except Exception:
            logger.exception("Error processing Yahoo factor columns")
            return [str(f) for f in fallback]

    @staticmethod
    def _match_factors(requested: List[str], downloaded: List[str]) -> List[str]:
        available = []
        downloaded_normalized = {_normalize_ticker(d): d for d in downloaded}

        for factor in requested:
            factor_str = str(factor)
            if factor_str in downloaded:
                available.append(factor_str)
            elif _normalize_ticker(factor_str) in downloaded_normalized:
                available.append(factor_str)

        return available

    def _process_data(
        self,
        data: Union[pd.DataFrame, pd.Series],
        tickers: List[str],
        data_type: str,
    ) -> Dict:
        close_data = self._extract_close_prices(data)

        if isinstance(close_data, pd.Series):
            close_data = close_data.to_frame(name=tickers[0] if len(tickers) == 1 else 'Close')

        close_data = self._map_ticker_columns(close_data, tickers)

        if data_type == 'returns':
            result_data = close_data.pct_change().dropna()
        else:
            result_data = close_data

        return self._dataframe_to_dict(result_data)

    @staticmethod
    def _extract_close_prices(data: Union[pd.DataFrame, pd.Series]) -> Union[pd.DataFrame, pd.Series]:
        if not isinstance(data, pd.DataFrame):
            return data

        if not isinstance(data.columns, pd.MultiIndex):
            for col in PRICE_COLUMNS:
                if col in data.columns:
                    return data[col]
            return data.iloc[:, 0]

        level_names = data.columns.names or []
        price_level = None

        for i, name in enumerate(level_names):
            if name and 'price' in str(name).lower():
                price_level = i

        if price_level is None:
            for i in range(len(data.columns.levels)):
                if any(col in data.columns.levels[i] for col in PRICE_COLUMNS):
                    price_level = i
                    break

        if price_level is not None:
            for col in PRICE_COLUMNS:
                try:
                    if col in data.columns.levels[price_level]:
                        return data.xs(col, axis=1, level=price_level)
                except Exception:
                    continue
            try:
                first_price = data.columns.levels[price_level][0]
                return data.xs(first_price, axis=1, level=price_level)
            except Exception:
                logger.exception("Error extracting data from MultiIndex")

        for col in PRICE_COLUMNS:
            if col in data.columns.get_level_values(0):
                return data[col]

        return data.xs(data.columns.levels[0][0], axis=1, level=0)

    @staticmethod
    def _map_ticker_columns(close_data: pd.DataFrame, tickers: List[str]) -> pd.DataFrame:
        column_names = [str(col) for col in close_data.columns]
        close_data.columns = column_names

        ticker_mapping = {}
        available_tickers = []

        for ticker in tickers:
            ticker_str = str(ticker)
            if ticker_str in column_names:
                ticker_mapping[ticker_str] = ticker_str
                available_tickers.append(ticker_str)
            else:
                norm = _normalize_ticker(ticker_str)
                for col in column_names:
                    if _normalize_ticker(col) == norm:
                        ticker_mapping[ticker_str] = col
                        available_tickers.append(ticker_str)
                        break
                else:
                    logger.warning("_process_data — ticker %s not found in downloaded data", ticker_str)

        if ticker_mapping and available_tickers:
            mapped_columns = [ticker_mapping[t] for t in available_tickers]
            close_data = close_data[mapped_columns]
            close_data.columns = available_tickers
        elif len(column_names) == len(tickers):
            close_data.columns = [str(t) for t in tickers]
        elif len(column_names) == 1 and len(tickers) == 1:
            close_data.columns = [str(tickers[0])]
        else:
            num_cols = len(column_names)
            num_tickers = len(tickers)
            if num_cols <= num_tickers:
                close_data.columns = [str(t) for t in tickers[:num_cols]]
            else:
                close_data = close_data.iloc[:, :num_tickers]
                close_data.columns = [str(t) for t in tickers]

        return close_data

    @staticmethod
    def _dataframe_to_dict(df: pd.DataFrame) -> Dict:
        result: Dict = {}
        for date in df.index:
            date_str = date.strftime('%Y-%m-%d') if hasattr(date, 'strftime') else str(date)
            result[date_str] = {
                str(col): None if pd.isna(val) else float(val)
                for col, val in df.loc[date].items()
            }
        return result
