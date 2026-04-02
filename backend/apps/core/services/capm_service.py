from .quant_service import QuantService
import numpy as np
import pandas as pd
from typing import Dict, List, Optional

HISTOGRAM_BINS = 30
MIN_TANGENT_WEIGHT = 0.01


class CAPMService:
    def __init__(self):
        self.CAPMAnalyzer = QuantService.get_class(
            'quant.pm.utils.analysis.capm.analyzers.capm_analyzer',
            'CAPMAnalyzer'
        )
        self.MultiAssetCAPMAnalyzer = QuantService.get_class(
            'quant.pm.utils.analysis.capm.analyzers.multi_asset_capm_analyzer',
            'MultiAssetCAPMAnalyzer'
        )
        self.PortfolioOptimizationAnalyzer = QuantService.get_class(
            'quant.pm.utils.analysis.capm.analyzers.portfolio_optimization_analyzer',
            'PortfolioOptimizationAnalyzer'
        )
        self.capm_analyzer = self.CAPMAnalyzer()
        self.multi_asset_analyzer = self.MultiAssetCAPMAnalyzer()
        self.optimization_analyzer = self.PortfolioOptimizationAnalyzer()

    def _annualize_market_return(
        self,
        market_returns: np.ndarray,
        annual_factor: int,
    ) -> float:

        if len(market_returns) == 0:
            return np.nan
        cumulative = (1 + market_returns).prod()
        if cumulative > 0:
            return cumulative ** (annual_factor / len(market_returns)) - 1
        return np.mean(market_returns) * annual_factor

    @staticmethod
    def _build_scatter_data(
        market_excess: np.ndarray,
        asset_excess: np.ndarray,
        max_points: int = 1000,
    ) -> List[Dict]:

        if len(market_excess) > max_points:
            indices = np.linspace(0, len(market_excess) - 1, max_points, dtype=int)
            market_excess = market_excess[indices]
            asset_excess = asset_excess[indices]

        return [
            {'market_excess': float(market_excess[i]), 'asset_excess': float(asset_excess[i])}
            for i in range(len(market_excess))
        ]

    @staticmethod
    def _build_regression_line(
        market_excess: np.ndarray,
        alpha_daily: float,
        beta: float,
        n_points: int = 100,
    ) -> List[Dict]:

        if len(market_excess) == 0:
            return []
        x_line = np.linspace(market_excess.min(), market_excess.max(), n_points)
        y_line = alpha_daily + beta * x_line
        return [{'x': float(x_line[i]), 'y': float(y_line[i])} for i in range(n_points)]

    def analyze_capm(
        self,
        asset_returns: np.ndarray,
        market_returns: np.ndarray,
        risk_free_rate: float,
        market_ticker: Optional[str] = None
    ) -> Dict:

        results = self.capm_analyzer.analyze(asset_returns, market_returns, risk_free_rate)
        annual_factor = self.capm_analyzer.annual_factor

        market_return_annual = self._annualize_market_return(market_returns, annual_factor)

        expected_return = self.capm_analyzer.expected_return(
            results.get('beta', 0),
            risk_free_rate,
            market_return_annual
        )
        results['expected_return'] = expected_return
        results['market_return_annual'] = market_return_annual
        results['market_ticker'] = market_ticker

        rf_daily = risk_free_rate / annual_factor
        market_excess = market_returns - rf_daily
        asset_excess = asset_returns - rf_daily

        scatter_data = self._build_scatter_data(market_excess, asset_excess)
        regression_line = self._build_regression_line(
            market_excess, results['alpha_daily'], results['beta'],
        )

        predicted = results['alpha_daily'] + results['beta'] * (asset_returns - rf_daily)
        residuals = (asset_returns - rf_daily) - predicted
        hist, bin_edges = np.histogram(residuals, bins=HISTOGRAM_BINS)
        histogram_data = [
            {'bin': float((bin_edges[i] + bin_edges[i + 1]) / 2), 'count': int(hist[i])}
            for i in range(len(hist))
        ]

        results['visualization_data'] = {
            'scatter': scatter_data,
            'regression_line': regression_line,
            'histogram': histogram_data,
        }

        return results

    def analyze_multi_asset(
        self,
        returns: pd.DataFrame,
        market_returns: pd.Series,
        risk_free_rate: float,
        market_ticker: Optional[str] = None
    ) -> Dict:

        result_df = self.multi_asset_analyzer.analyze_multiple(
            returns, market_returns, risk_free_rate
        )

        annual_factor = self.capm_analyzer.annual_factor
        rf_daily = risk_free_rate / annual_factor

        market_return_annual = self._annualize_market_return(
            market_returns.values, annual_factor,
        )

        result_dict = result_df.to_dict('index')

        for asset in result_dict.keys():
            beta = result_dict[asset].get('beta', 0)
            expected_return = self.capm_analyzer.expected_return(
                beta, risk_free_rate, market_return_annual,
            )
            result_dict[asset]['expected_return'] = expected_return

        portfolio_beta = result_df['beta'].mean()
        portfolio_expected_return = self.capm_analyzer.expected_return(
            portfolio_beta, risk_free_rate, market_return_annual,
        )

        market_excess = market_returns.values - rf_daily

        for asset in result_dict.keys():
            asset_excess = returns[asset].values - rf_daily

            scatter_data = self._build_scatter_data(
                market_excess, asset_excess, max_points=500,
            )

            alpha_daily = result_dict[asset].get('alpha_daily', 0)
            if alpha_daily == 0:
                alpha_annual = result_dict[asset].get('alpha_annual', 0)
                if alpha_annual != 0:
                    alpha_daily = (1 + alpha_annual) ** (1 / annual_factor) - 1

            beta = result_dict[asset].get('beta', 0)
            regression_line = self._build_regression_line(
                market_excess, alpha_daily, beta,
            )

            result_dict[asset]['visualization_data'] = {
                'scatter': scatter_data,
                'regression_line': regression_line,
            }

        result_dict['_portfolio'] = {
            'expected_return': portfolio_expected_return,
            'beta': portfolio_beta,
            'market_return_annual': market_return_annual,
            'market_ticker': market_ticker,
        }

        return result_dict

    def optimize_portfolio(
        self,
        returns: pd.DataFrame,
        risk_free_rate: float,
        n_points: int = 50,
        allow_short: bool = False,
    ) -> Dict:
    
        result = self.optimization_analyzer.analyze_efficient_frontier(
            returns, risk_free_rate, n_points, allow_short
        )

        frontier = result['frontier']
        cml = result['cml']
        tangent = result['tangent_portfolio']

        frontier_data = [
            {
                'volatility': float(frontier.volatilities[i] * 100),
                'return': float(frontier.returns[i] * 100),
            }
            for i in range(len(frontier.returns))
        ]

        cml_data = []
        if cml and len(cml.cml_returns) > 0:
            cml_data = [
                {
                    'volatility': float(cml.cml_volatilities[i] * 100),
                    'return': float(cml.cml_returns[i] * 100),
                }
                for i in range(len(cml.cml_returns))
            ]

        tangent_point = None
        tangent_weights = {}
        if tangent and tangent['weights'] is not None:
            tangent_point = {
                'volatility': float(tangent['volatility'] * 100),
                'return': float(tangent['return'] * 100),
                'sharpe': float(tangent['sharpe_ratio']),
            }

            for asset, weight in zip(tangent['assets'], tangent['weights']):
                if abs(weight) > MIN_TANGENT_WEIGHT:
                    tangent_weights[asset] = float(weight * 100)

        risk_free_point = {
            'volatility': 0.0,
            'return': float(risk_free_rate * 100),
        }

        return {
            'frontier': frontier_data,
            'cml': cml_data,
            'tangent_point': tangent_point,
            'tangent_weights': tangent_weights,
            'risk_free_point': risk_free_point,
            'risk_free_rate': float(risk_free_rate),
            'n_assets': len(returns.columns) if hasattr(returns, 'columns') else 0,
        }

    def expected_return(
        self,
        beta: float,
        risk_free_rate: float,
        market_return: float
    ) -> float:
        return self.capm_analyzer.expected_return(beta, risk_free_rate, market_return)
