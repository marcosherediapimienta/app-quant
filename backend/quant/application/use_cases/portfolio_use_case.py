from typing import Dict, List, Optional

from quant.domain.pm.utils.analysis.portfolio.analyzers.portfolio_analyzer import (
    PortfolioAnalyzer,
    PortfolioConfig,
)
from quant.domain.pm.utils.tools.config import INDEX_CONFIG

_INDEX_LABELS = {
    'SP500': 'S&P 500 · ~500 companies (USD)',
    'NASDAQ100': 'NASDAQ 100 · ~100 companies (USD)',
    'DOW30': 'Dow Jones 30 · ~30 companies (USD)',
    'IBEX35': 'IBEX 35 · ~35 companies (EUR)',
    'EUROSTOXX50': 'EURO STOXX 50 · ~50 companies (EUR)',
    'NIKKEI225': 'Nikkei 225 · ~225 companies (JPY)',
    'MSCI_WORLD': 'MSCI World · SP500 + EURO STOXX 50 + Nikkei 225 (USD)',
}


class PortfolioUseCase:
    def _build_analyzer(self, config: Optional[Dict] = None):
        portfolio_config = PortfolioConfig(**config) if config else None
        return PortfolioAnalyzer(config=portfolio_config)

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
        index_config = INDEX_CONFIG or {}
        supported = index_config.get('supported_indices', []) or []

        return {
            'supported_indices': supported,
            'index_options': [
                {'value': idx, 'label': _INDEX_LABELS.get(idx, idx)}
                for idx in supported
            ],
        }
