from .quant_service import QuantService
import logging
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from typing import Dict, List, Optional

try:
    from quant.pm.utils.tools.config import ANALYSIS_START_DATE, ANALYSIS_END_DATE, ANNUAL_FACTOR
    from quant.pm.utils.analysis.risk_metrics.components.helpers import (
        annualize_return, annualize_volatility, calculate_portfolio_returns,
    )
    _QUANT_HELPERS_AVAILABLE = True
except ImportError:
    ANALYSIS_START_DATE = (datetime.now() - timedelta(days=365 * 5)).strftime('%Y-%m-%d')
    ANALYSIS_END_DATE = datetime.now().strftime('%Y-%m-%d')
    _QUANT_HELPERS_AVAILABLE = False

logger = logging.getLogger(__name__)

_DRAWDOWN_KEYS = (
    'max_drawdown', 'max_drawdown_pct', 'max_drawdown_date',
    'max_underwater_duration', 'calmar_ratio', 'sterling_ratio', 'annual_return',
)


def _safe_analyze(label: str, func, *args, **kwargs):
    """Run *func* and return its result; on failure return {'error': ...}."""
    try:
        return func(*args, **kwargs)
    except Exception as e:
        logger.exception("Error in %s", label)
        return {'error': str(e)}

class RiskService:
    def __init__(self):
        _cls = lambda mod, cls: QuantService.get_class(
            f'quant.pm.utils.analysis.risk_metrics.analyzers.{mod}', cls
        )
        self.ratio_analyzer = _cls('ratio_analyzer', 'RatioAnalyzer')()
        self.var_es_analyzer = _cls('var_es_analyzer', 'VarEsAnalyzer')()
        self.drawdown_analyzer = _cls('drawdown_analyzer', 'DrawdownAnalyzer')()
        self.benchmark_analyzer = _cls('benchmark_analyzer', 'BenchmarkAnalyzer')()
        self.distribution_analyzer = _cls('distribution_analyzer', 'DistributionAnalyzer')()
        self.correlation_analyzer = _cls('correlation_analyzer', 'CorrelationAnalyzer')()

        try:
            DataManager = QuantService.get_class('quant.pm.utils.data.data_process', 'DataManager')
            self.data_manager = DataManager()
        except (ImportError, AttributeError):
            self.data_manager = None

    def calculate_ratios(
        self,
        returns: pd.DataFrame,
        weights: np.ndarray,
        risk_free_rate: float,
        ddof: int = 0,
    ) -> Dict:
        return self.ratio_analyzer.calculate_all_ratios(returns, weights, risk_free_rate, ddof)

    def calculate_var_es(
        self,
        returns: pd.DataFrame,
        weights: np.ndarray,
        confidence_level: float = 0.95,
        method: str = 'historical',
    ) -> Dict:
        return self.var_es_analyzer.calculate_multi_level(
            returns=returns,
            weights=weights,
            confidence_levels=(confidence_level,),
            methods=[method],
        )[confidence_level][method]

    def calculate_drawdown(
        self,
        returns: pd.DataFrame,
        weights: np.ndarray,
        risk_free_rate: float = 0.0,
    ) -> Dict:
        return self.drawdown_analyzer.analyze(returns, weights, risk_free_rate)

    def analyze_benchmark(
        self,
        returns: pd.DataFrame,
        weights: np.ndarray,
        benchmark_returns: pd.Series,
        risk_free_rate: float,
        ddof: int = 1,
    ) -> Dict:
        return self.benchmark_analyzer.analyze(returns, weights, benchmark_returns, risk_free_rate, ddof)

    def analyze_distribution(self, returns: pd.DataFrame, weights: np.ndarray) -> Dict:
        return self.distribution_analyzer.analyze(returns, weights)

    def analyze_correlation(self, returns: pd.DataFrame) -> Dict:
        return self.correlation_analyzer.analyze(returns)

    def analyze_complete(
        self,
        tickers: List[str],
        benchmark_name: str = 'SP500',
        start_date: str = '',
        end_date: str = '',
        weights: Optional[List[float]] = None,
        risk_free_rate: float = 0.03,
        confidence_level: float = 0.95,
        var_methods: Optional[List[str]] = None,
    ) -> Dict:
        if self.data_manager is None:
            raise ValueError("DataManager not available. Cannot run complete analysis.")

        if var_methods is None:
            var_methods = ['historical', 'parametric', 'monte_carlo']

        start_date, end_date = self._resolve_dates(start_date, end_date)

        assets_prices, benchmark_prices = self.data_manager.download_portfolio_with_benchmark(
            tickers=tickers,
            benchmark_name=benchmark_name,
            start_date=start_date,
            end_date=end_date,
        )

        returns = assets_prices.pct_change().dropna()
        benchmark_returns = benchmark_prices.pct_change().dropna()

        common_dates = returns.index.intersection(benchmark_returns.index)
        returns_aligned = returns.loc[common_dates]
        benchmark_aligned = benchmark_returns.loc[common_dates]

        weights_array = np.array(weights) if weights else np.ones(len(tickers)) / len(tickers)

        results: Dict = {
            'tickers': tickers,
            'benchmark_name': benchmark_name,
            'start_date': str(returns_aligned.index[0].date()),
            'end_date': str(returns_aligned.index[-1].date()),
            'period_days': len(returns_aligned),
            'weights': weights_array.tolist(),
            'risk_free_rate': risk_free_rate,
        }

        results['normality_warnings'] = _safe_analyze(
            'normality', self.var_es_analyzer.var_calc.validate_normality,
            returns=returns_aligned, weights=weights_array, verbose=False,
        )

        raw_var_es = _safe_analyze(
            'var_es', self.var_es_analyzer.calculate_multi_level,
            returns=returns_aligned, weights=weights_array,
            confidence_levels=(confidence_level,), methods=var_methods,
        )
        results['var_es'] = (
            raw_var_es.get(confidence_level, {})
            if isinstance(raw_var_es, dict) and 'error' not in raw_var_es
            else raw_var_es
        )

        results['ratios'] = _safe_analyze(
            'ratios', self.ratio_analyzer.calculate_all_ratios,
            returns=returns_aligned, weights=weights_array, risk_free_rate=risk_free_rate,
        )

        results['drawdown'] = _safe_analyze(
            'drawdown', self._drawdown_per_ticker,
            tickers, returns_aligned, weights_array, risk_free_rate,
        )

        results['distribution'] = _safe_analyze(
            'distribution', self.distribution_analyzer.analyze,
            returns=returns_aligned, weights=weights_array,
        )

        results['benchmark_analysis'] = _safe_analyze(
            'benchmark', self.benchmark_analyzer.analyze,
            returns=returns_aligned, weights=weights_array,
            benchmark_returns=benchmark_aligned, risk_free_rate=risk_free_rate,
        )

        results['correlation'] = _safe_analyze(
            'correlation', self.correlation_analyzer.analyze,
            returns=returns_aligned,
        )

        self._add_performance_summary(
            results, tickers, returns_aligned, benchmark_aligned, weights_array,
        )

        return results

    @staticmethod
    def _resolve_dates(start_date: str, end_date: str):
        return start_date or ANALYSIS_START_DATE, end_date or ANALYSIS_END_DATE

    def _drawdown_per_ticker(
        self, tickers: List[str], returns: pd.DataFrame,
        weights_array: np.ndarray, risk_free_rate: float,
    ) -> Dict:
        per_ticker = {}
        single_weight = np.array([1.0])
        for ticker in tickers:
            if ticker not in returns.columns:
                continue
            dd = self.drawdown_analyzer.analyze(
                returns=returns[[ticker]], weights=single_weight,
                risk_free_rate=risk_free_rate,
            )
            per_ticker[ticker] = {k: dd[k] for k in _DRAWDOWN_KEYS}
        return {'per_ticker': per_ticker}

    @staticmethod
    def _add_performance_summary(
        results: Dict, tickers: List[str],
        returns_aligned: pd.DataFrame, benchmark_aligned,
        weights_array: np.ndarray,
    ):
        if not _QUANT_HELPERS_AVAILABLE:
            results['ticker_performance'] = {'error': 'quant helpers not available'}
            results['portfolio_vs_benchmark'] = {'error': 'quant helpers not available'}
            return

        try:
            ticker_performance = {}
            for i, ticker in enumerate(tickers):
                if ticker in returns_aligned.columns:
                    t_ret = returns_aligned[ticker]
                    ticker_performance[ticker] = {
                        'annual_return': float(annualize_return(t_ret, ANNUAL_FACTOR)),
                        'annual_volatility': float(annualize_volatility(t_ret, ANNUAL_FACTOR)),
                        'weight': float(weights_array[i]),
                    }
            results['ticker_performance'] = ticker_performance

            port_ret = calculate_portfolio_returns(returns_aligned, weights_array)
            bench_ret = (
                benchmark_aligned.squeeze()
                if isinstance(benchmark_aligned, pd.DataFrame)
                else benchmark_aligned
            )

            p_ann_ret = annualize_return(port_ret, ANNUAL_FACTOR)
            p_ann_vol = annualize_volatility(port_ret, ANNUAL_FACTOR)
            b_ann_ret = annualize_return(bench_ret, ANNUAL_FACTOR)
            b_ann_vol = annualize_volatility(bench_ret, ANNUAL_FACTOR)

            results['portfolio_vs_benchmark'] = {
                'portfolio': {
                    'annual_return': float(p_ann_ret),
                    'annual_volatility': float(p_ann_vol),
                },
                'benchmark': {
                    'annual_return': float(b_ann_ret),
                    'annual_volatility': float(b_ann_vol),
                },
                'excess_return': float(p_ann_ret - b_ann_ret),
                'excess_volatility': float(p_ann_vol - b_ann_vol),
            }
        except Exception as e:
            logger.exception("Error in performance summary")
            results['ticker_performance'] = results.get('ticker_performance', {'error': str(e)})
            results['portfolio_vs_benchmark'] = {'error': str(e)}
