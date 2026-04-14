from django.urls import path
from quant.api import views

app_name = 'api'

urlpatterns = [
    path('', views.api_root, name='root'),
    path('health/', views.api_health, name='health'),

    # Data
    path('data/download/', views.download_sample_data, name='download-sample-data'),
    path('data/macro-factors/', views.download_macro_factors, name='download-macro-factors'),

    # Macro
    path('macro/factors/', views.macro_analyze_factors, name='macro-factors'),
    path('macro/correlation/', views.macro_analyze_correlation, name='macro-correlation'),
    path('macro/situation/', views.macro_analyze_situation, name='macro-situation'),

    # Portfolio
    path('portfolio/analyze/', views.portfolio_analyze, name='portfolio-analyze'),
    path('portfolio/indices/', views.portfolio_indices, name='portfolio-indices'),

    # Risk
    path('risk/ratios/', views.risk_calculate_ratios, name='risk-ratios'),
    path('risk/var-es/', views.risk_calculate_var_es, name='risk-var-es'),
    path('risk/drawdown/', views.risk_calculate_drawdown, name='risk-drawdown'),
    path('risk/benchmark/', views.risk_analyze_benchmark, name='risk-benchmark'),
    path('risk/distribution/', views.risk_analyze_distribution, name='risk-distribution'),
    path('risk/correlation/', views.risk_analyze_correlation, name='risk-correlation'),
    path('risk/complete/', views.risk_analyze_complete, name='risk-complete'),

    # CAPM
    path('capm/analyze/', views.capm_analyze, name='capm-analyze'),
    path('capm/multi-asset/', views.capm_multi_asset, name='capm-multi-asset'),
    path('capm/optimize/', views.capm_optimize, name='capm-optimize'),
    path('capm/expected-return/', views.capm_expected_return, name='capm-expected-return'),

    # Valuation
    path('valuation/company/', views.valuation_analyze_company, name='valuation-company'),
    path('valuation/compare/', views.valuation_compare, name='valuation-compare'),
    path('valuation/sector/', views.valuation_analyze_sector, name='valuation-sector'),
    path('valuation/signals/', views.valuation_generate_signals, name='valuation-signals'),

    # Chat
    path('chat/send/', views.chat_send_message, name='chat-send'),
    path('chat/welcome/', views.chat_welcome, name='chat-welcome'),
    path('chat/clear/', views.chat_clear_memory, name='chat-clear'),
    path('chat/history/', views.chat_history, name='chat-history'),
]
