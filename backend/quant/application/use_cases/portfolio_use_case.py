from typing import Dict, List, Optional

from quant.domain.pm.utils.analysis.portfolio.analyzers.portfolio_analyzer import (
    PortfolioAnalyzer,
    PortfolioConfig,
)
from quant.domain.pm.utils.tools.config import BENCHMARK_LABELS, INDEX_CONFIG


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
                {'value': idx, 'label': BENCHMARK_LABELS.get(idx, idx)}
                for idx in supported
            ],
        }
