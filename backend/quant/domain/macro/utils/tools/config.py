MACRO_FACTORS = {
    # Volatility
    'VIX': '^VIX',
    'VXN': '^VXN',
    'MOVE': '^MOVE',  # ICE BofA MOVE — Treasury implied vol (liquidity / rates stress)

    # US interest rates
    'RATE_3M': '^IRX',
    # RATE_2Y is downloaded from FRED (see FRED_FACTORS)
    'RATE_5Y': '^FVX',
    'RATE_10Y': '^TNX',
    'RATE_30Y': '^TYX',

    # US bonds (ETFs)
    'GOVT_1_3Y': 'SHY',
    'GOVT_7_10Y': 'IEF',
    'GOVT_20Y': 'TLT',
    'TIPS': 'TIP',

    # International bonds (ETFs)
    'JPN_BOND': 'DBJP',      # iShares Japan Bond ETF
    'EUR_BOND': 'IBND',      # SPDR International Corporate Bond ETF
    'GER_BOND': 'BUNL',      # iShares Germany Government Bond ETF
    'UK_BOND': 'IGOV',       # iShares International Treasury Bond ETF (includes UK)
    'CHINA_BOND': 'CBON',    # VanEck China Bond ETF

    # Credit spreads
    'HYG': 'HYG',
    'LQD': 'LQD',
    'JNK': 'JNK',

    # Currencies
    'DXY': 'DX-Y.NYB',
    'EUR_USD': 'EURUSD=X',
    'GBP_USD': 'GBPUSD=X',
    'USD_JPY': 'JPY=X',

    # Precious metals
    'GOLD': 'GC=F',
    'SILVER': 'SI=F',
    'COPPER': 'HG=F',

    # Energy
    'OIL': 'CL=F',
    'BRENT': 'BZ=F',
    'NATGAS': 'NG=F',

    # Agriculture
    'WHEAT': 'ZW=F',
    'CORN': 'CORN',

    # US indices
    'SP500': '^GSPC',
    'NASDAQ': '^IXIC',
    'RUSSELL2000': '^RUT',

    # International indices
    'DAX': '^GDAXI',
    'FTSE': '^FTSE',
    'NIKKEI': '^N225',
    'HANG_SENG': '^HSI',
    'SHANGHAI': '000001.SS',
    'MSCI_EM': 'EEM',

    # Crypto (risk/liquidity proxy; excluded from headline commodity avg in macro situation)
    'BITCOIN': 'BTC-USD',
}

# ============================================================================
# FRED factors (public CSV, no API key)
# Yahoo Finance has no ticker for some yields (e.g. 2Y).
# Downloaded directly from https://fred.stlouisfed.org
# ============================================================================
FRED_FACTORS = {
    'RATE_2Y': 'DGS2',    # 2-Year Treasury Constant Maturity Rate (%)
}

# ============================================================================
# Factor categories (for grouping and selection)
# ============================================================================
MACRO_FACTOR_CATEGORIES = {
    'volatility': ['VIX', 'VXN', 'MOVE'],
    'interest_rates': ['RATE_3M', 'RATE_2Y', 'RATE_5Y', 'RATE_10Y', 'RATE_30Y'],
    'us_bonds': ['GOVT_1_3Y', 'GOVT_7_10Y', 'GOVT_20Y', 'TIPS'],
    'intl_bonds': ['JPN_BOND', 'EUR_BOND', 'GER_BOND', 'UK_BOND', 'CHINA_BOND'],
    'credit': ['HYG', 'LQD', 'JNK'],
    'currencies': ['DXY', 'EUR_USD', 'GBP_USD', 'USD_JPY'],
    'metals': ['GOLD', 'SILVER', 'COPPER'],
    'energy': ['OIL', 'BRENT', 'NATGAS'],
    'agriculture': ['WHEAT', 'CORN'],
    'us_indices': ['SP500', 'NASDAQ', 'RUSSELL2000'],
    'intl_indices': ['DAX', 'FTSE', 'NIKKEI', 'HANG_SENG', 'SHANGHAI', 'MSCI_EM'],
}

# ============================================================================
# Predefined factor sets (for quick analyses)
# ============================================================================

# Core essential factors (6)
MACRO_CORE_FACTORS = [
    'VIX',           # Volatility
    'RATE_10Y',      # Long rate
    'RATE_3M',       # Short rate
    'DXY',           # Dollar
    'GOLD',          # Safe haven / inflation
    'OIL',           # Energy / growth
]

# Factors for full analysis (17)
MACRO_GLOBAL_FACTORS = [
    # US yield curve
    'RATE_2Y', 'RATE_5Y', 'RATE_10Y', 'RATE_30Y',
    # Bonds
    'GOVT_20Y', 'JPN_BOND', 'EUR_BOND', 'GER_BOND',
    # Credit
    'HYG', 'LQD',
    # Commodities (inflation)
    'GOLD', 'OIL', 'COPPER', 'SILVER',
    # Volatility
    'VIX',
    # FX
    'DXY', 'EUR_USD',
    # Indices
    'SP500', 'NIKKEI', 'DAX',
]

# Factors for tech-style portfolios (current default use case)
FACTORS_TO_USE = [
    'VIX',           # Market risk
    'RATE_2Y',       # Short-end expectations
    'RATE_10Y',      # Long rate
    'RATE_30Y',      # For 30Y–10Y spread
    'GOVT_20Y',      # Treasury for credit spread
    'HYG',           # High yield
    'LQD',           # Investment grade
    'DXY',           # Dollar
    'GOLD',          # Safe haven
    'OIL',           # Energy / inflation
    'SP500',         # Equity market
]

# ============================================================================
# Transforms (how each factor type is processed)
# ============================================================================
MACRO_TRANSFORMS = {
    # Factors that need division by 10 (Yahoo scales yields)
    # RATE_2Y comes from FRED already in %, does NOT need /10
    'yield_factors': ['RATE_3M', 'RATE_10Y', 'RATE_30Y', 'RATE_5Y'],

    # Factors that use differences (not returns)
    'diff_factors': ['RATE_3M', 'RATE_10Y', 'RATE_30Y', 'RATE_2Y', 'RATE_5Y', 'VIX'],

    # Factors that use log returns
    'log_return_factors': [
        'DXY', 'EUR_USD', 'GBP_USD', 'USD_JPY',
        'GOLD', 'OIL', 'BRENT', 'COPPER', 'SILVER',
        'BITCOIN',
        'SP500', 'NASDAQ', 'RUSSELL2000',
        'TLT', 'IEF', 'SHY', 'HYG', 'LQD', 'GOVT_20Y',
    ],
}

# ============================================================================
# Spreads (factor combinations)
# ============================================================================
MACRO_SPREADS = {
    # Yield curve (growth expectations)
    'yield_curve_30_10y': {
        'long': 'RATE_30Y',
        'short': 'RATE_10Y',
        'transform': 'diff',
    },

    # HY vs Treasury credit spread
    'credit_spread_hy': {
        'risky': 'HYG',
        'safe': 'GOVT_20Y',
        'transform': 'diff',
    },

    # HY vs IG credit spread (risk appetite)
    'credit_spread_hy_lqd': {
        'risky': 'HYG',
        'safe': 'LQD',
        'transform': 'diff',
    },
}

# ============================================================================
# Analysis parameters
# ============================================================================
MACRO_ANALYSIS = {
    # Correlation
    'correlation': {
        'default_lag_window': 126,    # ~6 months
        'min_observations': 60,
        'max_lag': 30,                # Reduced from 126 to 30 days (~1 month)
        'hac_maxlags': 5,
    },

    # Multi-factor regression
    'regression': {
        'min_observations': 100,      # Minimum for robust regression
        'hac_maxlags': None,          # None = auto (sqrt(n))
        'significance_level': 0.05,
    },

    # Market regimes
    'regime': {
        'window': 252,
        'step': 21,
        'n_clusters': 3,
        'features': ['vol', 'ret', 'sharpe', 'mdd'],
    },

    # Signals
    'signal': {
        'percentile_window': 252,
        'upper_threshold': 0.8,
        'lower_threshold': 0.2,
    },

    # Transforms
    'transforms': {
        'yield_scale': 10.0,
        'use_log_returns': True,
    },
}

# ============================================================================
# Macro situation analysis parameters
# ============================================================================
MACRO_SITUATION_THRESHOLDS = {
    # Horizons (trading days)
    'periods': {
        'week': 5,
        'month': 21,
        'quarter': 63,
        'year': 252,
    },

    # VIX levels
    'vix': {
        'panic': 35,
        'stress': 25,
        'tension': 20,
        'normal': 15,
    },

    # MOVE index (Treasury implied volatility; rough scale ~60–150)
    'move': {
        'stress': 120,
        'elevated': 95,
        'normal': 80,
    },

    # Yield curve spreads (percentage points)
    'yield_curve': {
        'inverted': 0.0,
        'flat': 0.3,
        'steep': 2.0,
    },

    # Inflation (annual % change in commodities)
    'inflation': {
        'high': 15,
        'moderate': 5,
        'low': -5,
    },

    # Dollar / gold trends (% change)
    'trends': {
        'strong_move': 5,
        'moderate_move': 3,
        'significant_gold': 10,
        'divergence_threshold': 0.5,
        'momentum_ratio': 0.4,
    },

    # Global bonds (% change)
    'bonds': {
        'severe_drop': -10,
        'moderate_drop': -5,
        'strong_gain': 10,
        'moderate_gain': 5,
    },
}

# Risk scoring thresholds for MacroSituationAnalyzer summary
RISK_SCORING = {
    'yield_curve': {
        'high_risk_score': 3,
        'moderate_risk_score': 1,
        'divergence_elevated': 1.0,
        'divergence_moderate': 0.5,
        'divergence_elevated_score': 2,
        'divergence_moderate_score': 1,
    },
    'implied_curve': {
        'hawkish_score': 2,
        'slightly_hawkish_score': 1,
        'term_premium_deep_negative': -0.5,
        'term_premium_negative': -0.2,
        'term_premium_deep_score': 2,
        'term_premium_negative_score': 1,
        'fwd_vs_spot_high': 1.0,
        'fwd_vs_spot_moderate': 0.5,
        'fwd_vs_spot_high_score': 2,
        'fwd_vs_spot_moderate_score': 1,
        'inverted_fwd_score': 2,
    },
    'inflation': {
        'high_threshold': 15,
        'moderate_threshold': 10,
        'high_score': 3,
        'moderate_score': 1,
        'metals_threshold': 20,
        'metals_score': 2,
    },
    'credit': {
        'vix_high': 25,
        'vix_elevated': 20,
        'vix_default': 15,
        'vix_high_score': 3,
        'vix_elevated_score': 1,
        'move_high': 120,
        'move_elevated': 95,
        'move_high_score': 2,
        'move_elevated_score': 1,
    },
    'bonds': {
        'severe_threshold': -10,
        'pressure_threshold': -5,
        'severe_score': 2,
        'pressure_score': 1,
    },
    'sentiment': {
        'weakening_score': 1,
    },
    'overall': {
        'high': 5,
        'moderate': 2,
    },
}

# Lags for correlation analysis
CORRELATION_LAGS_DEFAULT = [0, 1, 5, 21, 63, 126]  # 0d, 1d, 1w, 1m, 3m, 6m

# Thresholds for sensitivities (betas)
SENSITIVITY_THRESHOLDS = {
    'high': 0.5,
    'moderate': 0.2,
    'low': 0.0,
}

# ============================================================================
# Convenience constants (for direct imports)
# ============================================================================

# Correlation
DEFAULT_LAG_WINDOW = MACRO_ANALYSIS['correlation']['default_lag_window']
MAX_LAG = MACRO_ANALYSIS['correlation']['max_lag']
CORRELATION_MIN_OBS = MACRO_ANALYSIS['correlation']['min_observations']
HAC_MAXLAGS = MACRO_ANALYSIS['correlation']['hac_maxlags']

# Regression
REGRESSION_MIN_OBS = MACRO_ANALYSIS['regression']['min_observations']
REGRESSION_SIGNIFICANCE = MACRO_ANALYSIS['regression']['significance_level']

# Regimes
REGIME_WINDOW = MACRO_ANALYSIS['regime']['window']
REGIME_STEP = MACRO_ANALYSIS['regime']['step']
REGIME_N_CLUSTERS = MACRO_ANALYSIS['regime']['n_clusters']

# Signals
SIGNAL_PERCENTILE_WINDOW = MACRO_ANALYSIS['signal']['percentile_window']
SIGNAL_UPPER_THRESHOLD = MACRO_ANALYSIS['signal']['upper_threshold']
SIGNAL_LOWER_THRESHOLD = MACRO_ANALYSIS['signal']['lower_threshold']

# Transforms
YIELD_SCALE = MACRO_ANALYSIS['transforms']['yield_scale']
USE_LOG_RETURNS = MACRO_ANALYSIS['transforms']['use_log_returns']

# Annualization
ANNUAL_FACTOR = 252

# Macro situation periods
PERIOD_WEEK = MACRO_SITUATION_THRESHOLDS['periods']['week']
PERIOD_MONTH = MACRO_SITUATION_THRESHOLDS['periods']['month']
PERIOD_QUARTER = MACRO_SITUATION_THRESHOLDS['periods']['quarter']
PERIOD_YEAR = MACRO_SITUATION_THRESHOLDS['periods']['year']
