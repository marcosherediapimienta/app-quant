import numpy as np
import pandas as pd
from typing import Dict
from .helpers import calculate_portfolio_returns, annualize_return
from ....tools.config import ANNUAL_FACTOR

class DrawdownCalculator:
    def __init__(self, annual_factor: float = None):
        self.annual_factor = annual_factor if annual_factor is not None else ANNUAL_FACTOR
    
    def calculate(
        self,
        returns: pd.DataFrame,
        weights: np.ndarray,
        risk_free_rate: float = 0.0
    ) -> Dict:

        portfolio_ret = calculate_portfolio_returns(returns, weights)
        cumulative = (1 + portfolio_ret).cumprod()
        running_max = cumulative.cummax()
        drawdown = (cumulative / running_max) - 1.0
        max_dd = float(drawdown.min())
        max_dd_date = drawdown.idxmin()

        episodes = self._underwater_episodes(drawdown)
        max_dd_pos = int(drawdown.to_numpy().argmin())
        deepest = next(
            (e for e in episodes if e['start_idx'] <= max_dd_pos <= e['end_idx']),
            None,
        )
        longest = max(episodes, key=lambda e: e['duration']) if episodes else None
        max_duration = longest['duration'] if longest else 0

        annual_return = annualize_return(portfolio_ret, self.annual_factor)
        calmar = float(annual_return / abs(max_dd)) if max_dd < 0 else np.nan
        dd_monthly = drawdown.resample('ME').min()
        worst_3 = dd_monthly.nsmallest(3)
        
        if len(worst_3) >= 1 and worst_3.mean() < 0:
            sterling = float((annual_return - risk_free_rate) / abs(worst_3.mean()))
        else:
            sterling = np.nan
        
        return {
            'max_drawdown': max_dd,
            'max_drawdown_pct': max_dd * 100,
            'max_drawdown_date': max_dd_date,
            'max_drawdown_peak_date': deepest['peak_date'] if deepest else None,
            'max_drawdown_recovery_date': deepest['recovery_date'] if deepest else None,
            'max_drawdown_recovered': bool(deepest['recovered']) if deepest else False,
            'max_drawdown_duration': int(deepest['duration']) if deepest else 0,
            'max_underwater_duration': int(max_duration),
            'longest_underwater_start': longest['peak_date'] if longest else None,
            'longest_underwater_trough_date': longest['trough_date'] if longest else None,
            'longest_underwater_recovery_date': longest['recovery_date'] if longest else None,
            'longest_underwater_is_max_drawdown': (
                bool(deepest is not None and longest is not None
                     and deepest['start_idx'] == longest['start_idx'])
            ),
            'calmar_ratio': calmar,
            'sterling_ratio': sterling,
            'drawdown_series': drawdown,
            'cumulative_returns': cumulative,
            'annual_return': float(annual_return)
        }

    @staticmethod
    def _underwater_episodes(drawdown: pd.Series) -> list:
        """Split the drawdown series into contiguous below-peak episodes.

        The deepest episode and the longest one are frequently different, so each
        is described independently (peak, trough and recovery dates).
        """
        underwater = (drawdown < 0).to_numpy()
        index = drawdown.index
        spans = []
        start = None

        for i, is_under in enumerate(underwater):
            if is_under and start is None:
                start = i
            elif not is_under and start is not None:
                spans.append((start, i - 1))
                start = None

        if start is not None:
            spans.append((start, len(underwater) - 1))

        episodes = []
        for start_i, end_i in spans:
            segment = drawdown.iloc[start_i:end_i + 1]
            trough_pos = int(segment.to_numpy().argmin())
            recovered = end_i + 1 < len(index)
            episodes.append({
                'start_idx': start_i,
                'end_idx': end_i,
                'duration': end_i - start_i + 1,
                # The peak is the last session at the previous high-water mark.
                'peak_date': index[start_i - 1] if start_i > 0 else index[0],
                'trough_date': segment.index[trough_pos],
                'trough_value': float(segment.iloc[trough_pos]),
                'recovery_date': index[end_i + 1] if recovered else None,
                'recovered': recovered,
            })

        return episodes