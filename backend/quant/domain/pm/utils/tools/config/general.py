BENCHMARKS = {
    'SP500': '^GSPC',
    'NASDAQ_COMPOSITE': '^IXIC',
    'DOW30': '^DJI',
    'RUSSELL3000': '^RUA',
    'IBEX35': '^IBEX',
    'EUROSTOXX50': '^STOXX50E',
    'NIKKEI225': '^N225',
    'MSCI_WORLD': '^990100-USD-STRD',
    'RUSSELL2000': '^RUT',
    'SHANGHAI': '000001.SS',
}

BENCHMARK_CURRENCIES = {
    'SP500': 'USD',
    'NASDAQ_COMPOSITE': 'USD',
    'DOW30': 'USD',
    'RUSSELL2000': 'USD',
    'RUSSELL3000': 'USD',
    'IBEX35': 'EUR',
    'EUROSTOXX50': 'EUR',
    'NIKKEI225': 'JPY',
    'MSCI_WORLD': 'USD',
    'SHANGHAI': 'CNY',
}

BENCHMARK_LABELS = {
    'SP500': 'S&P 500 · ~500 companies (USD)',
    'NASDAQ100': 'NASDAQ 100 · ~100 companies (USD)',
    'NASDAQ_COMPOSITE': 'NASDAQ Composite (^IXIC) · USD',
    'DOW30': 'Dow Jones 30 · ~30 companies (USD)',
    'IBEX35': 'IBEX 35 · ~35 companies (EUR)',
    'EUROSTOXX50': 'EURO STOXX 50 · ~50 companies (EUR)',
    'NIKKEI225': 'Nikkei 225 · ~225 companies (JPY)',
    'MSCI_WORLD': 'MSCI World · SP500 + EURO STOXX 50 + Nikkei 225 (USD)',
    'RUSSELL2000': 'Russell 2000 · small cap (USD)',
}

ANALYSIS_DATES = {
    'start_date': '2020-01-01',
    'end_date': '2026-04-01',
    'use_current_date_as_end': True,
    'default_lookback_years': 5,
}

DOWNLOAD_DEFAULTS = {
    'auto_adjust': True,
    'group_by': 'ticker',
    'threads': True,
    'progress': True
}

YFINANCE_COLUMNS = {
    'adj_close': 'Adj Close',
    'close': 'Close',
    'open': 'Open',
    'high': 'High',
    'low': 'Low',
    'volume': 'Volume',
}
