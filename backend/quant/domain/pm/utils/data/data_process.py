from typing import List
import pandas as pd
from .components.data_loader import DataLoader
from .components.benchmark_loader import BenchmarkLoader
from .components.helpers import extract_adj_close_prices
from .components.fx_usd_normalize import normalize_adj_close_to_usd, normalize_close_series_to_usd

class DataManager:
    def __init__(self):
        self.data_loader = DataLoader()
        self.benchmark_loader = BenchmarkLoader(self.data_loader)
    
    def download_assets(
        self,
        tickers: List[str],
        start_date: str,
        end_date: str,
        **kwargs
    ) -> pd.DataFrame:

        raw_data = self.data_loader.download(tickers, start_date, end_date, **kwargs)
        adj_close_df = extract_adj_close_prices(raw_data, tickers)
        adj_close_df = normalize_adj_close_to_usd(
            adj_close_df,
            start_date,
            end_date,
            self.data_loader,
            progress=kwargs.get("progress", False),
        )
        return adj_close_df
    
    def download_benchmark(
        self,
        benchmark_name: str,
        start_date: str,
        end_date: str,
        **kwargs
    ) -> pd.Series:
        series = self.benchmark_loader.download(benchmark_name, start_date, end_date, **kwargs)
        ticker = self.benchmark_loader.benchmarks.get(benchmark_name)
        if not ticker:
            return series
        return normalize_close_series_to_usd(
            series,
            ticker,
            start_date,
            end_date,
            self.data_loader,
            progress=kwargs.get("progress", False),
        )
    
    def download_portfolio_with_benchmark(
        self,
        tickers: List[str],
        benchmark_name: str,
        start_date: str,
        end_date: str,
        **kwargs
    ) -> tuple[pd.DataFrame, pd.Series]:
  
        print("Downloading full portfolio...")
        assets = self.download_assets(tickers, start_date, end_date, **kwargs)
        benchmark = self.download_benchmark(benchmark_name, start_date, end_date, **kwargs)
        common_dates = assets.index.intersection(benchmark.index)
        assets_aligned = assets.loc[common_dates]
        benchmark_aligned = benchmark.loc[common_dates]
        
        print(f"Portfolio downloaded: {len(tickers)} assets + benchmark")
        
        return assets_aligned, benchmark_aligned
    
    def list_available_benchmarks(self) -> List[str]:
        return self.benchmark_loader.list_available()
    
    def get_benchmark_info(self, benchmark_name: str) -> dict:
        ticker = self.benchmark_loader.benchmarks.get(benchmark_name)
        currency = self.benchmark_loader.get_benchmark_currency(benchmark_name)
        
        return {
            'name': benchmark_name,
            'ticker': ticker,
            'currency': currency
        }