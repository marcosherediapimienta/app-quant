BENCHMARKS = {
    'SP500':        '^GSPC',
    'NASDAQ100':    '^IXIC',
    'DOW30':        '^DJI',
    'IBEX35':       '^IBEX',
    'EUROSTOXX50':  '^STOXX50E',
    'NIKKEI225':    '^N225',
    'MSCI_WORLD':   '^990100-USD-STRD',
    'RUSSELL2000':  '^RUT',
}

BENCHMARK_CURRENCIES = {
    'SP500':        'USD',
    'NASDAQ100':    'USD',
    'DOW30':        'USD',
    'RUSSELL2000':  'USD',
    'IBEX35':       'EUR',
    'EUROSTOXX50':  'EUR',
    'NIKKEI225':    'JPY',
    'MSCI_WORLD':   'USD',
}

ANALYSIS_DATES = {
    'start_date': '2020-01-01',
    'end_date': '2025-12-24',
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
