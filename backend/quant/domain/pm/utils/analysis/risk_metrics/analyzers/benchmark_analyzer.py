import numpy as np
import pandas as pd
from typing import Dict
from ..components.tracking_error import TrackingErrorCalculator
from ..components.beta import BetaCalculator
from ..components.alpha import AlphaCalculator
from ....tools.config import ANNUAL_FACTOR, ROLLING_WINDOW

class BenchmarkAnalyzer:
    def __init__(self, annual_factor: float = None):
        self.annual_factor = annual_factor if annual_factor is not None else ANNUAL_FACTOR
        self.te_calc = TrackingErrorCalculator(self.annual_factor)
        self.beta_calc = BetaCalculator()
        self.alpha_calc = AlphaCalculator(self.annual_factor)
    
    def analyze(
        self,
        returns: pd.DataFrame,
        weights: np.ndarray,
        benchmark_returns: pd.Series,
        risk_free_rate: float,
        ddof: int = 1
    ) -> Dict[str, float]:

        te_results = self.te_calc.calculate(returns, weights, benchmark_returns, ddof)
        beta_results = self.beta_calc.calculate(returns, weights, benchmark_returns, ddof)
        alpha_results = self.alpha_calc.calculate(
            returns, weights, benchmark_returns, 
            risk_free_rate, beta=beta_results['beta'], ddof=ddof
        )

        ir = te_results['information_ratio']
        te_ann = te_results['te_annual']
        excess_arith = te_results['excess_return_annual']
        beta = beta_results['beta']

        if np.isnan(ir) if ir is not None else True:
            ir_interp = "Insufficient data to compute the Information Ratio."
        else:
            ir_interp = (
                f"IR = {ir:.2f} (arithmetic active return {excess_arith*100:.2f}% ÷ "
                f"tracking error {te_ann*100:.2f}%). "
                "Note: the excess return shown in the Portfolio vs Benchmark table is "
                "geometric (CAGR difference), which will differ from the arithmetic "
                "figure used here — both are valid but measure different things."
            )

        _caution = (
            " Caution: this estimate is derived from daily returns and may be "
            "distorted by asynchronous NAV, index and FX valuation times. "
            "Recalculate using aligned weekly returns before drawing structural conclusions."
        )
        if beta > 1.1:
            beta_interp = (
                f"Estimated beta: {beta:.2f} — the portfolio historically moved ~{beta:.2f}× "
                "the benchmark on a daily basis (aggressive sensitivity)." + _caution
            )
        elif beta < 0.9:
            beta_interp = (
                f"Estimated beta: {beta:.2f} — historically ~{beta*100:.0f}% of benchmark "
                "daily sensitivity." + _caution
            )
        else:
            beta_interp = (
                f"Estimated beta: {beta:.2f} — close to but not identical to the benchmark "
                f"(~{beta*100:.0f}% daily sensitivity)." + _caution
            )

        return {
            'tracking_error_daily': te_results['te_daily'],
            'tracking_error_annual': te_ann,
            'excess_return_annual': excess_arith,
            'information_ratio': ir,
            'information_interpretation': ir_interp,
            'beta': beta,
            'beta_interpretation': beta_interp,
            'r_squared': beta_results['r_squared'],
            'correlation': beta_results['correlation'],
            'alpha_annual': alpha_results['alpha_annual'],
            'portfolio_return_annual': alpha_results['portfolio_return_annual'],
            'benchmark_return_annual': alpha_results['benchmark_return_annual'],
            'expected_return': alpha_results['expected_return']
        }
    
    def analyze_rolling(
        self,
        returns: pd.DataFrame,
        weights: np.ndarray,
        benchmark_returns: pd.Series,
        window: int = None,
        ddof: int = 1
    ) -> pd.DataFrame:

        if window is None:
            window = ROLLING_WINDOW
        
        te_rolling = self.te_calc.calculate_rolling(
            returns, weights, benchmark_returns, window, ddof
        )

        beta_rolling = self.beta_calc.calculate_rolling(
            returns, weights, benchmark_returns, window, ddof
        )
        
        return pd.DataFrame({
            'tracking_error': te_rolling,
            'beta': beta_rolling
        })