/**
 * @see options.js 
 */

/** @typedef {'primary_macro' | 'benchmark' | 'risk_proxy'} FactorCategory */
/** @typedef {'rates' | 'credit' | 'fx' | 'commodities' | 'volatility' | 'equities' | 'real_assets' | 'crypto'} FactorFamily */
/** @typedef {'US' | 'Europe' | 'Global' | 'Japan' | 'China' | 'Multi'} FactorRegion */
/** @typedef {'driver' | 'benchmark' | 'proxy'} FactorRole */

/**
 * @typedef {Object} MacroFactorDefinition
 * @property {string} id
 * @property {string} ticker
 * @property {string} label
 * @property {string} description
 * @property {FactorCategory} category
 * @property {FactorFamily} family
 * @property {FactorRegion} region
 * @property {FactorRole} role
 * @property {string[]} [aliases] 
 * @property {string[]} [tags]
 * @property {'core' | 'extended' | false} [defaultAutoSituation] 
 * @property {'primary_global' | 'secondary_us_broad' | 'complementary_growth' | 'regional' | null} [benchmarkTier]
 * @property {boolean} [selectable] 
 */

/**
 * @typedef {Object} DerivedFactorSpec
 * @property {string} id
 * @property {'diff' | 'ratio' | 'spread'} formula
 * @property {string[]} operands — canonical ids
 * @property {string} label
 * @property {string} [description]
 * @property {'planned'} status
 */

const stripCaret = (s) => (typeof s === 'string' ? s.replace(/^\^/, '') : s);

const tickerVariants = (ticker) => {
  if (!ticker || typeof ticker !== 'string') return [];
  const t = ticker.trim();
  const out = new Set([t, t.toUpperCase(), stripCaret(t), stripCaret(t).toUpperCase()]);
  if (!t.startsWith('^')) out.add(`^${t}`);
  else out.add(stripCaret(t));
  return [...out];
};

/** @type {MacroFactorDefinition[]} */
export const MACRO_FACTOR_DEFINITIONS = [
  // —— Volatility (drivers) ——
  {
    id: 'VIX',
    ticker: '^VIX',
    label: 'VIX — S&P 500 implied volatility',
    description:
      'VIX: S&P 500 implied volatility (fear/risk-aversion gauge for US equities). A regime driver rather than a “pure” macro yield.',
    category: 'primary_macro',
    family: 'volatility',
    region: 'US',
    role: 'driver',
    tags: ['risk_off', 'equities'],
    defaultAutoSituation: 'core',
  },
  {
    id: 'VVIX',
    ticker: '^VVIX',
    label: 'VVIX — volatility of VIX (tail risk)',
    description:
      'VVIX: volatility of the VIX itself; captures tail risk and stress in the options market.',
    category: 'primary_macro',
    family: 'volatility',
    region: 'US',
    role: 'driver',
    tags: ['tail_risk', 'risk_off'],
    defaultAutoSituation: 'extended',
  },
  {
    id: 'MOVE',
    ticker: '^MOVE',
    label: 'MOVE — ICE BofA MOVE Index (rate volatility)',
    description:
      'MOVE: bond-market implied volatility index. Complements VIX by flagging rate/duration stress and fixed-income dislocations that may not show up in equity vol.',
    category: 'primary_macro',
    family: 'volatility',
    region: 'US',
    role: 'driver',
    tags: ['rates', 'duration', 'risk_off', 'fixed_income'],
    defaultAutoSituation: 'extended',
    aliases: ['MOVE'],
  },
  {
    id: 'VIX3M',
    ticker: '^VIX3M',
    label: 'VIX3M — 3-month implied volatility (S&P 500)',
    description:
      '3M implied volatility for the S&P 500 options complex. More persistent “medium-horizon” stress read than spot VIX alone.',
    category: 'primary_macro',
    family: 'volatility',
    region: 'US',
    role: 'driver',
    tags: ['equities', 'term_structure', 'risk_off'],
    defaultAutoSituation: 'extended',
    aliases: ['VIX3M'],
  },
  {
    id: 'SKEW',
    ticker: '^SKEW',
    label: 'SKEW — CBOE SKEW Index (tail risk pricing)',
    description:
      'SKEW: measures relative demand for downside protection vs upside. Complements VIX by highlighting crash insurance pricing rather than average implied vol.',
    category: 'primary_macro',
    family: 'volatility',
    region: 'US',
    role: 'driver',
    tags: ['tail_risk', 'crash_hedge', 'equities'],
    defaultAutoSituation: 'extended',
    aliases: ['SKEW'],
  },
  {
    id: 'GVZ',
    ticker: '^GVZ',
    label: 'GVZ — CBOE Gold Volatility Index',
    description:
      'Implied volatility index linked to gold options. Satellite read on uncertainty in the gold complex; not a substitute for spot gold (GC=F) as a macro driver.',
    category: 'primary_macro',
    family: 'volatility',
    region: 'Global',
    role: 'driver',
    tags: ['gold', 'commodities', 'satellite'],
    aliases: ['GVZ'],
  },
  {
    id: 'OVX',
    ticker: '^OVX',
    label: 'OVX — CBOE Crude Oil Volatility Index',
    description:
      'Implied volatility index linked to oil options. Useful for energy/geopolitical stress regimes; keep as a complement to flat-price oil (CL=/BZ=), not a redundant “second oil return”.',
    category: 'primary_macro',
    family: 'volatility',
    region: 'Global',
    role: 'driver',
    tags: ['oil', 'energy', 'satellite'],
    aliases: ['OVX'],
  },
  {
    id: 'VXN',
    ticker: '^VXN',
    label: 'VXN — NASDAQ-100 implied volatility',
    description: 'VXN: NASDAQ-100 implied volatility; complements VIX for growth/tech regimes.',
    category: 'primary_macro',
    family: 'volatility',
    region: 'US',
    role: 'driver',
    tags: ['tech', 'growth'],
    selectable: false,
  },
  {
    id: 'JNK',
    ticker: 'JNK',
    label: 'JNK — SPDR Bloomberg High Yield Bond ETF',
    description:
      'High-yield bond ETF alternative to HYG; proxy for credit risk premium and liquidity in sub-investment-grade credit.',
    category: 'risk_proxy',
    family: 'credit',
    region: 'US',
    role: 'proxy',
    tags: ['credit', 'risk_on'],
    selectable: false,
  },

  // —— US rates (drivers) ——
  {
    id: 'RATE_3M',
    ticker: '^IRX',
    label: 'RATE_3M — Treasury 3M (yield, ^IRX)',
    description:
      'Short-rate proxy via CBOE IRX; reflects near-term monetary policy expectations.',
    category: 'primary_macro',
    family: 'rates',
    region: 'US',
    role: 'driver',
    tags: ['fed', 'policy_rate'],
    defaultAutoSituation: 'extended',
    aliases: ['IRX'],
  },
  {
    id: 'RATE_2Y',
    ticker: 'FRED:DGS2',
    label: 'RATE_2Y — Treasury 2Y (FRED DGS2)',
    description:
      '2-Year Treasury constant maturity from FRED (DGS2); Yahoo has no direct 2Y Treasury ticker.',
    category: 'primary_macro',
    family: 'rates',
    region: 'US',
    role: 'driver',
    tags: ['fed', 'curve'],
    defaultAutoSituation: 'extended',
    aliases: ['FRED:DGS2'],
  },
  {
    id: 'RATE_5Y',
    ticker: '^FVX',
    label: 'RATE_5Y — Treasury 5Y (^FVX)',
    description: 'Reference ~5Y yield via CBOE FVX.',
    category: 'primary_macro',
    family: 'rates',
    region: 'US',
    role: 'driver',
    tags: ['curve', 'duration'],
    defaultAutoSituation: 'extended',
    aliases: ['FVX'],
  },
  {
    id: 'RATE_10Y',
    ticker: '^TNX',
    label: 'RATE_10Y — Treasury 10Y (^TNX)',
    description:
      'US 10Y reference yield; key anchor for relative value across risk assets and global duration.',
    category: 'primary_macro',
    family: 'rates',
    region: 'US',
    role: 'driver',
    tags: ['fed', 'duration', 'risk_free'],
    defaultAutoSituation: 'core',
    aliases: ['TNX'],
  },
  {
    id: 'RATE_30Y',
    ticker: '^TYX',
    label: 'RATE_30Y — Treasury 30Y (^TYX)',
    description: 'US long-end yield; key component of term premium and growth/inflation expectations.',
    category: 'primary_macro',
    family: 'rates',
    region: 'US',
    role: 'driver',
    tags: ['duration', 'term_premium'],
    defaultAutoSituation: 'extended',
    aliases: ['TYX'],
  },

  // —— Inflation / real rates (driver via ETF proxy) ——
  {
    id: 'TIPS',
    ticker: 'TIP',
    label: 'TIPS — US inflation-linked bonds (TIP ETF)',
    description:
      'TIP ETF (US inflation-linked bonds): proxy for real rates and inflation premia; not a replacement for an official inflation index (e.g., CPI).',
    category: 'primary_macro',
    family: 'rates',
    region: 'US',
    role: 'driver',
    tags: ['inflation', 'real_rates'],
    defaultAutoSituation: 'core',
    aliases: ['TIP'],
  },

  // —— Credit & duration (proxies) ——
  {
    id: 'GOVT_20Y',
    ticker: 'TLT',
    label: 'GOVT_20Y — long Treasury duration (TLT ETF)',
    description:
      'TLT ETF (long Treasuries): duration / long-rate sensitivity proxy; traded price, not a direct yield series.',
    category: 'risk_proxy',
    family: 'rates',
    region: 'US',
    role: 'proxy',
    tags: ['duration', 'rates'],
    defaultAutoSituation: 'extended',
    aliases: ['TLT'],
  },
  {
    id: 'HYG',
    ticker: 'HYG',
    label: 'HYG — high-yield credit (risk proxy)',
    description:
      'High-yield credit ETF: proxy for credit risk premia and carry appetite; not a “root” macro driver like a sovereign rate.',
    category: 'risk_proxy',
    family: 'credit',
    region: 'US',
    role: 'proxy',
    tags: ['credit', 'risk_on', 'spread'],
    defaultAutoSituation: 'core',
  },
  {
    id: 'LQD',
    ticker: 'LQD',
    label: 'LQD — US investment-grade credit (quality proxy)',
    description:
      'LQD ETF: USD investment-grade corporates; proxy for funding conditions for higher-quality issuers.',
    category: 'risk_proxy',
    family: 'credit',
    region: 'US',
    role: 'proxy',
    tags: ['credit', 'quality'],
    defaultAutoSituation: 'extended',
  },
  {
    id: 'JPN_BOND',
    ticker: 'DBJP',
    label: 'JPN_BOND — Japan bonds via ETF (DBJP)',
    description:
      // TODO: validate exact prospectus/holdings if you need precise legal copy; Yahoo's listing summary may differ by share class/region.
      'DBJP ETF: exposure to Japanese bonds (composition depends on the fund). Proxy for Japan rate conditions and yen-related flows; not a point-for-point JGB curve representation.',
    category: 'risk_proxy',
    family: 'rates',
    region: 'Japan',
    role: 'proxy',
    tags: ['duration', 'boj'],
    defaultAutoSituation: 'extended',
    aliases: ['DBJP'],
  },
  {
    id: 'EUR_BOND',
    ticker: 'IBND',
    label: 'EUR_BOND — international corporate credit (IBND ETF)',
    description:
      'SPDR Bloomberg International Corporate Bond (IBND): international corporate bond portfolio (not “Europe-only” and not sovereign-only). Use as a proxy for non-US global IG credit, not as an EUR sovereign yield.',
    category: 'risk_proxy',
    family: 'credit',
    region: 'Multi',
    role: 'proxy',
    tags: ['credit', 'international'],
    defaultAutoSituation: 'extended',
    aliases: ['IBND'],
  },
  {
    id: 'GER_BOND',
    ticker: 'BUNL',
    label: 'GER_BOND — Germany government bonds (BUNL ETF)',
    description:
      'iShares Germany Government Bond ETF (BUNL): proxy for German bund duration/sovereign exposure; traded price, not a spot Bund yield.',
    category: 'risk_proxy',
    family: 'rates',
    region: 'Europe',
    role: 'proxy',
    tags: ['duration', 'ecb'],
    defaultAutoSituation: 'extended',
    aliases: ['BUNL'],
  },
  {
    id: 'UK_BOND',
    ticker: 'IGOV',
    label: 'UK_BOND — international Treasuries (IGOV ETF)',
    description:
      'iShares International Treasury Bond ETF (IGOV): global ex-US sovereign exposure; not UK-only gilts.',
    category: 'risk_proxy',
    family: 'rates',
    region: 'Europe',
    role: 'proxy',
    tags: ['duration', 'gilts'],
    defaultAutoSituation: 'extended',
    aliases: ['IGOV'],
  },
  {
    id: 'CHINA_BOND',
    ticker: 'CBON',
    label: 'CHINA_BOND — China bonds (CBON ETF)',
    description:
      'VanEck China Bond ETF (CBON): onshore China bond exposure proxy; composition and regulation affect behavior vs a single yield.',
    category: 'risk_proxy',
    family: 'rates',
    region: 'Asia',
    role: 'proxy',
    tags: ['china', 'duration'],
    defaultAutoSituation: 'extended',
    aliases: ['CBON'],
  },

  // —— FX (drivers) ——
  {
    id: 'DXY',
    ticker: 'DX-Y.NYB',
    label: 'DXY — US Dollar Index (ICE)',
    description:
      'US Dollar Index (basket vs majors): proxy for global financial conditions and USD demand.',
    category: 'primary_macro',
    family: 'fx',
    region: 'US',
    role: 'driver',
    tags: ['usd', 'liquidity', 'risk_off'],
    defaultAutoSituation: 'core',
    aliases: ['DX-Y.NYB'],
  },
  {
    id: 'EUR_USD',
    ticker: 'EURUSD=X',
    label: 'EUR/USD',
    description: 'Euro vs US dollar; Europe–US relative cycle and cross-monetary policy dynamics.',
    category: 'primary_macro',
    family: 'fx',
    region: 'Europe',
    role: 'driver',
    tags: ['fx', 'ecb'],
    defaultAutoSituation: 'core',
    aliases: ['EURUSD=X'],
  },
  {
    id: 'USD_JPY',
    ticker: 'JPY=X',
    label: 'USD/JPY',
    description: 'Dollar–yen pair; carry, risk sentiment, and BoJ dynamics.',
    category: 'primary_macro',
    family: 'fx',
    region: 'Japan',
    role: 'driver',
    tags: ['fx', 'carry', 'risk_on'],
    defaultAutoSituation: 'core',
    aliases: ['JPY=X'],
  },
  {
    id: 'GBP_USD',
    ticker: 'GBPUSD=X',
    label: 'GBP/USD',
    description: 'British pound vs US dollar; UK cycle and rate differentials.',
    category: 'primary_macro',
    family: 'fx',
    region: 'Europe',
    role: 'driver',
    tags: ['fx', 'boe'],
    aliases: ['GBPUSD=X'],
  },
  {
    id: 'AUD_USD',
    ticker: 'AUDUSD=X',
    label: 'AUD/USD',
    description: 'Australian dollar vs USD; sensitive to commodities and cyclical risk.',
    category: 'primary_macro',
    family: 'fx',
    region: 'Multi',
    role: 'driver',
    tags: ['fx', 'commodities', 'risk_on'],
    aliases: ['AUDUSD=X'],
  },
  {
    id: 'USD_CNH',
    ticker: 'CNH=X',
    label: 'USD/CNH (offshore yuan)',
    description:
      'US dollar vs offshore Chinese yuan (CNH). Improves China/EM FX coverage beyond Shanghai, AUD/USD, and copper for portfolios with Asia exposure.',
    category: 'primary_macro',
    family: 'fx',
    region: 'China',
    role: 'driver',
    tags: ['fx', 'china', 'em', 'liquidity'],
    defaultAutoSituation: 'extended',
    aliases: ['CNH=X', 'USDCNH=X'],
  },

  // —— Commodities (cycle / inflation drivers) ——
  {
    id: 'GOLD',
    ticker: 'GC=F',
    label: 'GOLD — gold (COMEX futures)',
    description: 'Gold via GC=F; safe haven and real-rate / USD hedge proxy.',
    category: 'primary_macro',
    family: 'commodities',
    region: 'Global',
    role: 'driver',
    tags: ['inflation', 'safe_haven', 'real_rates'],
    defaultAutoSituation: 'core',
    aliases: ['GC=F'],
  },
  {
    id: 'SILVER',
    ticker: 'SI=F',
    label: 'SILVER — silver (futures)',
    description: 'Silver: dual monetary + industrial metal.',
    category: 'primary_macro',
    family: 'commodities',
    region: 'Global',
    role: 'driver',
    tags: ['inflation', 'industrial'],
    defaultAutoSituation: 'extended',
    aliases: ['SI=F'],
  },
  {
    id: 'OIL',
    ticker: 'CL=F',
    label: 'OIL — WTI crude (futures)',
    description: 'WTI crude oil; energy cost and global cycle proxy.',
    category: 'primary_macro',
    family: 'commodities',
    region: 'US',
    role: 'driver',
    tags: ['inflation', 'growth', 'energy'],
    defaultAutoSituation: 'core',
    aliases: ['CL=F'],
  },
  {
    id: 'BRENT',
    ticker: 'BZ=F',
    label: 'BRENT — Brent crude (futures)',
    description: 'Brent; global energy benchmark.',
    category: 'primary_macro',
    family: 'commodities',
    region: 'Global',
    role: 'driver',
    tags: ['inflation', 'energy'],
    defaultAutoSituation: 'extended',
    aliases: ['BZ=F'],
  },
  {
    id: 'NAT_GAS',
    ticker: 'NG=F',
    label: 'NAT_GAS — natural gas (futures)',
    description: 'US natural gas (Henry Hub proxy via NG=F); highly volatile; regional energy driver.',
    category: 'primary_macro',
    family: 'commodities',
    region: 'US',
    role: 'driver',
    tags: ['energy', 'inflation'],
    defaultAutoSituation: 'extended',
    aliases: ['NG=F', 'NATGAS'],
  },
  {
    id: 'COPPER',
    ticker: 'HG=F',
    label: 'COPPER — copper (futures)',
    description: '“Dr. Copper”: proxy for global industrial activity.',
    category: 'primary_macro',
    family: 'commodities',
    region: 'Global',
    role: 'driver',
    tags: ['growth', 'china', 'industrial'],
    defaultAutoSituation: 'core',
    aliases: ['HG=F'],
  },
  {
    id: 'WHEAT',
    ticker: 'ZW=F',
    label: 'WHEAT — wheat (futures)',
    description: 'CBOT wheat futures; agricultural / food-price pressure proxy.',
    category: 'primary_macro',
    family: 'commodities',
    region: 'Global',
    role: 'driver',
    tags: ['inflation', 'agriculture'],
    defaultAutoSituation: 'extended',
    aliases: ['ZW=F'],
  },
  {
    id: 'CORN',
    ticker: 'CORN',
    label: 'CORN — Teucrium Corn Fund (ETF)',
    description: 'CORN ETF as traded proxy for corn; matches backend MACRO_FACTORS.',
    category: 'primary_macro',
    family: 'commodities',
    region: 'US',
    role: 'driver',
    tags: ['inflation', 'agriculture'],
    defaultAutoSituation: 'extended',
    aliases: ['CORN'],
  },

  // —— Real assets / crypto (liquidity & rate-sensitive proxies) ——
  {
    id: 'REALESTATE',
    ticker: 'VNQ',
    label: 'REALESTATE — US REITs (VNQ ETF)',
    description:
      'VNQ: listed US REITs; proxy for real assets and sensitivity to long rates and real-estate credit spreads. Not a “pure” macro driver like a sovereign rate.',
    category: 'risk_proxy',
    family: 'real_assets',
    region: 'US',
    role: 'proxy',
    tags: ['rates', 'duration', 'real_assets'],
    defaultAutoSituation: 'extended',
    aliases: ['VNQ'],
  },
  {
    id: 'BITCOIN',
    ticker: 'BTC-USD',
    label: 'BITCOIN — BTC/USD',
    description:
      'Bitcoin in USD: risk/liquidity-sensitive asset; proxy for speculative appetite and financial conditions, not a traditional fundamental macro variable.',
    category: 'risk_proxy',
    family: 'crypto',
    region: 'Global',
    role: 'proxy',
    tags: ['risk_on', 'liquidity'],
    defaultAutoSituation: 'extended',
    aliases: ['BTC-USD'],
  },

  // —— Equity benchmarks ——
  {
    id: 'MSCI_WORLD_INDEX',
    ticker: '^990100-USD-STRD',
    label: 'MSCI World',
    description:
      'MSCI World in USD: global developed equity benchmark; primary reference for “global equity” portfolios.',
    category: 'benchmark',
    family: 'equities',
    region: 'Global',
    role: 'benchmark',
    tags: ['beta', 'global_equity'],
    benchmarkTier: 'primary_global',
    aliases: ['990100-USD-STRD'],
  },
  {
    id: 'SP500_INDEX',
    ticker: '^GSPC',
    label: 'S&P 500',
    description:
      'S&P 500: broad US benchmark. For MSCI World-like portfolios it often explains beta (US/tech weight); treat as market context, not a root macro driver.',
    category: 'benchmark',
    family: 'equities',
    region: 'US',
    role: 'benchmark',
    tags: ['beta', 'us_equity'],
    benchmarkTier: 'secondary_us_broad',
    aliases: ['GSPC', 'SP500'],
  },
  {
    id: 'NASDAQ_INDEX',
    ticker: '^IXIC',
    label: 'NASDAQ Composite',
    description:
      'NASDAQ Composite: benchmark with heavy growth / mega-cap tech weight; complementary benchmark for “growth” regimes.',
    category: 'benchmark',
    family: 'equities',
    region: 'US',
    role: 'benchmark',
    tags: ['growth', 'tech'],
    benchmarkTier: 'complementary_growth',
    aliases: ['IXIC'],
  },
  {
    id: 'DOW_INDEX',
    ticker: '^DJI',
    label: 'Dow Jones Industrial Average',
    description: 'DJIA: benchmark price-weighted de blue chips US.',
    category: 'benchmark',
    family: 'equities',
    region: 'US',
    role: 'benchmark',
    tags: ['beta', 'us_equity'],
    benchmarkTier: 'secondary_us_broad',
    aliases: ['DJI'],
  },
  {
    id: 'RUSSELL3000_INDEX',
    ticker: '^RUA',
    label: 'Russell 3000',
    description: 'Russell 3000: cobertura amplia del mercado US.',
    category: 'benchmark',
    family: 'equities',
    region: 'US',
    role: 'benchmark',
    tags: ['beta', 'us_equity'],
    benchmarkTier: 'secondary_us_broad',
    aliases: ['RUA'],
  },
  {
    id: 'IBEX35_INDEX',
    ticker: '^IBEX',
    label: 'IBEX 35',
    description: 'Spain equity benchmark index (EUR).',
    category: 'benchmark',
    family: 'equities',
    region: 'Europe',
    role: 'benchmark',
    tags: ['regional', 'beta'],
    benchmarkTier: 'regional',
    aliases: ['IBEX'],
  },
  {
    id: 'EUROSTOXX50_INDEX',
    ticker: '^STOXX50E',
    label: 'Euro Stoxx 50',
    description: 'Euro Stoxx 50: large caps eurozona.',
    category: 'benchmark',
    family: 'equities',
    region: 'Europe',
    role: 'benchmark',
    tags: ['regional', 'beta'],
    benchmarkTier: 'regional',
    aliases: ['STOXX50E'],
  },
  {
    id: 'NIKKEI225_INDEX',
    ticker: '^N225',
    label: 'Nikkei 225',
    description: 'Nikkei 225: benchmark Japón.',
    category: 'benchmark',
    family: 'equities',
    region: 'Japan',
    role: 'benchmark',
    tags: ['regional', 'beta'],
    benchmarkTier: 'regional',
    aliases: ['N225'],
  },
  {
    id: 'SHANGHAI_INDEX',
    ticker: '000001.SS',
    label: 'Shanghai Composite',
    description: 'Mainland China equity benchmark index (CNY).',
    category: 'benchmark',
    family: 'equities',
    region: 'China',
    role: 'benchmark',
    tags: ['regional', 'beta', 'em'],
    benchmarkTier: 'regional',
    aliases: ['000001.SS'],
  },
];

/** @type {DerivedFactorSpec[]} */
export const DERIVED_FACTOR_SPECS = [
  {
    id: 'YC_3M10Y',
    formula: 'diff',
    operands: ['RATE_10Y', 'RATE_3M'],
    label: 'Yield curve 10Y–3M',
    description: 'Short-vs-long spread; useful for cycle and recession-risk framing.',
    status: 'planned',
  },
  {
    id: 'CREDIT_RISK_HY_VS_TREASURY',
    formula: 'diff',
    operands: ['HYG', 'GOVT_20Y'],
    label: 'HYG vs long-duration Treasuries (proxy)',
    description: 'Difference in returns/log-returns aligned with a risky-vs-safe spread concept (implementation pending).',
    status: 'planned',
  },
  {
    id: 'CREDIT_HY_IG_RATIO',
    formula: 'ratio',
    operands: ['HYG', 'LQD'],
    label: 'HYG / LQD (credit risk appetite proxy)',
    description: 'Price ratio as a proxy for carry and relative stress HY vs IG.',
    status: 'planned',
  },
  {
    id: 'REAL_RATE_PROXY_TIPS',
    formula: 'diff',
    operands: ['RATE_10Y', 'TIPS'],
    label: 'Nominal 10Y vs TIPS (rough real-rate proxy)',
    description: 'Conceptual approximation; clean breakeven inflation requires proper conventions and series alignment.',
    status: 'planned',
  },
  {
    id: 'OIL_SPREAD',
    formula: 'diff',
    operands: ['BRENT', 'OIL'],
    label: 'Brent – WTI',
    description: 'Regional/quality spread between crude benchmarks.',
    status: 'planned',
  },
];

const byId = new Map(MACRO_FACTOR_DEFINITIONS.map((d) => [d.id, d]));

const aliasToCanonical = new Map();

function registerAlias(key, canonicalId) {
  if (!key) return;
  const k = String(key).trim().toLowerCase();
  if (!k) return;
  if (!aliasToCanonical.has(k)) aliasToCanonical.set(k, canonicalId);
}

MACRO_FACTOR_DEFINITIONS.forEach((def) => {
  registerAlias(def.id, def.id);
  tickerVariants(def.ticker).forEach((v) => registerAlias(v, def.id));
  (def.aliases || []).forEach((a) => {
    tickerVariants(a).forEach((v) => registerAlias(v, def.id));
  });
});

/**
 * @param {string} input
 * @returns {string | null}
 */
export function normalizeFactorId(input) {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (aliasToCanonical.has(lower)) return aliasToCanonical.get(lower);
  const noCaret = lower.replace(/^\^/, '');
  if (aliasToCanonical.has(noCaret)) return aliasToCanonical.get(noCaret);
  return null;
}

/**
 * @param {string} factor 
 * @returns {MacroFactorDefinition | null}
 */
export function getFactorMetadata(factor) {
  const id = normalizeFactorId(factor) || (byId.has(factor) ? factor : null);
  if (!id) return null;
  return byId.get(id) || null;
}

export function normalizeMacroTickerKey(t) {
  return String(t)
    .replace(/\^/g, '')
    .replace(/=/g, '')
    .replace(/-/g, '')
    .replace(/\./g, '')
    .toUpperCase();
}

export function extractPriceForFactorFromRow(row, factorId) {
  if (!row || typeof row !== 'object') return undefined;
  const meta = getFactorMetadata(factorId);
  if (!meta) return undefined;
  const candidates = [meta.ticker, ...(meta.aliases || [])].filter(Boolean);
  for (const c of candidates) {
    const v = row[c];
    if (v !== undefined && v !== null && !Number.isNaN(Number(v))) return Number(v);
  }
  for (const c of candidates) {
    const want = normalizeMacroTickerKey(c);
    const match = Object.keys(row).find((k) => normalizeMacroTickerKey(k) === want);
    if (match != null) {
      const v = row[match];
      if (v !== undefined && v !== null && !Number.isNaN(Number(v))) return Number(v);
    }
  }
  return undefined;
}

export function mergeMacroFactorPayloads(base, extra) {
  const out = { ...base };
  for (const d of Object.keys(extra || {})) {
    out[d] = { ...(out[d] || {}), ...(extra[d] || {}) };
  }
  return out;
}

export function payloadHasTickerSeries(formatted, ticker) {
  if (!formatted || !ticker) return false;
  const want = normalizeMacroTickerKey(ticker);
  for (const d of Object.keys(formatted)) {
    const row = formatted[d];
    if (!row || typeof row !== 'object') continue;
    for (const k of Object.keys(row)) {
      if (normalizeMacroTickerKey(k) === want && row[k] != null && !Number.isNaN(Number(row[k]))) return true;
    }
  }
  return false;
}

/**
 * @param {string} factor
 * @returns {FactorCategory | null}
 */
export function getFactorCategory(factor) {
  return getFactorMetadata(factor)?.category ?? null;
}

export const FACTOR_CATEGORY_LABEL_ES = {
  primary_macro: 'Primary macro driver',
  benchmark: 'Benchmark',
  risk_proxy: 'Risk proxy',
};

export function formatFactorCategoryLabel(category) {
  if (!category) return '—';
  return FACTOR_CATEGORY_LABEL_ES[category] || '—';
}

export const macro_factors_primary = MACRO_FACTOR_DEFINITIONS.filter(
  (d) => d.category === 'primary_macro',
).map((d) => d.id);

export const market_benchmarks = MACRO_FACTOR_DEFINITIONS.filter((d) => d.category === 'benchmark').map(
  (d) => d.id,
);

export const risk_proxies = MACRO_FACTOR_DEFINITIONS.filter((d) => d.category === 'risk_proxy').map((d) => d.id);

const isSelectable = (d) => d.selectable !== false;

export const MACRO_FACTORS_OPTIONS = MACRO_FACTOR_DEFINITIONS.filter(isSelectable).map((d) => ({
  value: d.id,
  ticker: d.ticker,
  label: d.label,
  category: d.category,
  family: d.family,
  region: d.region,
  role: d.role,
  tags: d.tags,
  benchmarkTier: d.benchmarkTier ?? null,
}));

export const MACRO_FACTORS_OPTIONS_GROUPED = [
  {
    groupId: 'primary_macro',
    groupLabel: 'Primary macro drivers (rates, FX, commodities, vol)',
    options: MACRO_FACTOR_DEFINITIONS.filter((d) => d.category === 'primary_macro' && isSelectable(d)).map((d) => ({
      value: d.id,
      ticker: d.ticker,
      label: d.label,
      category: d.category,
      family: d.family,
      region: d.region,
      role: d.role,
      tags: d.tags,
    })),
  },
  {
    groupId: 'benchmark',
    groupLabel: 'Market benchmarks (beta / regime)',
    options: MACRO_FACTOR_DEFINITIONS.filter((d) => d.category === 'benchmark' && isSelectable(d)).map((d) => ({
      value: d.id,
      ticker: d.ticker,
      label: d.label,
      category: d.category,
      family: d.family,
      region: d.region,
      role: d.role,
      tags: d.tags,
      benchmarkTier: d.benchmarkTier ?? null,
    })),
  },
  {
    groupId: 'risk_proxy',
    groupLabel: 'Risk proxies (ETFs / traded proxies)',
    options: MACRO_FACTOR_DEFINITIONS.filter((d) => d.category === 'risk_proxy' && isSelectable(d)).map((d) => ({
      value: d.id,
      ticker: d.ticker,
      label: d.label,
      category: d.category,
      family: d.family,
      region: d.region,
      role: d.role,
      tags: d.tags,
    })),
  },
];

export const MACRO_FACTOR_DESCRIPTIONS = Object.fromEntries(
  MACRO_FACTOR_DEFINITIONS.map((d) => [d.id, d.description]),
);

/**
 * @param {string} factor
 */
export function getFactorDescription(factor) {
  const meta = getFactorMetadata(factor);
  if (meta) return meta.description;
  return 'Macroeconomic factor';
}

export const SITUATION_AUTO_FACTORS_CORE = MACRO_FACTOR_DEFINITIONS.filter(
  (d) => d.defaultAutoSituation === 'core',
).map((d) => d.id);

export const SITUATION_AUTO_FACTORS_EXTENDED = MACRO_FACTOR_DEFINITIONS.filter(
  (d) => d.defaultAutoSituation === 'extended',
).map((d) => d.id);

export const SITUATION_AUTO_FACTORS = [
  ...new Set([...SITUATION_AUTO_FACTORS_CORE, ...SITUATION_AUTO_FACTORS_EXTENDED]),
];

export const SITUATION_YIELD_CURVE_FACTORS = [
  'RATE_3M',
  'RATE_2Y',
  'RATE_5Y',
  'RATE_10Y',
  'RATE_30Y',
];

export const SITUATION_GLOBAL_BOND_FACTORS = [
  'JPN_BOND',
  'EUR_BOND',
  'GER_BOND',
  'UK_BOND',
  'CHINA_BOND',
];

/** Credit ETFs + Treasury vol (MOVE) for Macro Situation; VIX/HYG are already in core auto factors. */
export const SITUATION_CREDIT_LIQUIDITY_FACTORS = ['LQD', 'JNK', 'MOVE'];

export const SITUATION_INFLATION_STRIP = ['SILVER', 'BRENT', 'BITCOIN'];

export const SITUATION_INFLATION_STRIP_FULL = [
  'GOLD',
  'SILVER',
  'OIL',
  'BRENT',
  'COPPER',
  'WHEAT',
  'CORN',
  'BITCOIN',
];

/**
 * @param {{ category?: FactorCategory, family?: FactorFamily, region?: FactorRegion }} filters
 * @returns {MacroFactorDefinition[]}
 */
export function listFactorsByFilter(filters = {}) {
  return MACRO_FACTOR_DEFINITIONS.filter((d) => {
    if (filters.category && d.category !== filters.category) return false;
    if (filters.family && d.family !== filters.family) return false;
    if (filters.region && d.region !== filters.region) return false;
    return true;
  });
}

/**
 * @returns {Record<string, MacroFactorDefinition[]>}
 */
export function groupFactorsByFamily() {
  /** @type {Record<string, MacroFactorDefinition[]>} */
  const out = {};
  MACRO_FACTOR_DEFINITIONS.forEach((d) => {
    if (!out[d.family]) out[d.family] = [];
    out[d.family].push(d);
  });
  return out;
}
