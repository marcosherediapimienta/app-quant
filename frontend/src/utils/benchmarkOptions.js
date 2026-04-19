/**
 * Portfolio index universes (ids for backend portfolio flows).
 */
export const BENCHMARK_LABELS = {
  SP500: 'S&P 500 · ~500 companies (USD)',
  NASDAQ100: 'NASDAQ 100 · ~100 companies (USD)',
  DOW30: 'Dow Jones 30 · ~30 companies (USD)',
  IBEX35: 'IBEX 35 · ~35 companies (EUR)',
  EUROSTOXX50: 'EURO STOXX 50 · ~50 companies (EUR)',
  NIKKEI225: 'Nikkei 225 · ~225 companies (JPY)',
  MSCI_WORLD: 'MSCI World · SP500 + EURO STOXX 50 + Nikkei 225 (USD)',
};

/** Yahoo symbol (CAPM dropdown value) → risk API benchmark key (backend BENCHMARKS). */
export const YAHOO_TICKER_TO_RISK_BENCHMARK = {
  '^GSPC': 'SP500',
  '^IXIC': 'NASDAQ_COMPOSITE',
  '^NDX': 'NASDAQ100_INDEX',
  '^DJI': 'DOW30',
  '^RUA': 'RUSSELL3000',
  '^IBEX': 'IBEX35',
  '^STOXX50E': 'EUROSTOXX50',
  '^N225': 'NIKKEI225',
  '^990100-USD-STRD': 'MSCI_WORLD',
  '000001.SS': 'SHANGHAI',
};

export function yahooTickerToRiskBenchmarkKey(yahooTicker) {
  if (!yahooTicker) return null;
  return YAHOO_TICKER_TO_RISK_BENCHMARK[yahooTicker] ?? null;
}

export const PORTFOLIO_INDEX_IDS = [
  'SP500',
  'NASDAQ100',
  'DOW30',
  'IBEX35',
  'EUROSTOXX50',
  'NIKKEI225',
  'MSCI_WORLD',
];

const toPortfolioOptions = (ids) =>
  ids.map((id) => ({ value: id, label: BENCHMARK_LABELS[id] }));

export const PORTFOLIO_INDEX_SELECT_OPTIONS = [
  { value: '', label: 'Select reference index...', disabled: true },
  ...toPortfolioOptions(PORTFOLIO_INDEX_IDS),
];
