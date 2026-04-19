from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional, Union

from quant.domain.pm.utils.analysis.valuation.analyzers.company_analyzer import CompanyAnalyzer
from quant.domain.pm.utils.analysis.valuation.analyzers.comparison_analyzer import ComparisonAnalyzer
from quant.domain.pm.utils.analysis.valuation.analyzers.sector_analyzer import SectorAnalyzer
from quant.domain.pm.utils.analysis.valuation.analyzers.buy_sell_signals_analyzer import BuySellSignalsAnalyzer


_TICKER_TYPOS = {"APPL": "AAPL"}


def _normalize_ticker_list(tickers: Union[str, List[str], tuple]) -> List[str]:
    if isinstance(tickers, str):
        parts = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    elif isinstance(tickers, (list, tuple)):
        parts = [str(t).strip().upper() for t in tickers if str(t).strip()]
    else:
        return []
    return [_TICKER_TYPOS.get(t, t) for t in parts]


def _signals_worker(ticker: str):
    analyzer = BuySellSignalsAnalyzer()
    return ticker, analyzer.analyze_stock(ticker)


class ValuationUseCase:
    def __init__(self):
        self.company_analyzer = CompanyAnalyzer()
        self.comparison_analyzer = ComparisonAnalyzer()
        self.sector_analyzer = SectorAnalyzer()
        self.signals_analyzer = BuySellSignalsAnalyzer()

    def analyze_company(self, ticker: str) -> Dict:
        return self.company_analyzer.analyze(ticker)

    def compare_companies(self, tickers: Union[str, List[str]]) -> Dict:
        return self.comparison_analyzer.compare(_normalize_ticker_list(tickers))

    def analyze_sector(
        self,
        ticker: str,
        peers: Optional[List[str]] = None,
        fetch_peers: bool = True,
    ) -> Dict:
        return self.sector_analyzer.analyze_vs_peers(ticker, peers, fetch_peers)

    def generate_signals(self, tickers: Union[str, List[str]]) -> Dict:
        normalized = _normalize_ticker_list(tickers)
        if not normalized:
            return {}
        max_workers = min(3, len(normalized))
        results: Dict = {}

        if len(normalized) == 1:
            ticker = normalized[0]
            try:
                results[ticker] = self.signals_analyzer.analyze_stock(ticker)
            except Exception as e:
                results[ticker] = {'error': str(e)}
            return results

        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            future_map = {pool.submit(_signals_worker, t): t for t in normalized}
            for fut in as_completed(future_map):
                ticker = future_map[fut]
                try:
                    t_key, payload = fut.result()
                    results[t_key] = payload
                except Exception as e:
                    results[ticker] = {'error': str(e)}
        return results
