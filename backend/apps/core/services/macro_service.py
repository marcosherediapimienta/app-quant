from .quant_service import QuantService
import pandas as pd
from typing import Dict, List

class MacroService:
    def __init__(self):
        self.MacroDataLoader = QuantService.get_class(
            'quant.macro.utils.components.macro_data_loader',
            'MacroDataLoader'
        )
        self.MacroFactorAnalyzer = QuantService.get_class(
            'quant.macro.utils.analyzers.macro_factor_analyzer',
            'MacroFactorAnalyzer'
        )
        self.MacroCorrelationAnalyzer = QuantService.get_class(
            'quant.macro.utils.analyzers.macro_correlation_analyzer',
            'MacroCorrelationAnalyzer'
        )
        self.MacroSituationAnalyzer = QuantService.get_class(
            'quant.macro.utils.analyzers.macro_situation_analyzer',
            'MacroSituationAnalyzer'
        )
        self.data_loader = self.MacroDataLoader()
        self.factor_analyzer = self.MacroFactorAnalyzer()
        self.correlation_analyzer = self.MacroCorrelationAnalyzer()
        self.situation_analyzer = self.MacroSituationAnalyzer()
    
    def load_macro_data(
        self,
        tickers: List[str],
        start_date: str,
        end_date: str
    ) -> pd.DataFrame:
        return self.data_loader.download(tickers, start_date, end_date)
    
    def analyze_factors(
        self,
        portfolio_returns: pd.Series,
        macro_factors: pd.DataFrame,
        use_hac: bool = True
    ) -> Dict:
        return self.factor_analyzer.analyze(portfolio_returns, macro_factors, use_hac)
    
    def analyze_correlation(
        self,
        portfolio_returns: pd.Series,
        macro_factors: pd.DataFrame
    ) -> Dict:
        return self.correlation_analyzer.analyze(portfolio_returns, macro_factors)
    
    def analyze_situation(
        self,
        factors_data: Dict[str, pd.Series]
    ) -> Dict:
        return self.situation_analyzer.analyze(factors_data)