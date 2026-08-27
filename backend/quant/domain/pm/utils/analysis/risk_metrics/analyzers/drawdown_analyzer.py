import numpy as np
import pandas as pd
from typing import Dict
from ..components.drawdown import DrawdownCalculator
from ....tools.config import ANNUAL_FACTOR

class DrawdownAnalyzer:
    def __init__(self, annual_factor: float = None):
        self.annual_factor = annual_factor if annual_factor is not None else ANNUAL_FACTOR
        self.dd_calc = DrawdownCalculator(self.annual_factor)
    
    def analyze(
        self,
        returns: pd.DataFrame,
        weights: np.ndarray,
        risk_free_rate: float = None
    ) -> Dict:

        if risk_free_rate is None:
            risk_free_rate = 0.0
        
        results = self.dd_calc.calculate(returns, weights, risk_free_rate)
        
        return {
            'max_drawdown': results['max_drawdown'],
            'max_drawdown_pct': results['max_drawdown_pct'],
            'max_drawdown_date': results['max_drawdown_date'],
            'max_drawdown_peak_date': results['max_drawdown_peak_date'],
            'max_drawdown_recovery_date': results['max_drawdown_recovery_date'],
            'max_drawdown_recovered': results['max_drawdown_recovered'],
            'max_drawdown_duration': results['max_drawdown_duration'],
            'max_underwater_duration': results['max_underwater_duration'],
            'longest_underwater_start': results['longest_underwater_start'],
            'longest_underwater_trough_date': results['longest_underwater_trough_date'],
            'longest_underwater_recovery_date': results['longest_underwater_recovery_date'],
            'longest_underwater_is_max_drawdown': results['longest_underwater_is_max_drawdown'],
            'calmar_ratio': results['calmar_ratio'],
            'sterling_ratio': results['sterling_ratio'],
            'annual_return': results['annual_return'],
            'drawdown_series': results['drawdown_series'],
            'cumulative_returns': results['cumulative_returns']
        }