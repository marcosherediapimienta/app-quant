from typing import Dict, List, Optional

from quant.domain.pm.utils.analysis.valuation.analyzers.company_analyzer import CompanyAnalyzer
from quant.domain.pm.utils.analysis.valuation.analyzers.comparison_analyzer import ComparisonAnalyzer
from quant.domain.pm.utils.analysis.valuation.analyzers.sector_analyzer import SectorAnalyzer
from quant.domain.pm.utils.analysis.valuation.analyzers.buy_sell_signals_analyzer import BuySellSignalsAnalyzer


class ValuationUseCase:
    def __init__(self):
        self.company_analyzer = CompanyAnalyzer()
        self.comparison_analyzer = ComparisonAnalyzer()
        self.sector_analyzer = SectorAnalyzer()
        self.signals_analyzer = BuySellSignalsAnalyzer()

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
