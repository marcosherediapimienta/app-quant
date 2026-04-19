from typing import List
import pandas as pd
import yfinance as yf
import warnings
warnings.filterwarnings('ignore', category=pd.errors.Pandas4Warning, module='yfinance')

from ...tools.config import DOWNLOAD_DEFAULTS 

class DataLoader: 
    def download(
        self,
        tickers: List[str],
        start_date: str,
        end_date: str,
        auto_adjust: bool = None,
        group_by: str = None,
        threads: bool = None,
        progress: bool = None
    ) -> pd.DataFrame:

        auto_adjust = auto_adjust if auto_adjust is not None else DOWNLOAD_DEFAULTS['auto_adjust']
        group_by = group_by if group_by is not None else DOWNLOAD_DEFAULTS['group_by']
        threads = threads if threads is not None else DOWNLOAD_DEFAULTS['threads']
        progress = progress if progress is not None else DOWNLOAD_DEFAULTS['progress']

        # yfinance threaded multi-download can raise TypeError("'NoneType' object is not subscriptable")
        # for a single ticker (see yfinance issues around threads=True + one symbol).
        if len(tickers) == 1:
            threads = False

        print(f"Period: {start_date} → {end_date}")

        def _download(use_threads: bool, show_progress: bool) -> pd.DataFrame:
            return yf.download(
                tickers=tickers,
                start=start_date,
                end=end_date,
                auto_adjust=auto_adjust,
                group_by=group_by,
                threads=use_threads,
                progress=show_progress,
            )

        try:
            data = _download(threads, progress)
        except Exception as e:
            if threads:
                try:
                    data = _download(False, False)
                except Exception as e2:
                    raise RuntimeError(f"Download error: {e2}") from e2
            else:
                raise RuntimeError(f"Download error: {e}") from e

        if data.empty:
            raise ValueError("No data downloaded")
        return data
    
    def download_single(
        self,
        ticker: str,
        start_date: str,
        end_date: str,
        **kwargs
    ) -> pd.DataFrame:
        return self.download([ticker], start_date, end_date, **kwargs)