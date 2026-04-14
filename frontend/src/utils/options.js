export const PORTFOLIO_TICKER_OPTIONS = [
  // US broad market
  { value: '^GSPC', label: '^GSPC - S&P 500 Index' },
  { value: '^IXIC', label: '^IXIC - NASDAQ Index' },
  { value: '^DJI', label: '^DJI - Dow Jones Industrial Average Index' },
  { value: '^RUA', label: '^RUA - Russell 3000 Index' },
  // International indices
  { value: '^IBEX', label: '^IBEX - IBEX 35 Index (EUR)' },
  { value: '^STOXX50E', label: '^STOXX50E - Euro Stoxx 50 Index (EUR)' },
  { value: '^N225', label: '^N225 - Nikkei 225 Index (JPY)' },
  { value: '^990100-USD-STRD', label: '^990100-USD-STRD - MSCI World Index (USD)' },
  { value: '000001.SS', label: '000001.SS - Shanghai Composite Index' },
];

export const MACRO_FACTOR_DESCRIPTIONS = {
  // Volatility & fear
  'VIX': 'VIX: Equity market fear gauge (S&P 500 implied volatility)',
  'VXN': 'VXN: NASDAQ implied volatility',
  'VVIX': 'VVIX: Volatility of VIX — measures tail risk and extreme uncertainty',
  // Equity indices (market regime / beta context)
  'GSPC': 'S&P 500 Index: US large-cap equity benchmark',
  'IXIC': 'NASDAQ Composite Index: Broad NASDAQ equity benchmark',
  'DJI': 'Dow Jones Industrial Average: US blue-chip equity benchmark',
  'RUA': 'Russell 3000 Index: Broad US equity market benchmark',
  'IBEX': 'IBEX 35 Index: Spanish equity benchmark',
  'STOXX50E': 'Euro Stoxx 50 Index: Eurozone large-cap benchmark',
  'N225': 'Nikkei 225 Index: Japan equity benchmark',
  '990100-USD-STRD': 'MSCI World Index: Developed markets global equity benchmark (USD)',
  '000001.SS': 'Shanghai Composite Index: Mainland China equity benchmark',
  // Interest rates
  'TNX': 'Treasury Yield 10-year',
  'RATE_10Y': 'US 10Y yield: Key global risk-free rate benchmark',
  'TYX': 'Treasury Yield 30-year',
  'RATE_30Y': 'US 30Y yield: Long-term inflation and growth expectations',
  'IRX': 'Treasury Yield 3-month',
  'RATE_3M': 'US 3M yield: Short-term monetary policy expectations',
  'RATE_2Y': 'US 2Y yield: Most sensitive to Fed rate expectations',
  'FVX': 'Treasury Yield 5-year',
  'RATE_5Y': 'US 5Y yield: Medium-term growth and inflation mix',
  // Fixed income & credit
  'TLT': 'TLT: 20Y Treasury Bond ETF — duration risk proxy',
  'GOVT_20Y': 'US 20Y government bonds: Long duration, rate-sensitive',
  'TIP': 'TIPS: Inflation-Protected Bonds — proxy for real rates',
  'TIPS': 'TIPS: Inflation-Protected Bonds — proxy for real rates',
  'HYG': 'HYG: High Yield ETF — credit risk / risk-on indicator',
  'LQD': 'LQD: Investment Grade ETF — quality credit spread',
  'JNK': 'JNK: Junk Bonds — extreme credit risk appetite',
  'IBND': 'International Corporate Bonds',
  'EUR_BOND': 'EUR_BOND: European corporate bonds',
  'DBJP': 'Japan Bond ETF',
  'JPN_BOND': 'Japan Bond ETF: BoJ policy and yen carry trade proxy',
  'GER_BOND': 'Germany Bund ETF: European risk-free rate proxy',
  'BUNL': 'Germany Bund ETF: European risk-free rate proxy',
  // FX
  'DX-Y.NYB': 'DXY: Dollar Index — inverse risk-on indicator',
  'DXY': 'DXY: Dollar Index — strengthens in risk-off, pressures EM and commodities',
  'EURUSD=X': 'EUR/USD: Euro vs Dollar exchange rate',
  'EUR_USD': 'EUR/USD: European economic health vs US monetary policy',
  'JPY=X': 'USD/JPY: Yen carry trade — falls sharply in risk-off episodes',
  'USD_JPY': 'USD/JPY: Classic carry trade proxy and safe-haven indicator',
  'GBPUSD=X': 'GBP/USD: British Pound — UK macro and post-Brexit indicator',
  'GBP_USD': 'GBP/USD: UK economic cycle and BoE policy proxy',
  'AUDUSD=X': 'AUD/USD: Australian Dollar — risk-on commodity currency, China proxy',
  'AUD_USD': 'AUD/USD: Risk appetite and commodity cycle indicator',
  'USDCAD=X': 'USD/CAD: Canadian Dollar — oil prices and North American cycle',
  'USD_CAD': 'USD/CAD: Commodity currency, correlated with crude oil',
  // Commodities
  'GC=F': 'Gold: Safe haven, real rate hedge, dollar inverse',
  'GOLD': 'Gold: Safe haven — rallies when real rates fall or fear rises',
  'SI=F': 'Silver: Industrial + monetary dual role',
  'SILVER': 'Silver: More volatile than gold, industrial demand component',
  'CL=F': 'WTI Crude Oil: Energy prices, inflation, geopolitical risk',
  'OIL': 'WTI Crude Oil: Global growth and supply shock indicator',
  'BZ=F': 'Brent Crude Oil: Global benchmark (Europe/Asia), geopolitics and inflation',
  'BRENT': 'Brent Crude Oil: Global benchmark (Europe/Asia), geopolitics and inflation',
  'NG=F': 'Natural Gas: Energy transition, European macro risk driver',
  'NAT_GAS': 'Natural Gas: Highly volatile energy commodity, key for European inflation',
  'HG=F': 'Copper: Economic growth barometer (Dr. Copper)',
  'COPPER': 'Copper: Leading indicator of global industrial activity',
  // Crypto
  'BTC-USD': 'Bitcoin: Risk-on digital asset, correlates with tech/growth stocks',
  'BITCOIN': 'Bitcoin: Risk-on digital asset, correlates with tech/growth stocks',
  // Real assets
  'VNQ': 'VNQ: US Real Estate ETF — highly sensitive to interest rates',
  'REALESTATE': 'US REITs: Rate-sensitive real assets, inflation hedge proxy',
};

export const getFactorDescription = (factor) => {
  const cleanFactor = factor.replace(/^\^/, '');
  return MACRO_FACTOR_DESCRIPTIONS[cleanFactor] || MACRO_FACTOR_DESCRIPTIONS[factor] || 'Macroeconomic factor';
};

export const MACRO_FACTORS_OPTIONS = [
  // Volatility & fear
  { value: 'VIX', ticker: '^VIX', label: 'VIX - Equity Fear Gauge' },
  { value: 'VVIX', ticker: '^VVIX', label: 'VVIX - Vol of Vol (tail risk)' },
  // Equity indices (market regime / beta context)
  { value: 'SP500_INDEX', ticker: '^GSPC', label: '^GSPC - S&P 500 Index' },
  { value: 'NASDAQ_INDEX', ticker: '^IXIC', label: '^IXIC - NASDAQ Composite Index' },
  { value: 'DOW_INDEX', ticker: '^DJI', label: '^DJI - Dow Jones Industrial Average' },
  { value: 'RUSSELL3000_INDEX', ticker: '^RUA', label: '^RUA - Russell 3000 Index' },
  { value: 'IBEX35_INDEX', ticker: '^IBEX', label: '^IBEX - IBEX 35 Index' },
  { value: 'EUROSTOXX50_INDEX', ticker: '^STOXX50E', label: '^STOXX50E - Euro Stoxx 50 Index' },
  { value: 'NIKKEI225_INDEX', ticker: '^N225', label: '^N225 - Nikkei 225 Index' },
  { value: 'MSCI_WORLD_INDEX', ticker: '^990100-USD-STRD', label: '^990100-USD-STRD - MSCI World Index' },
  { value: 'SHANGHAI_INDEX', ticker: '000001.SS', label: '000001.SS - Shanghai Composite Index' },
  // Interest rates (yield curve)
  { value: 'RATE_3M', ticker: '^IRX', label: 'RATE_3M - Treasury 3-Month' },
  { value: 'RATE_2Y', ticker: 'FRED:DGS2', label: 'RATE_2Y - Treasury 2-Year (Fed sensitive)' },
  { value: 'RATE_5Y', ticker: '^FVX', label: 'RATE_5Y - Treasury 5-Year' },
  { value: 'RATE_10Y', ticker: '^TNX', label: 'RATE_10Y - Treasury 10-Year (benchmark)' },
  { value: 'RATE_30Y', ticker: '^TYX', label: 'RATE_30Y - Treasury 30-Year' },
  // Fixed income & credit
  { value: 'GOVT_20Y', ticker: 'TLT', label: 'GOVT_20Y - Treasury 20Y+ Bond ETF' },
  { value: 'TIPS', ticker: 'TIP', label: 'TIPS - Inflation-Protected Bonds (real rates)' },
  { value: 'HYG', ticker: 'HYG', label: 'HYG - High Yield (credit risk)' },
  { value: 'LQD', ticker: 'LQD', label: 'LQD - Investment Grade Corporate' },
  { value: 'JPN_BOND', ticker: 'DBJP', label: 'JPN_BOND - Japan Bond ETF' },
  { value: 'EUR_BOND', ticker: 'IBND', label: 'EUR_BOND - Europe Bond ETF' },
  // FX
  { value: 'DXY', ticker: 'DX-Y.NYB', label: 'DXY - Dollar Index' },
  { value: 'EUR_USD', ticker: 'EURUSD=X', label: 'EUR/USD - Euro vs Dollar' },
  { value: 'USD_JPY', ticker: 'JPY=X', label: 'USD/JPY - Yen (carry trade / safe haven)' },
  { value: 'GBP_USD', ticker: 'GBPUSD=X', label: 'GBP/USD - British Pound' },
  { value: 'AUD_USD', ticker: 'AUDUSD=X', label: 'AUD/USD - Aussie (risk-on / China proxy)' },
  // Commodities
  { value: 'GOLD', ticker: 'GC=F', label: 'GOLD - Gold Futures (safe haven)' },
  { value: 'SILVER', ticker: 'SI=F', label: 'SILVER - Silver Futures' },
  { value: 'OIL', ticker: 'CL=F', label: 'OIL - Crude Oil WTI' },
  { value: 'BRENT', ticker: 'BZ=F', label: 'BRENT - Brent Crude Oil' },
  { value: 'NAT_GAS', ticker: 'NG=F', label: 'NAT_GAS - Natural Gas Futures' },
  { value: 'COPPER', ticker: 'HG=F', label: 'COPPER - Copper (growth barometer)' },
  // Real assets & crypto
  { value: 'REALESTATE', ticker: 'VNQ', label: 'VNQ - US Real Estate (rate sensitive)' },
  { value: 'BITCOIN', ticker: 'BTC-USD', label: 'BITCOIN - Bitcoin (risk-on digital)' },
];

export const SITUATION_AUTO_FACTORS = [
  // Yield curve
  'RATE_3M', 'RATE_2Y', 'RATE_5Y', 'RATE_10Y', 'RATE_30Y',
  // Credit & duration
  'GOVT_20Y', 'TIPS', 'HYG', 'LQD',
  // Volatility
  'VIX', 'VVIX',
  // FX
  'DXY', 'EUR_USD', 'USD_JPY',
  // Commodities
  'GOLD', 'OIL', 'BRENT', 'NAT_GAS', 'COPPER', 'SILVER',
  // Bonds
  'JPN_BOND', 'EUR_BOND',
  // Crypto
  'BITCOIN',
];
