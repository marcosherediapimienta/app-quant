from .quant_service import QuantService
from typing import Dict, List, Optional

_INDEX_LABELS = {
    'SP500': 'S&P 500 (~500 companies)',
    'NASDAQ100': 'NASDAQ 100 (~100 companies)',
    'DOW30': 'Dow Jones 30 (~30 companies)',
    'IBEX35': 'IBEX 35 (~35 companies)',
    'EUROSTOXX50': 'EURO STOXX 50 (~50 companies)',
    'NIKKEI225': 'Nikkei 225 (~225 companies)',
    'MSCI_WORLD': 'MSCI World proxy (SP500 + EURO STOXX 50 + Nikkei 225)',
}

class PortfolioService:
    def __init__(self):
        self.PortfolioAnalyzer = QuantService.get_class(
            'quant.pm.utils.analysis.portfolio.analyzers.portfolio_analyzer',
            'PortfolioAnalyzer'
        )
        self.PortfolioConfig = QuantService.get_class(
            'quant.pm.utils.analysis.portfolio.analyzers.portfolio_analyzer',
            'PortfolioConfig'
        )

    def _build_analyzer(self, config: Optional[Dict] = None):
        portfolio_config = self.PortfolioConfig(**config) if config else None
        return self.PortfolioAnalyzer(config=portfolio_config)

    def analyze_portfolio(
        self,
        candidate_tickers: List[str],
        start_date: str = '',
        end_date: str = '',
        config: Optional[Dict] = None,
    ) -> Dict:
        return self._build_analyzer(config).analyze(candidate_tickers, start_date, end_date)

    def analyze_from_index(
        self,
        index_name: str,
        start_date: str = '',
        end_date: str = '',
        config: Optional[Dict] = None,
    ) -> Dict:
        return self._build_analyzer(config).analyze_from_index(index_name, start_date, end_date)

    def get_supported_indices(self) -> Dict:
        module = QuantService.get_module('quant.pm.utils.tools.config')
        index_config = getattr(module, 'INDEX_CONFIG', {}) or {}
        supported = index_config.get('supported_indices', []) or []

        return {
            'supported_indices': supported,
            'index_options': [
                {'value': idx, 'label': _INDEX_LABELS.get(idx, idx)}
                for idx in supported
            ],
        }
