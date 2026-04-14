from .root_views import api_root, api_health
from .data_views import download_sample_data, download_macro_factors
from .macro_views import (
    macro_analyze_factors,
    macro_analyze_correlation,
    macro_analyze_situation,
)
from .portfolio_views import portfolio_analyze, portfolio_indices
from .risk_views import (
    risk_calculate_ratios,
    risk_calculate_var_es,
    risk_calculate_drawdown,
    risk_analyze_benchmark,
    risk_analyze_distribution,
    risk_analyze_correlation,
    risk_analyze_complete,
)
from .capm_views import (
    capm_analyze,
    capm_multi_asset,
    capm_optimize,
    capm_expected_return,
)
from .valuation_views import (
    valuation_analyze_company,
    valuation_compare,
    valuation_analyze_sector,
    valuation_generate_signals,
)
from .chat_views import (
    chat_send_message,
    chat_welcome,
    chat_clear_memory,
    chat_history,
)
