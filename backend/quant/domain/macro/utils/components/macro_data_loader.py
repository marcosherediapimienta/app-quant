from typing import Dict, List
import pandas as pd
import yfinance as yf
import warnings
warnings.filterwarnings('ignore', category=pd.errors.Pandas4Warning, module='yfinance')

class MacroDataLoader:
    def __init__(self, factors: Dict[str, str] = None):
        self.factors = factors if factors is not None else {}
    
    def download(
        self,
        tickers: List[str],
        start_date: str,
        end_date: str,
        progress: bool = False
    ) -> pd.DataFrame:

        use_threads = len(tickers) > 1
        try:
            data = yf.download(
                tickers,
                start=start_date,
                end=end_date,
                progress=progress,
                auto_adjust=True,
                threads=use_threads,
            )
        except Exception as e:
            if use_threads:
                try:
                    data = yf.download(
                        tickers,
                        start=start_date,
                        end=end_date,
                        progress=False,
                        auto_adjust=True,
                        threads=False,
                    )
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
        progress: bool = False
    ) -> pd.Series:

        data = self.download([ticker], start_date, end_date, progress)
        
        if isinstance(data, pd.DataFrame) and 'Close' in data.columns:
            return data['Close'].dropna()
        return data.squeeze()