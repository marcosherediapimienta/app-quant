from .quant_service import QuantService
from typing import Dict, List, Optional

class ValuationService:
    def __init__(self):
        _cls = lambda mod, name: QuantService.get_class(
            f'quant.pm.utils.analysis.valuation.analyzers.{mod}', name
        )
        self.company_analyzer = _cls('company_analyzer', 'CompanyAnalyzer')()
        self.comparison_analyzer = _cls('comparison_analyzer', 'ComparisonAnalyzer')()
        self.sector_analyzer = _cls('sector_analyzer', 'SectorAnalyzer')()
        self.signals_analyzer = _cls('buy_sell_signals_analyzer', 'BuySellSignalsAnalyzer')()

    def analyze_company(self, ticker: str) -> Dict:
        return self.company_analyzer.analyze(ticker)

    def compare_companies(self, tickers: List[str]) -> Dict:
        return self.comparison_analyzer.compare(tickers)

    def analyze_sector(
        self,
        ticker: str,
        peers: Optional[List[str]] = None,
        fetch_peers: bool = True,
    ) -> Dict:
        return self.sector_analyzer.analyze_vs_peers(ticker, peers, fetch_peers)

    def generate_signals(self, tickers: List[str]) -> Dict:
        results = {}
        for ticker in tickers:
            try:
                results[ticker] = self.signals_analyzer.analyze_stock(ticker)
            except Exception as e:
                results[ticker] = {'error': str(e)}
        return results
