import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { formatPct, formatPp, getChangeColor } from '../../utils/dataFormatter';
import './Results.css';
import './MacroSituationDashboard.css';

const TENOR_ORDER = { '3M': 1, '2Y': 2, '5Y': 3, '10Y': 4, '30Y': 5 };

const byTenor = ([a], [b]) => (TENOR_ORDER[a] || 99) - (TENOR_ORDER[b] || 99);

const vixColor = (level) => level > 30 ? '#ef4444' : level > 20 ? '#f59e0b' : '#10b981';
const vixLabel = (level) => level > 30 ? 'HIGH' : level > 20 ? 'ELEVATED' : 'NORMAL';

const spreadColor = (s) => s < 0 ? '#ef4444' : s < 0.3 ? '#f59e0b' : '#10b981';
const spreadLabel = (s) => s < 0 ? 'INVERTED' : s < 0.3 ? 'FLAT' : 'NORMAL';

const inflationColor = (c) => c > 15 ? '#ef4444' : c > 5 ? '#f59e0b' : '#10b981';
const inflationLabel = (c) => c > 15 ? 'HIGH' : c > 5 ? 'MODERATE' : 'LOW';

const renderInsight = (body, conclusion) => {
  if (!body) return null;
  return (
    <div className="insight-callout">
      <span>{body}</span>
      {conclusion && <span className="insight-conclusion">{conclusion}</span>}
    </div>
  );
};

const renderSectionInsight = (fn) => {
  const { body, conclusion } = fn();
  return body ? renderInsight(body, conclusion) : null;
};

const MacroSituationResults = ({ data }) => {
  if (!data || (!data.summary && !data.yield_curve && !data.implied_yield_curve)) {
    return null;
  }

  const yieldCurve = data.yield_curve || {};
  const impliedCurve = data.implied_yield_curve || {};
  const inflation = data.inflation || {};
  const credit = data.credit || {};
  const globalBonds = data.global_bonds || {};
  const riskSentiment = data.risk_sentiment || {};
  const summary = data.summary || {};
  const overallRisk = summary.overall_risk || '';
  const riskFactors = summary.risk_factors || [];
  const riskScore = summary.risk_score || 0;
  const yieldCurveLevels = yieldCurve.levels || {};
  const yieldCurveSpreads = yieldCurve.spreads || {};
  const rateChanges = yieldCurve.rate_changes || {};
  const divergenceAnalysis = yieldCurve.divergence_analysis || {};
  const yieldCurveInterpretation = yieldCurve.interpretation || '';
  const spotRates = impliedCurve.spot_rates || {};
  const forwardRates = impliedCurve.forward_rates || {};
  const termPremium = impliedCurve.term_premium || {};
  const forwardVsSpot = impliedCurve.forward_vs_spot || {};
  const curveExpectations = impliedCurve.curve_expectations || '';
  const ratePathSignal = impliedCurve.rate_path_signal || '';
  const inflationPressure = inflation.inflation_pressure || 'N/A';
  const avgCommodityChange = inflation.avg_commodity_change;
  const commodityChanges = inflation.commodity_changes || {};
  const commodityNames = inflation.commodity_names || {};
  const vixLevel = credit.vix_level;
  const marketCondition = credit.market_condition;
  const hygLevel = credit.hyg_level;
  const lqdLevel = credit.lqd_level;
  const fearLevel = riskSentiment.fear_level || '';
  const dollarStrength = riskSentiment.dollar_strength || '';
  const safeHaven = riskSentiment.safe_haven || '';
  const dxyTrend1w = riskSentiment.dxy_trend_1w;
  const dxyTrend1m = riskSentiment.dxy_trend_1m;
  const dxyTrend3m = riskSentiment.dxy_trend_3m;
  const goldTrend1w = riskSentiment.gold_trend_1w;
  const goldTrend1m = riskSentiment.gold_trend_1m;
  const goldTrend3m = riskSentiment.gold_trend_3m;

  const getRiskColor = (risk) => {
    if (!risk) return '#94a3b8';
    const r = risk.toLowerCase();
    if (r.includes('low')) return '#10b981';
    if (r.includes('moderate')) return '#f59e0b';
    if (r.includes('high')) return '#ef4444';
    return '#94a3b8';
  };

  const getRiskBadgeClass = (risk) => {
    if (!risk) return 'badge-neutral';
    const r = risk.toLowerCase();
    if (r.includes('low')) return 'badge-success';
    if (r.includes('moderate')) return 'badge-warning';
    if (r.includes('high')) return 'badge-danger';
    return 'badge-neutral';
  };

  const getSignalBadge = (signal) => {
    if (!signal) return null;
    const s = signal.toUpperCase();
    let color = '#94a3b8';
    if (s.includes('HAWKISH')) color = '#ef4444';
    if (s.includes('DOVISH')) color = '#10b981';
    if (s.includes('NEUTRAL')) color = '#64748b';
    return (
      <span className="signal-badge" style={{ background: color + '20', color, borderColor: color }}>
        {signal}
      </span>
    );
  };

  const yieldCurveChartData = Object.entries(spotRates)
    .filter(([_, rate]) => rate != null && !isNaN(rate))
    .sort(byTenor)
    .map(([tenor, rate]) => ({ tenor, spot: parseFloat(rate) || 0 }));

  const spotTenors = yieldCurveChartData.map(d => d.tenor);
  const consecutiveForwards = {};
  for (let i = 0; i < spotTenors.length - 1; i++) {
    const key = `${spotTenors[i]}→${spotTenors[i + 1]}`;
    if (forwardRates[key] != null) {
      consecutiveForwards[spotTenors[i + 1]] = parseFloat(forwardRates[key]) || 0;
    }
  }
  yieldCurveChartData.forEach(item => {
    if (consecutiveForwards[item.tenor] !== undefined) {
      item.forward = consecutiveForwards[item.tenor];
    }
  });

  const commodityChartData = Object.entries(commodityChanges)
    .map(([key, value]) => ({
      name: commodityNames[key] || key,
      change: typeof value === 'number' ? value : 0,
    }))
    .sort((a, b) => b.change - a.change);

  const globalBondsData = Object.entries(globalBonds).map(([region, bondData]) => ({
    region,
    level: bondData?.level || 0,
    unit: bondData?.unit || (bondData?.level < 20 ? 'yield' : 'price'),
    change1m: bondData?.change_1m ?? 0,
    change1y: bondData?.change_1y ?? 0,
  }));

  const spread10y2y = yieldCurveSpreads['10Y-2Y'];
  const vixPct = vixLevel ? Math.min(vixLevel / 50, 1) : 0;

  const getYieldCurveInsight = () => {
    const spread30y10y = yieldCurveSpreads['30Y-10Y'];
    const fwdDiffs = Object.values(forwardVsSpot).filter(v => v != null);
    const avgFwdDiff = fwdDiffs.length > 0 ? fwdDiffs.reduce((a, b) => a + b, 0) / fwdDiffs.length : 0;
    const rate2y = yieldCurveLevels['2Y'];
    const rate10y = yieldCurveLevels['10Y'];
    if (spread10y2y == null) return { body: null };

    let body = '';
    let conclusion = '';

    if (spread10y2y < 0) {
      body = `The 10Y-2Y spread is inverted at ${formatPp(spread10y2y)}, a condition that has preceded every US recession since 1970 with a median lead of 12-18 months. With the 2Y at ${rate2y != null ? rate2y.toFixed(2) + '%' : 'N/A'} and the 10Y at ${rate10y != null ? rate10y.toFixed(2) + '%' : 'N/A'}, the short end reflects sustained Fed tightening expectations while the long end discounts a weaker growth trajectory.`;
      if (fwdDiffs.length > 0 && avgFwdDiff < 0) {
        conclusion = `Implication: The forward curve confirms expectations of policy easing — the market is pricing rate cuts but recession risk remains elevated. Duration-sensitive assets may benefit from an eventual pivot, but credit risk requires caution.`;
      } else {
        conclusion = `Implication: Despite inversion, forwards above spot suggest the market expects rates to stay higher for longer before any easing cycle — a stagflationary risk scenario that challenges both bonds and equities.`;
      }
    } else if (spread10y2y < 0.3) {
      body = `The curve is flat with a 10Y-2Y spread of ${formatPp(spread10y2y)}, indicating the bond market sees limited growth upside at current rate levels. The 10Y at ${rate10y != null ? rate10y.toFixed(2) + '%' : 'N/A'} prices in only a modest term premium over the 2Y (${rate2y != null ? rate2y.toFixed(2) + '%' : 'N/A'}), suggesting investors expect the policy rate to converge toward neutral without significant economic acceleration.`;
      conclusion = `Implication: A flat curve often signals a late-cycle environment. Historically, the transition from flat to inverted has occurred within 6-12 months in tightening cycles. Defensive positioning may be warranted.`;
    } else {
      body = `The curve maintains a healthy slope with a 10Y-2Y spread at ${formatPp(spread10y2y)}${spread30y10y != null ? ` and 30Y-10Y at ${formatPp(spread30y10y)}` : ''}. This upward-sloping structure is consistent with positive real growth expectations and an adequately priced term premium. The 10Y at ${rate10y != null ? rate10y.toFixed(2) + '%' : 'N/A'} reflects the market's equilibrium view of neutral rates plus inflation compensation.`;
      if (fwdDiffs.length > 0 && avgFwdDiff > 0.3) {
        conclusion = `Implication: Forwards pricing above spot by ${avgFwdDiff.toFixed(2)}pp on average suggest the market sees additional tightening ahead. The positive slope may narrow if short rates continue rising faster than long rates.`;
      } else {
        conclusion = `Implication: A normal curve with stable forwards is supportive for risk assets and credit — financial conditions appear constructive for growth.`;
      }
    }
    return { body, conclusion };
  };

  const getForwardRatesInsight = () => {
    const entries = Object.entries(forwardVsSpot).filter(([_, v]) => v != null);
    if (entries.length === 0) return { body: null };
    const hawkish = entries.filter(([_, v]) => v > 0.3);
    const dovish = entries.filter(([_, v]) => v < -0.3);
    const neutral = entries.filter(([_, v]) => Math.abs(v) <= 0.3);
    const tp10y = termPremium['10Y'];
    const tp30y = termPremium['30Y'];

    let body = '';
    let conclusion = '';

    if (hawkish.length > dovish.length) {
      const maxHawkish = entries.reduce((max, [k, v]) => v > (max[1] || -Infinity) ? [k, v] : max, ['', -Infinity]);
      body = `The implied forward curve signals a hawkish bias: ${hawkish.length} of ${entries.length} segments price above current spot rates, with the most pronounced divergence in the ${maxHawkish[0]} segment (${formatPp(maxHawkish[1])} above spot). This indicates the market expects the cumulative path of policy rates to remain elevated, either through additional hikes or by holding rates restrictive for an extended period.`;
    } else if (dovish.length > hawkish.length) {
      body = `The forward curve leans dovish with ${dovish.length} of ${entries.length} segments pricing below spot. The market is embedding rate-cut expectations into the term structure, suggesting either an expected economic deceleration or a view that current policy rates are overly restrictive relative to the neutral rate.`;
    } else {
      body = `Forwards are broadly aligned with spot across ${entries.length} segments (${neutral.length} neutral). The absence of strong directional conviction suggests the market considers current rate levels close to equilibrium — neither expecting significant tightening nor easing in the near term.`;
    }

    if (tp10y != null || tp30y != null) {
      const tpParts = [];
      if (tp10y != null) tpParts.push(`10Y: ${formatPp(tp10y)}`);
      if (tp30y != null) tpParts.push(`30Y: ${formatPp(tp30y)}`);
      if (tp10y != null && tp10y < -0.1) {
        conclusion = `Term premium is compressed (${tpParts.join(', ')}), reflecting strong institutional demand for duration — potentially from pension funds, central bank holdings, or flight-to-quality flows. This distorts the signal from raw yield levels and makes the curve appear flatter than underlying rate expectations would imply.`;
      } else if (tp10y != null && tp10y > 0.2) {
        conclusion = `Term premium is elevated (${tpParts.join(', ')}), indicating investors demand meaningful compensation for holding duration risk. This is consistent with elevated inflation uncertainty, fiscal supply concerns, or reduced central bank balance sheet support.`;
      } else {
        conclusion = `Term premium is near neutral (${tpParts.join(', ')}), suggesting the market prices duration risk in line with historical norms. The yield curve can be interpreted largely at face value without significant distortion.`;
      }
    }
    return { body, conclusion };
  };

  const getRateChangesInsight = () => {
    const change2y = rateChanges['2Y'];
    const change10y = rateChanges['10Y'];
    const change30y = rateChanges['30Y'];
    if (!change2y && !change10y) return { body: null };

    const short3m = change2y?.['3m'];
    const long3m = change10y?.['3m'];
    const short1y = change2y?.['1y'];
    const long1y = change10y?.['1y'];
    const long30y_3m = change30y?.['3m'];

    let body = '';
    let conclusion = '';

    if (short3m != null && long3m != null) {
      const div3m = long3m - short3m;
      if (div3m > 0.5) {
        body = `A significant bear steepening is underway: the 10Y has risen ${formatPp(long3m)} over 3 months while the 2Y moved ${formatPp(short3m)}${long30y_3m != null ? `, with the 30Y at ${formatPp(long30y_3m)}` : ''}. This divergence of ${formatPp(div3m)} indicates the long end is repricing higher — either due to rising inflation expectations, increased Treasury supply, or term premium decompression. Bear steepeners are historically associated with periods where fiscal expansion pressures outpace monetary accommodation.`;
      } else if (div3m < -0.5) {
        body = `A bear flattening is in play: the 2Y has risen ${formatPp(short3m)} while the 10Y moved only ${formatPp(long3m)} over 3 months. Short rates are being pulled higher by hawkish monetary policy repricing, while the long end remains anchored by recession expectations. This flattening pattern is characteristic of late-stage tightening cycles where the market begins pricing the terminal rate above neutral.`;
      } else {
        body = `Rates have shifted largely in parallel over the past 3 months (2Y: ${formatPp(short3m)}, 10Y: ${formatPp(long3m)}, divergence: ${formatPp(div3m)}). This uniform move suggests a broad reassessment of the neutral rate level rather than a change in curve shape or relative expectations between short and long-term growth.`;
      }
    }

    if (short1y != null && long1y != null) {
      const div1y = long1y - short1y;
      if (short1y < -0.5 && long1y > 0.3) {
        conclusion = `Year-over-year perspective: The 2Y has fallen ${formatPp(short1y)} while the 10Y has risen ${formatPp(long1y)}, producing a ${formatPp(div1y)} steepening. This major structural shift reflects a transition from front-end tightening to back-end inflation-premium repricing — the market is shifting from "how high" to "how long" on rates.`;
      } else if (short1y > 0.5 && long1y < 0) {
        conclusion = `Year-over-year, the curve has flattened aggressively (2Y: ${formatPp(short1y)}, 10Y: ${formatPp(long1y)}). The short end is pricing cumulative policy tightening while the long end reflects growing skepticism about economic resilience — a configuration that often precedes cyclical turning points.`;
      } else if (Math.abs(div1y) > 0.3) {
        conclusion = `The 12-month trend shows a ${div1y > 0 ? 'steepening' : 'flattening'} of ${formatPp(Math.abs(div1y))} (2Y: ${formatPp(short1y)}, 10Y: ${formatPp(long1y)}), indicating a gradual but persistent shift in term structure expectations.`;
      }
    }
    return { body, conclusion };
  };

  const getRateChangesTakeaway = () => {
    const tips = [];
    const tenors = Object.keys(rateChanges);
    if (tenors.length === 0) return [];

    // 1. Overall direction
    const changes1m = tenors.map(t => rateChanges[t]?.['1m']).filter(v => v != null);
    const allFalling1m = changes1m.length > 0 && changes1m.every(v => v < 0);
    const allRising1m = changes1m.length > 0 && changes1m.every(v => v > 0);

    if (allFalling1m) {
      tips.push(<><strong>Rates declining across the curve:</strong> Falling yields typically benefit existing bondholders (price appreciation) and signal potential easing expectations. Duration-sensitive positions are being rewarded.</>);
    } else if (allRising1m) {
      tips.push(<><strong>Rates rising across the curve:</strong> Rising yields erode bond prices and increase borrowing costs. Portfolios with long duration exposure face headwinds — consider reducing duration or hedging with short-duration instruments.</>);
    }

    const short1y = rateChanges['5Y']?.['1y'];
    const long1y = rateChanges['30Y']?.['1y'];
    if (short1y != null && long1y != null) {
      const diff = long1y - short1y;
      if (diff > 0.2) {
        tips.push(<><strong>Curve steepening (1Y trend):</strong> The long end (30Y: {formatPp(long1y)}) has moved more than the belly (5Y: {formatPp(short1y)}). A steepening curve favors short-duration bonds over long-duration, and can signal rising inflation expectations or fiscal pressure.</>);
      } else if (diff < -0.2) {
        tips.push(<><strong>Curve flattening (1Y trend):</strong> The 5Y ({formatPp(short1y)}) has outpaced the 30Y ({formatPp(long1y)}). A flattening curve may signal tighter monetary policy expectations or slowing growth, and historically precedes economic slowdowns.</>);
      }
    }

    const changes1y = tenors.map(t => rateChanges[t]?.['1y']).filter(v => v != null);
    const maxAbsChange = Math.max(...changes1y.map(Math.abs));
    if (maxAbsChange > 0.5) {
      tips.push(<><strong>Significant annual shift detected ({formatPp(maxAbsChange)} max):</strong> Moves of this magnitude substantially impact bond valuations, mortgage rates, and corporate financing costs. Re-evaluate fixed income allocations and duration targets.</>);
    }

    tips.push(<><strong>How to read these changes:</strong> Negative values mean yields have fallen (bond prices rose), positive values mean yields have risen (bond prices fell). Changes are expressed in percentage points (pp).</>);

    return tips;
  };

  const getInflationInsight = () => {
    if (commodityChartData.length === 0) return { body: null };
    const goldChange = commodityChanges['GOLD'];
    const oilChange = commodityChanges['OIL'];
    const copperChange = commodityChanges['COPPER'];
    const silverChange = commodityChanges['SILVER'];

    let body = '';
    let conclusion = '';

    if (avgCommodityChange != null) {
      const risingCount = commodityChartData.filter(c => c.change > 5).length;
      const fallingCount = commodityChartData.filter(c => c.change < -5).length;

      if (avgCommodityChange > 15) {
        body = `Commodity prices are up ${formatPct(avgCommodityChange)} on average over 12 months, with ${risingCount} of ${commodityChartData.length} components showing gains above 5%. `;
      } else if (avgCommodityChange > 5) {
        body = `Commodities show moderate inflationary pressure at ${formatPct(avgCommodityChange)} average, with ${risingCount} rising and ${fallingCount} declining significantly. `;
      } else if (avgCommodityChange < -5) {
        body = `Broad commodity weakness at ${formatPct(avgCommodityChange)} average, with ${fallingCount} of ${commodityChartData.length} components declining sharply. `;
      } else {
        body = `Commodity prices are largely range-bound (${formatPct(avgCommodityChange)} average), offering limited signal on inflationary dynamics. `;
      }
    }

    if (goldChange != null && oilChange != null && copperChange != null) {
      const goldVsCopper = goldChange - (copperChange || 0);
      if (goldChange > 15 && goldVsCopper > 15) {
        body += `The gold/copper divergence is notable: gold at ${formatPct(goldChange)} versus copper at ${formatPct(copperChange)}. Gold outperformance relative to industrial metals typically signals that inflationary pressure is monetary rather than demand-driven — investors are hedging against currency debasement and policy uncertainty rather than pricing in economic overheating.`;
        if (oilChange < 5) {
          conclusion = `With oil flat-to-negative (${formatPct(oilChange)}), real-economy demand appears contained. The inflation mix is dominated by monetary/geopolitical factors rather than supply-demand imbalances — this argues for persistent but not accelerating core inflation.`;
        } else {
          conclusion = `However, oil at ${formatPct(oilChange)} adds a cost-push dimension. The combination of gold-led monetary inflation and energy cost pressure creates a challenging environment for central banks — tightening combats demand but not supply-side shocks.`;
        }
      } else if (copperChange > 10 && oilChange > 10) {
        body += `Both copper (${formatPct(copperChange)}) and oil (${formatPct(oilChange)}) are significantly positive, pointing to genuine demand-pull dynamics. Copper, often called "Dr. Copper" for its economic sensitivity, confirms real industrial demand rather than purely speculative or monetary-driven price action.`;
        conclusion = `This demand-led inflation profile is more responsive to monetary tightening. If the central bank maintains restrictive policy, these pressures should moderate — but the risk is that premature easing reignites the cycle.`;
      } else if (oilChange < -10) {
        body += `Oil weakness (${formatPct(oilChange)}) is a significant disinflationary force. Energy accounts for ~7% of CPI directly and influences transportation and production costs throughout the economy. ${goldChange > 10 ? `However, gold at ${formatPct(goldChange)} suggests investors aren't pricing in deflation — rather, a demand slowdown coupled with monetary uncertainty.` : ''}`;
        conclusion = `Falling energy prices create room for central banks to ease without triggering headline inflation — historically, oil-driven disinflation has been the single largest contributor to CPI moderation in most easing cycles.`;
      }
    }

    return { body: body.trim() || null, conclusion };
  };

  const getCreditInsight = () => {
    if (hygLevel == null && lqdLevel == null) return { body: null };
    let body = '';
    let conclusion = '';

    if (vixLevel != null) {
      if (vixLevel > 30) {
        body = `Implied volatility is elevated with VIX at ${vixLevel.toFixed(1)}, indicating the options market prices significant tail-risk protection. At these levels, hedging demand typically exceeds 2 standard deviations above the long-run mean (~19), suggesting institutional portfolios are actively reducing risk or purchasing downside protection.`;
        conclusion = `Historically, VIX above 30 has been a contrarian signal on 3-6 month horizons — but the path to normalization often involves further drawdowns before mean reversion. Credit spreads tend to lead VIX during stress episodes, so HYG and LQD warrant close monitoring.`;
      } else if (vixLevel > 20) {
        body = `VIX at ${vixLevel.toFixed(1)} sits above the long-run equilibrium (~19) but below panic territory. This "nervous" zone often reflects specific catalysts — earnings uncertainty, geopolitical developments, or policy ambiguity — rather than systemic stress. Credit ETFs at HYG $${hygLevel != null ? hygLevel.toFixed(2) : 'N/A'} and LQD $${lqdLevel != null ? lqdLevel.toFixed(2) : 'N/A'} should be monitored for divergences from equity vol.`;
        conclusion = `In this regime, credit spreads tend to widen modestly but remain orderly. The risk is an exogenous shock that pushes VIX above 30 and triggers forced selling in credit markets.`;
      } else {
        body = `VIX at ${vixLevel.toFixed(1)} reflects a low-volatility regime consistent with complacent positioning. The cost of downside protection is cheap, which historically invites leveraged carry strategies and compressed risk premiums. Credit markets appear healthy with HYG at $${hygLevel != null ? hygLevel.toFixed(2) : 'N/A'} and LQD at $${lqdLevel != null ? lqdLevel.toFixed(2) : 'N/A'}.`;
        conclusion = `While low VIX is constructive for carry trades and credit, prolonged periods below 15 have historically preceded vol regime shifts. The cheap cost of hedging makes tactical put protection attractive at these levels.`;
      }
    }
    return { body: body || null, conclusion };
  };

  const getSentimentInsight = () => {
    let body = '';
    let conclusion = '';

    if (dxyTrend3m != null && goldTrend3m != null) {

      if (dxyTrend3m > 3) {
        body = `The US dollar has strengthened ${formatPct(dxyTrend3m)} over 3 months${dxyTrend1m != null ? ` (${formatPct(dxyTrend1m)} in the last month)` : ''}, tightening global financial conditions. Dollar strength acts as a de facto monetary tightening for the rest of the world — it raises the cost of dollar-denominated debt servicing, pressures EM currencies, and compresses commodity prices in local-currency terms.`;
      } else if (dxyTrend3m < -3) {
        body = `The dollar has weakened ${formatPct(dxyTrend3m)} over 3 months${dxyTrend1m != null ? ` (${formatPct(dxyTrend1m)} recently)` : ''}, easing global liquidity conditions. A weaker dollar historically supports EM assets, commodity exporters, and multinational earnings — it functions as a tailwind for global risk appetite.`;
      } else {
        body = `The dollar is range-bound (3M: ${formatPct(dxyTrend3m)}), providing a neutral backdrop for global financial conditions.`;
      }

      if (goldTrend3m > 3 && dxyTrend3m > 1) {
        body += ` Notably, gold has rallied ${formatPct(goldTrend3m)} alongside dollar strength — a historically unusual combination that signals deep structural uncertainty. When both safe havens appreciate simultaneously, it typically reflects central bank reserve diversification, geopolitical risk hedging, or a loss of confidence in traditional risk-free assets.`;
        conclusion = `This gold-dollar co-movement is one of the strongest signals of systemic risk repricing. It was last observed during the 2019-2020 pre-COVID period and the 2022 geopolitical escalation. Portfolio implications: reduce directional exposure and consider real-asset allocation.`;
      } else if (goldTrend3m > 5 && dxyTrend3m < -1) {
        body += ` Gold's ${formatPct(goldTrend3m)} rally with a weaker dollar is the textbook monetary-debasement trade. Investors are hedging against the erosion of fiat purchasing power, which is consistent with expectations of prolonged negative real rates or fiscal dominance.`;
        conclusion = `This configuration is historically bullish for real assets (gold, real estate, TIPS) and suggests inflation expectations are becoming unanchored from central bank targets.`;
      } else if (goldTrend3m < -3 && dxyTrend3m > 1) {
        body += ` Gold is declining (${formatPct(goldTrend3m)}) while the dollar strengthens — a classic risk-on rotation where investors sell defensive hedges and move into higher-yielding assets. This suggests confidence in the economic outlook and faith in central bank credibility.`;
        conclusion = `Falling gold with a strong dollar is consistent with a "Goldilocks" narrative. However, the absence of hedging demand also means portfolios are more exposed to left-tail events.`;
      } else if (goldTrend3m < -3) {
        conclusion = `Gold retreating at ${formatPct(goldTrend3m)} signals diminishing safe-haven demand. Risk appetite is recovering and investors see less need for inflation or crisis insurance.`;
      }
    }
    return { body: body.trim() || null, conclusion };
  };

  const getOverallRecommendations = () => {
    const groups = [];
    const buy = [];
    if (riskScore >= 7) {
      buy.push({ title: 'Move to defensive sectors', desc: 'Utilities, healthcare, and consumer staples tend to fall less when markets drop. Example: XLU, XLV, XLP.' });
      buy.push({ title: 'Park cash in short-term bonds', desc: 'T-Bills and money-market funds (e.g., SHV, BIL) give you yield with almost no price risk while you wait for better opportunities.' });
    } else if (riskScore >= 4) {
      buy.push({ title: 'Stick with quality companies', desc: 'Look for companies with low debt, strong cash flow, and steady earnings — they hold up better when conditions are uncertain.' });
    } else {
      buy.push({ title: 'Lean into growth', desc: 'With low risk, growth stocks, small-caps, and cyclical sectors (tech, industrials, financials) have room to run.' });
    }
    if (ratePathSignal?.toUpperCase().includes('HAWKISH')) {
      buy.push({ title: 'Prefer floating-rate bonds', desc: 'When rates are expected to stay high or rise, floating-rate instruments (e.g., FLOT, BKLN) adjust upward and protect your income.' });
    } else if (ratePathSignal?.toUpperCase().includes('DOVISH')) {
      buy.push({ title: 'Lock in current bond yields', desc: 'If rate cuts are coming, today\'s yields on longer bonds will look attractive in hindsight. Consider extending to 5–10Y maturities.' });
    }
    if (avgCommodityChange != null && avgCommodityChange > 15) {
      buy.push({ title: 'Add inflation protection', desc: `Commodities are up ${formatPct(avgCommodityChange)} this year. TIPS, gold (GLD), or broad commodity ETFs (DJP, GSG) help your portfolio keep up with rising prices.` });
    }
    if (dxyTrend3m != null && dxyTrend3m < -3) {
      buy.push({ title: 'Look at international markets', desc: 'A weakening dollar boosts returns on foreign investments. EM equities (EEM, VWO) and international bonds benefit.' });
    }

    if (riskScore >= 5) {
      buy.push({ title: 'Consider dividend stocks', desc: 'Companies with long track records of paying dividends (e.g., VIG, SCHD, HDV) provide steady income even when prices are falling — and tend to be more resilient.' });
    } else {
      buy.push({ title: 'Reinvest dividends', desc: 'In favorable conditions, dividend reinvestment compounds returns faster. ETFs like VIG or SCHD combine growth with income.' });
    }

    if (avgCommodityChange != null && avgCommodityChange > 5 && riskScore >= 4) {
      buy.push({ title: 'Add real assets (REITs, infrastructure)', desc: 'Real estate (VNQ) and infrastructure (IGF) generate income tied to real economic activity and often keep pace with inflation better than nominal bonds.' });
    }

    if (riskScore < 4) {
      buy.push({ title: 'Stay invested in broad indices', desc: 'In constructive environments, simple broad-market ETFs (SPY, VTI, QQQ) capture upside with low fees. Don\'t overthink it — time in the market beats timing the market.' });
    }

    if (riskScore < 5 && hygLevel != null) {
      buy.push({ title: 'Explore investment-grade credit', desc: 'Corporate bonds (LQD, VCIT) offer higher yields than Treasuries with moderate risk. In low-stress environments, the extra spread is worth it.' });
    }

    if (buy.length > 0) groups.push({ category: 'What to Buy / Hold', items: buy });

    const sell = [];
    if (riskScore >= 7) {
      sell.push({ title: 'Trim speculative positions', desc: 'Unprofitable tech, meme stocks, and highly leveraged companies are the first to get hit in risk-off environments.' });
      sell.push({ title: 'Reduce long-duration bonds', desc: 'Long-term bonds (20Y+) lose the most value when rates stay elevated. Move to shorter maturities (1–3Y).' });
    } else if (riskScore >= 4) {
      sell.push({ title: 'Don\'t chase momentum', desc: 'In mixed environments, what\'s been going up can reverse quickly. Take partial profits on extended winners.' });
    }
    if (dxyTrend3m != null && dxyTrend3m > 3) {
      sell.push({ title: 'Be cautious with international exposure', desc: 'A strong dollar eats into foreign returns. If you hold EM or international stocks without currency hedging, consider reducing.' });
    }
    if (spread10y2y != null && spread10y2y < 0) {
      sell.push({ title: 'Watch out — curve is inverted', desc: `The 10Y yield is below the 2Y (${formatPp(spread10y2y)}). This has preceded every US recession in the last 50 years. Reduce exposure to economically sensitive sectors.` });
    }

    sell.push({ title: 'Avoid concentration risk', desc: 'No single position should exceed 5–10% of your portfolio. If one stock or sector dominates, a single bad event can wipe out months of gains.' });

    if (riskScore >= 5) {
      sell.push({ title: 'Reduce or eliminate leverage', desc: 'Margin and leveraged ETFs amplify losses in volatile markets. If conditions deteriorate, margin calls force you to sell at the worst time.' });
    }

    if (riskScore >= 6) {
      sell.push({ title: 'Trim illiquid positions', desc: 'Small-cap stocks, thinly traded ETFs, and private holdings are harder to exit in a selloff. Reduce before you need to — not during a panic.' });
    }

    if (avgCommodityChange != null && avgCommodityChange > 15 && riskScore >= 5) {
      sell.push({ title: 'Don\'t overpay for "safe" assets', desc: 'When everyone rushes to gold, TIPS, or defensive stocks, these can become overvalued too. Buy protection at a fair price, not at any price.' });
    }

    if (sell.length > 0) groups.push({ category: 'What to Reduce / Avoid', items: sell });

    const protect = [];

    if (riskScore >= 7) {
      protect.push({ title: 'Keep 10–20% in cash', desc: 'Cash is not dead weight — it\'s dry powder. Having it ready lets you buy quality assets at a discount if markets sell off.' });
    } else if (riskScore >= 4) {
      protect.push({ title: 'Keep 5–10% in cash', desc: 'A small cash buffer gives you flexibility to act on opportunities or absorb short-term losses without forced selling.' });
    }

    if (riskScore >= 7) {
      protect.push({ title: 'Buy protective puts', desc: 'Put options on SPY or QQQ limit your downside. A 5% out-of-the-money put costs little but can save a lot in a sharp selloff.' });
      protect.push({ title: 'Consider a collar strategy', desc: 'Buy a put and sell a call on the same stock. You cap your upside but protect the downside at zero net cost — ideal for large concentrated positions.' });
    }

    if (vixLevel != null && vixLevel > 25) {
      protect.push({ title: `Volatility is high (VIX: ${vixLevel.toFixed(1)})`, desc: 'Options are expensive right now. Instead of buying puts, sell covered calls on stocks you already hold — you collect premium and reduce your effective cost basis.' });
    } else if (vixLevel != null && vixLevel < 15) {
      protect.push({ title: `Volatility is low (VIX: ${vixLevel.toFixed(1)})`, desc: 'Insurance is cheap right now. Buy protective puts on your largest positions — when VIX is this low, the cost is minimal and the payoff in a spike is significant.' });
    }

    if (riskScore >= 5) {
      protect.push({ title: 'Diversify across uncorrelated assets', desc: 'Bonds, gold, and alternatives (managed futures, REITs) tend to move differently from stocks. A 60/40 or 50/30/20 split reduces portfolio-level drawdowns.' });
    }

    if (dxyTrend3m != null && goldTrend3m != null && goldTrend3m > 5 && dxyTrend3m > 1) {
      protect.push({ title: 'Gold is signaling fear', desc: 'When both gold and the dollar rise together, it means investors are genuinely scared. Add 5–10% in gold (GLD, IAU) — it has historically held value or rallied during crises.' });
    } else if (riskScore >= 6) {
      protect.push({ title: 'Add gold as a safe haven', desc: 'Gold (GLD, IAU) typically holds value or rises during market stress. A 5–10% allocation acts as portfolio insurance without a maturity date.' });
    }

    if (riskScore >= 4) {
      protect.push({ title: 'Rebalance quarterly', desc: 'As markets move, your portfolio drifts from target allocations. Rebalancing forces you to sell winners (high) and buy laggards (low) — a systematic way to buy low and sell high.' });
    }

    if (riskScore >= 4) {
      protect.push({ title: 'Watch credit spreads closely', desc: 'If the gap between junk bonds (HYG) and investment-grade (LQD) starts widening fast, it\'s often the first sign of real trouble — even before equities react. Set alerts.' });
    }

    protect.push({ title: 'Track M2 money supply', desc: 'M2 measures total money circulating in the economy. When M2 expands, more liquidity flows into risk assets — stocks, real estate, and crypto tend to rise. When M2 contracts, asset prices face headwinds. Track US M2 (FRED: M2SL) and global M2 for early warning signals.' });

    if (protect.length > 0) groups.push({ category: 'How to Protect Your Portfolio', items: protect });

    return groups;
  };

  const getGlobalBondsInsight = () => {
    if (globalBondsData.length === 0) return { body: null };
    const rising1m = globalBondsData.filter(b => b.change1m > 2);
    const falling1m = globalBondsData.filter(b => b.change1m < -2);
    const rising1y = globalBondsData.filter(b => b.change1y > 5);
    const falling1y = globalBondsData.filter(b => b.change1y < -5);

    let body = '';
    let conclusion = '';

    if (falling1y.length > globalBondsData.length * 0.6) {
      body = `A synchronized global bond sell-off is underway: ${falling1y.length} of ${globalBondsData.length} regions show negative 12-month returns. This broad-based repricing reflects a global monetary tightening cycle where major central banks have raised rates to combat inflation. Unlike localized sell-offs, synchronized moves indicate a structural shift in the global rate equilibrium rather than idiosyncratic country risk.`;
      conclusion = `Global yield convergence at higher levels compresses the relative-value opportunity set. Duration exposure carries elevated risk across jurisdictions. Investors should favor shorter duration and floating-rate instruments until rate volatility subsides.`;
    } else if (rising1y.length > globalBondsData.length * 0.6) {
      body = `${rising1y.length} of ${globalBondsData.length} regions show positive 12-month returns — a broad rally in sovereign bonds suggesting easing financial conditions globally. This is consistent with central banks pausing or pivoting, and the bond market anticipating the end of the tightening cycle.`;
      conclusion = `Synchronized bond strength is historically supportive for risk assets and credit. However, if the rally is driven by recession fears rather than dovish pivots, the signal for equities is more ambiguous.`;
    } else {
      const bestPerformer = [...globalBondsData].sort((a, b) => b.change1y - a.change1y)[0];
      const worstPerformer = [...globalBondsData].sort((a, b) => a.change1y - b.change1y)[0];
      body = `Performance is divergent across regions: ${bestPerformer?.region || 'N/A'} leads at ${formatPct(bestPerformer?.change1y)} while ${worstPerformer?.region || 'N/A'} lags at ${formatPct(worstPerformer?.change1y)}. This dispersion reflects asynchronous monetary policy cycles — regions at different stages of tightening, pausing, or easing — creating relative-value opportunities.`;
      if (falling1m.length > rising1m.length) {
        conclusion = `Near-term momentum is negative with ${falling1m.length} regions declining in the last month, suggesting the recent move is toward tighter conditions. Cross-market spread trades may offer better risk-adjusted returns than outright duration bets.`;
      } else if (rising1m.length > falling1m.length) {
        conclusion = `Short-term momentum favors bonds with ${rising1m.length} regions rallying recently. This rotation may signal a global risk-off impulse or coordinated dovish repricing that could extend if incoming economic data weakens.`;
      }
    }
    return { body: body || null, conclusion };
  };

  const getGlobalBondsTakeaway = () => {
    if (globalBondsData.length < 2) return null;

    const usaBonds = globalBondsData.filter(b => b.region.startsWith('USA'));
    const intlBonds = globalBondsData.filter(b => !b.region.startsWith('USA'));

    const tips = [];

    const priceBasedBonds = globalBondsData.filter(b => b.level >= 20);
    const yieldBasedBonds = globalBondsData.filter(b => b.level < 20);
    if (priceBasedBonds.length > 0 && yieldBasedBonds.length > 0) {
      tips.push('Note: Some instruments show prices (ETFs/futures) while others show yields. Rising prices = falling yields = easing conditions, and vice versa.');
    }

    const usa3m = usaBonds.find(b => b.region === 'USA 3M');
    const usa10y = usaBonds.find(b => b.region === 'USA 10Y');
    const usa30y = usaBonds.find(b => b.region === 'USA 30Y');
    if (usa3m && usa10y && usa3m.level > usa10y.level) {
      tips.push(`The US curve remains inverted (3M ${usa3m.level.toFixed(2)}% vs 10Y ${usa10y.level.toFixed(2)}%). Historically, sustained inversions precede economic slowdowns by 6–18 months. Monitor the un-inversion — it often coincides with the onset of recession, not the avoidance of one.`);
    } else if (usa3m && usa10y && usa30y) {
      const slope = usa30y.level - usa3m.level;
      if (slope > 1.5) {
        tips.push(`The US curve is steep (${slope.toFixed(0)}bp from 3M to 30Y), signaling expectations of higher growth or inflation ahead. This environment typically favors equities over bonds.`);
      }
    }

    if (intlBonds.length > 0 && usaBonds.length > 0) {
      const avgUsaChange = usaBonds.reduce((s, b) => s + b.change1y, 0) / usaBonds.length;
      const avgIntlChange = intlBonds.reduce((s, b) => s + b.change1y, 0) / intlBonds.length;
      const divergence = Math.abs(avgUsaChange - avgIntlChange);
      if (divergence > 10) {
        const leader = avgUsaChange > avgIntlChange ? 'US' : 'international';
        tips.push(`Significant US vs international divergence (${divergence.toFixed(0)}pp gap in 1Y returns). ${leader === 'US' ? 'US bonds outperforming' : 'International bonds outperforming'} — consider hedged international bond exposure if the spread is mean-reverting, or unhedged if the currency trend supports the ${leader} side.`);
      }
    }

    tips.push('Global sovereign bonds act as a leading indicator: when yields diverge across major economies, it signals differing growth expectations and creates opportunities in currency-hedged fixed income strategies.');

    return tips;
  };

  return (
    <div className="macro-dashboard">
      {/* ═══════ HEADER + RISK BADGE ═══════ */}
      <div className="dashboard-header-hero">
        <div className="hero-content">
          <h2 className="hero-title">Global Macroeconomic Situation</h2>
          <p className="hero-subtitle">Comprehensive analysis of yield curve, inflation, credit, and risk sentiment</p>
        </div>
        <div className={`risk-badge-large ${getRiskBadgeClass(overallRisk)}`}>
          <span className="risk-badge-label">Overall Risk</span>
          <span className="risk-badge-value">{overallRisk || 'N/A'}</span>
          <span className="risk-badge-score">Score: {riskScore}</span>
        </div>
      </div>

      {/* ═══════ RISK FACTORS ═══════ */}
      {riskFactors.length > 0 && (
        <div className="risk-factors-banner">
          <span className="risk-factors-icon">⚠</span>
          <div className="risk-factors-content">
            <span className="risk-factors-title">Risk Factors Detected</span>
            <div className="risk-factors-tags">
              {riskFactors.map((factor, idx) => (
                <span key={idx} className="risk-factor-tag">{factor}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ KPI CARDS ═══════ */}
      <div className="dashboard-kpi-grid">
        {/* VIX Card */}
        {vixLevel != null && (
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">VIX</span>
              <span className="kpi-badge" style={{
                background: vixColor(vixLevel) + '20',
                color: vixColor(vixLevel),
              }}>
                {vixLabel(vixLevel)}
              </span>
            </div>
            <div className="kpi-value" style={{ color: vixColor(vixLevel) }}>
              {vixLevel.toFixed(1)}
            </div>
            <div className="kpi-gauge">
              <div className="kpi-gauge-track">
                <div className="kpi-gauge-fill" style={{
                  width: `${vixPct * 100}%`,
                  background: `linear-gradient(90deg, #10b981, #f59e0b, #ef4444)`,
                }} />
              </div>
            </div>
            <div className="kpi-footer">
              <span className="kpi-footer-text">{marketCondition || ''}</span>
            </div>
          </div>
        )}

        {/* 10Y-2Y Spread Card */}
        {spread10y2y !== undefined && (
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">10Y-2Y Spread</span>
              <span className="kpi-badge" style={{
                background: spreadColor(spread10y2y) + '20',
                color: spreadColor(spread10y2y),
              }}>
                {spreadLabel(spread10y2y)}
              </span>
            </div>
            <div className="kpi-value" style={{ color: spread10y2y < 0 ? '#ef4444' : '#10b981' }}>
              {formatPp(spread10y2y)}
            </div>
            <div className="kpi-footer">
              <span className="kpi-footer-text">{yieldCurveInterpretation}</span>
            </div>
          </div>
        )}

        {/* Policy Signal Card */}
        {ratePathSignal && (
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Policy Signal</span>
              {getSignalBadge(ratePathSignal)}
            </div>
            <div className="kpi-value" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              {curveExpectations || 'N/A'}
            </div>
            <div className="kpi-footer">
              <span className="kpi-footer-text">Based on implied forward curve</span>
            </div>
          </div>
        )}

        {/* Inflation Card */}
        {avgCommodityChange != null && !isNaN(avgCommodityChange) && (
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-label">Inflation (Commodities)</span>
              <span className="kpi-badge" style={{
                background: inflationColor(avgCommodityChange) + '20',
                color: inflationColor(avgCommodityChange),
              }}>
                {inflationLabel(avgCommodityChange)}
              </span>
            </div>
            <div className="kpi-value" style={{ color: inflationColor(avgCommodityChange) }}>
              {formatPct(avgCommodityChange)}
            </div>
            <div className="kpi-footer">
              <span className="kpi-footer-text">Average commodity change (1Y)</span>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ RISK SENTIMENT ═══════ */}
      {(fearLevel || dollarStrength || safeHaven) && (
        <div className="dashboard-chart-card">
          <div className="chart-header">
            <h3 className="dashboard-section-title">Risk Sentiment</h3>
          </div>
          {renderSectionInsight(getSentimentInsight)}
          <div className="sentiment-grid">
            {/* Fear Level */}
            {fearLevel && (
              <div className="sentiment-card">
                <div className="sentiment-card-accent" style={{
                  background: fearLevel.includes('PANIC') || fearLevel.includes('EXTREME') ? '#ef4444'
                    : fearLevel.includes('ANXIETY') || fearLevel.includes('MODERATE') ? '#f59e0b'
                      : '#10b981'
                }} />
                <div className="sentiment-card-body">
                  <div className="sentiment-card-title">Fear Level</div>
                  <div className="sentiment-card-value" style={{
                    color: fearLevel.includes('PANIC') || fearLevel.includes('EXTREME') ? '#ef4444'
                      : fearLevel.includes('ANXIETY') || fearLevel.includes('MODERATE') ? '#f59e0b'
                        : '#10b981'
                  }}>
                    {fearLevel}
                  </div>
                  {vixLevel != null && (
                    <div className="sentiment-card-detail">VIX: {vixLevel.toFixed(1)}</div>
                  )}
                </div>
              </div>
            )}

            {/* Dollar Strength */}
            {dollarStrength && (
              <div className="sentiment-card">
                <div className="sentiment-card-accent" style={{
                  background: dollarStrength.includes('STRONG') ? '#2563eb'
                    : dollarStrength.includes('WEAK') || dollarStrength.includes('VERY WEAK') ? '#ef4444'
                      : '#f59e0b'
                }} />
                <div className="sentiment-card-body">
                  <div className="sentiment-card-title">Dollar Strength</div>
                  <div className="sentiment-card-value" style={{
                    color: dollarStrength.includes('STRONG') ? '#2563eb'
                      : dollarStrength.includes('WEAK') ? '#ef4444'
                        : '#f59e0b',
                    fontSize: '1rem',
                  }}>
                    {dollarStrength}
                  </div>
                  <div className="sentiment-trends">
                    {dxyTrend1w != null && (
                      <span className="trend-chip" style={{ color: getChangeColor(dxyTrend1w) }}>1W: {formatPct(dxyTrend1w, 1)}</span>
                    )}
                    {dxyTrend1m != null && (
                      <span className="trend-chip" style={{ color: getChangeColor(dxyTrend1m) }}>1M: {formatPct(dxyTrend1m, 1)}</span>
                    )}
                    {dxyTrend3m != null && (
                      <span className="trend-chip" style={{ color: getChangeColor(dxyTrend3m) }}>3M: {formatPct(dxyTrend3m, 1)}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Safe Haven */}
            {safeHaven && (
              <div className="sentiment-card">
                <div className="sentiment-card-accent" style={{
                  background: safeHaven.includes('HIGH') ? '#f59e0b'
                    : safeHaven.includes('NO ') ? '#10b981'
                      : '#94a3b8'
                }} />
                <div className="sentiment-card-body">
                  <div className="sentiment-card-title">Safe Haven Demand (Gold)</div>
                  <div className="sentiment-card-value" style={{
                    color: safeHaven.includes('HIGH') ? '#f59e0b'
                      : safeHaven.includes('NO ') ? '#10b981'
                        : '#64748b',
                    fontSize: '1rem',
                  }}>
                    {safeHaven}
                  </div>
                  <div className="sentiment-trends">
                    {goldTrend1w != null && (
                      <span className="trend-chip" style={{ color: getChangeColor(goldTrend1w) }}>1W: {formatPct(goldTrend1w, 1)}</span>
                    )}
                    {goldTrend1m != null && (
                      <span className="trend-chip" style={{ color: getChangeColor(goldTrend1m) }}>1M: {formatPct(goldTrend1m, 1)}</span>
                    )}
                    {goldTrend3m != null && (
                      <span className="trend-chip" style={{ color: getChangeColor(goldTrend3m) }}>3M: {formatPct(goldTrend3m, 1)}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ YIELD CURVE + FORWARDS ═══════ */}
      {yieldCurveChartData.length > 0 && (
        <div className="dashboard-chart-card">
          <div className="chart-header">
            <h3 className="dashboard-section-title">US Yield Curve — Spot vs Implied Forward</h3>
            {ratePathSignal && getSignalBadge(ratePathSignal)}
          </div>
          {renderSectionInsight(getYieldCurveInsight)}

          <div className="chart-grid">
            <div className="chart-main">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={yieldCurveChartData}>
                  <defs>
                    <linearGradient id="spotGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="fwdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="tenor" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#94a3b8" />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    stroke="#94a3b8"
                    tickFormatter={v => `${v.toFixed(1)}%`}
                    domain={['dataMin - 0.3', 'dataMax + 0.3']}
                  />
                  <Tooltip
                    formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name === 'spot' ? 'Spot Rate' : 'Forward Rate']}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey="spot" stroke="#2563eb" strokeWidth={3} fill="url(#spotGrad)"
                    dot={{ fill: '#fff', stroke: '#2563eb', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }} name="spot" />
                  {yieldCurveChartData.some(d => d.forward !== undefined) && (
                    <Area type="monotone" dataKey="forward" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="6 3"
                      fill="url(#fwdGrad)"
                      dot={{ fill: '#fff', stroke: '#f59e0b', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }} name="forward" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-sidebar">
              {/* Spot Levels */}
              <div className="sidebar-title">Current Levels</div>
              <div className="spreads-list">
                {Object.entries(yieldCurveLevels)
                  .sort(byTenor)
                  .map(([tenor, rate], idx) => (
                    <div key={idx} className="spread-item">
                      <span className="spread-name">{tenor}</span>
                      <span className="spread-value" style={{ color: '#2563eb' }}>
                        {typeof rate === 'number' ? `${rate.toFixed(2)}%` : `${rate}%`}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Spreads */}
              {Object.keys(yieldCurveSpreads).length > 0 && (
                <>
                  <div className="sidebar-title" style={{ marginTop: '1rem' }}>Spreads</div>
                  <div className="spreads-list">
                    {Object.entries(yieldCurveSpreads).map(([spread, value], idx) => (
                      <div key={idx} className="spread-item">
                        <span className="spread-name">{spread}</span>
                        <span className={`spread-value ${value >= 0 ? 'positive' : 'negative'}`}>
                          {formatPp(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ IMPLIED FORWARD CURVE TABLE ═══════ */}
      {Object.keys(forwardRates).length > 0 && (
        <div className="dashboard-chart-card">
          <div className="chart-header">
            <h3 className="dashboard-section-title">US Implied Forward Rates</h3>
          </div>
          {renderSectionInsight(getForwardRatesInsight)}

          <div className="implied-curve-grid">
            {/* Forward Rates Table */}
            <div className="table-container">
              {(() => {
                // Separate consecutive vs wide forwards
                const allForwards = Object.entries(forwardRates).map(([key, rate]) => {
                  const parts = key.split('→');
                  const isConsecutive = spotTenors.some((t, i) =>
                    i < spotTenors.length - 1 && parts[0] === t && parts[1] === spotTenors[i + 1]
                  );
                  return { key, rate, diff: forwardVsSpot[key], isConsecutive };
                });
                const consecutive = allForwards.filter(f => f.isConsecutive);
                const wide = allForwards.filter(f => !f.isConsecutive);

                const renderRow = ({ key, rate, diff }, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'left', fontWeight: 500 }}>{key}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                      {typeof rate === 'number' ? `${rate.toFixed(2)}%` : 'N/A'}
                    </td>
                    <td style={{
                      textAlign: 'right', fontFamily: 'monospace',
                      color: getChangeColor(diff), fontWeight: 600,
                    }}>
                      {diff != null ? formatPp(diff) : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {diff > 0.3 ? (
                        <span className="mini-badge mini-badge-danger">▲ Hawkish</span>
                      ) : diff < -0.3 ? (
                        <span className="mini-badge mini-badge-success">▼ Dovish</span>
                      ) : (
                        <span className="mini-badge mini-badge-neutral">● Neutral</span>
                      )}
                    </td>
                  </tr>
                );

                return (
                  <table className="notebook-table-styled">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Forward Segment</th>
                        <th style={{ textAlign: 'right' }}>Forward Rate</th>
                        <th style={{ textAlign: 'right' }}>vs Spot</th>
                        <th style={{ textAlign: 'center' }}>Signal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consecutive.length > 0 && (<>
                        <tr><td colSpan={4} style={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', paddingTop: '0.75rem', letterSpacing: '0.05em' }}>Adjacent Forwards</td></tr>
                        <tr><td colSpan={4} style={{ fontSize: '0.75rem', color: '#94a3b8', paddingTop: 0, paddingBottom: '0.5rem' }}>Rates between consecutive tenors — the building blocks of the forward curve</td></tr>
                      </>)}
                      {consecutive.map(renderRow)}
                      {wide.length > 0 && (<>
                        <tr><td colSpan={4} style={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', paddingTop: '0.75rem', letterSpacing: '0.05em' }}>Cross-Tenor Forwards</td></tr>
                        <tr><td colSpan={4} style={{ fontSize: '0.75rem', color: '#94a3b8', paddingTop: 0, paddingBottom: '0.5rem' }}>Implied rates spanning multiple tenors — useful for assessing long-term market expectations</td></tr>
                      </>)}
                      {wide.map(renderRow)}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            {/* Term Premium */}
            {Object.keys(termPremium).length > 0 && (
              <div className="term-premium-cards">
                <div className="sidebar-title">Term Premium</div>
                {Object.entries(termPremium).map(([tenor, tp], idx) => (
                  <div key={idx} className="term-premium-item">
                    <span className="tp-tenor">{tenor}</span>
                    <span className="tp-value" style={{ color: getChangeColor(tp) }}>
                      {formatPp(tp)}
                    </span>
                    <span className="tp-label">
                      {tp > 0.1 ? 'Risk premium' : tp < -0.1 ? 'Compressed' : 'Neutral'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ RATE CHANGES & DIVERGENCE ═══════ */}
      {Object.keys(rateChanges).length > 0 && (
        <div className="dashboard-chart-card">
          <div className="chart-header">
            <h3 className="dashboard-section-title">US Treasury Rate Changes</h3>
          </div>
          {renderSectionInsight(getRateChangesInsight)}

          <div className="table-container">
            <table className="notebook-table-styled">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Tenor</th>
                  <th style={{ textAlign: 'right' }}>1 Month</th>
                  <th style={{ textAlign: 'right' }}>3 Months</th>
                  <th style={{ textAlign: 'right' }}>1 Year</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(rateChanges)
                  .sort(byTenor)
                  .map(([tenor, changes], idx) => (
                    <tr key={idx}>
                      <td style={{ textAlign: 'left', fontWeight: 600 }}>US {tenor}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: getChangeColor(changes['1m']), fontWeight: 500 }}>
                        {changes['1m'] !== undefined ? formatPp(changes['1m']) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: getChangeColor(changes['3m']), fontWeight: 500 }}>
                        {changes['3m'] !== undefined ? formatPp(changes['3m']) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: getChangeColor(changes['1y']), fontWeight: 500 }}>
                        {changes['1y'] !== undefined ? formatPp(changes['1y']) : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {(() => {
            const tips = getRateChangesTakeaway();
            if (!tips || tips.length === 0) return null;
            return (
              <div className="notebook-note" style={{ marginTop: '1rem' }}>
                <strong>Key Takeaways</strong>
                <ul className="notebook-list">
                  {tips.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
              </div>
            );
          })()}

          {/* Divergence Analysis */}
          {Object.keys(divergenceAnalysis).length > 0 && (
            <div className="divergence-section">
              <div className="sidebar-title" style={{ marginTop: '1.5rem' }}>Short vs Long Rate Divergence (2Y vs 10Y)</div>
              <div className="divergence-grid">
                {Object.entries(divergenceAnalysis).map(([period, divData], idx) => {
                  const div = divData.divergence;
                  const isInflationary = div > 0.5;
                  const isDeflationary = div < -0.5;
                  return (
                    <div key={idx} className={`divergence-card ${isInflationary ? 'divergence-warn' : isDeflationary ? 'divergence-good' : ''}`}>
                      <div className="divergence-period">{period === '3m' ? '3 Months' : '1 Year'}</div>
                      <div className="divergence-details">
                        <div className="div-row">
                          <span>Short (2Y):</span>
                          <span style={{ color: getChangeColor(divData.short), fontWeight: 600 }}>{formatPp(divData.short)}</span>
                        </div>
                        <div className="div-row">
                          <span>Long (10Y):</span>
                          <span style={{ color: getChangeColor(divData.long), fontWeight: 600 }}>{formatPp(divData.long)}</span>
                        </div>
                        <div className="div-row div-total">
                          <span>Divergence:</span>
                          <span style={{ color: getChangeColor(div), fontWeight: 700 }}>{formatPp(div)}</span>
                        </div>
                      </div>
                      {isInflationary && (
                        <div className="divergence-label divergence-label-warn">Long rising faster → Inflation expectations</div>
                      )}
                      {isDeflationary && (
                        <div className="divergence-label divergence-label-good">Short rising faster → Growth concerns</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ INFLATION SIGNALS ═══════ */}
      {commodityChartData.length > 0 && (
        <div className="dashboard-chart-card">
          <div className="chart-header">
            <h3 className="dashboard-section-title">Inflation Signals — Commodity Changes (1Y)</h3>
            {avgCommodityChange != null && !isNaN(avgCommodityChange) && (
              <span className="chart-badge" style={{
                background: inflationColor(avgCommodityChange) + '15',
                color: inflationColor(avgCommodityChange),
              }}>
                Avg: {formatPct(avgCommodityChange)}
              </span>
            )}
          </div>
          {renderSectionInsight(getInflationInsight)}

          <ResponsiveContainer width="100%" height={Math.max(200, commodityChartData.length * 50)}>
            <BarChart data={commodityChartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={v => `${v.toFixed(0)}%`} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 13, fill: '#1e293b', fontWeight: 500 }} width={80} />
              <Tooltip
                formatter={v => [`${Number(v).toFixed(2)}%`, 'Change']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}
              />
              <Bar dataKey="change" radius={[0, 4, 4, 0]} barSize={18}>
                {commodityChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.change >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ═══════ CREDIT & VOLATILITY ═══════ */}
      {(hygLevel != null || lqdLevel != null) && (
        <div className="dashboard-chart-card">
          <div className="chart-header">
            <h3 className="dashboard-section-title">Credit Conditions</h3>
          </div>
          {renderSectionInsight(getCreditInsight)}
          <div className="credit-grid">
            {hygLevel != null && (
              <div className="credit-metric">
                <div className="credit-label">HYG (High Yield)</div>
                <div className="credit-value">${hygLevel.toFixed(2)}</div>
                <div className="credit-status">iShares High Yield Corporate Bond ETF</div>
                <div className="credit-detail" style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                  {hygLevel >= 82
                    ? 'Price above $82 — credit spreads are tight, indicating strong risk appetite and low default expectations. Investors are comfortable lending to lower-rated corporations.'
                    : hygLevel >= 75
                      ? 'Price in the $75–82 range — moderate credit conditions. Spreads are neither distressed nor excessively compressed. Market reflects cautious but functional lending.'
                      : 'Price below $75 — credit spreads are widening significantly, signaling stress in high-yield markets. Rising default risk and risk aversion are pushing investors away from junk bonds.'}
                </div>
              </div>
            )}
            {lqdLevel != null && (
              <div className="credit-metric">
                <div className="credit-label">LQD (Inv. Grade)</div>
                <div className="credit-value">${lqdLevel.toFixed(2)}</div>
                <div className="credit-status">iShares Investment Grade Corporate Bond ETF</div>
                <div className="credit-detail" style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                  {lqdLevel >= 115
                    ? 'Price above $115 — investment-grade bonds are strong, reflecting low yields and high confidence in corporate balance sheets. Favorable borrowing conditions for quality issuers.'
                    : lqdLevel >= 105
                      ? 'Price in the $105–115 range — investment-grade credit is stable. Yields are moderate, consistent with a normalizing rate environment.'
                      : 'Price below $105 — investment-grade bonds under pressure from rising rates or credit risk repricing. Even high-quality corporate debt is losing value, suggesting broad fixed-income stress.'}
                </div>
              </div>
            )}
          </div>
          {(hygLevel != null && lqdLevel != null) && (
            <div className="insight-callout" style={{ marginTop: '1rem' }}>
              <span>
                <strong>HYG vs LQD spread signal: </strong>
                {(() => {
                  const ratio = hygLevel / lqdLevel;
                  if (ratio >= 0.76) {
                    return 'HYG is holding up well relative to LQD — credit markets show no signs of distress. Investors are not discriminating strongly between high-yield and investment-grade, which is typical of risk-on environments.';
                  } else if (ratio >= 0.70) {
                    return 'HYG is modestly underperforming LQD — some credit differentiation is emerging. Investors are beginning to demand more compensation for lower-rated debt, a normal late-cycle pattern.';
                  } else {
                    return 'HYG is significantly underperforming LQD — a flight to quality is underway. Investors are exiting junk bonds and rotating into safer investment-grade debt, signaling elevated credit risk and potential recession concerns.';
                  }
                })()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ═══════ GLOBAL BONDS ═══════ */}
      {globalBondsData.length > 0 && (
        <div className="dashboard-chart-card">
          <div className="chart-header">
            <h3 className="dashboard-section-title">Global Sovereign Bonds</h3>
          </div>
          {renderSectionInsight(getGlobalBondsInsight)}
          <div className="table-container">
            <table className="notebook-table-styled">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Region</th>
                  <th style={{ textAlign: 'right' }}>Level</th>
                  <th style={{ textAlign: 'center' }}>Type</th>
                  <th style={{ textAlign: 'right' }}>1 Month</th>
                  <th style={{ textAlign: 'right' }}>1 Year</th>
                </tr>
              </thead>
              <tbody>
                {globalBondsData.map((bond, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'left', fontWeight: 500 }}>{bond.region}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                      {bond.level !== null
                        ? (bond.unit === 'yield' ? `${bond.level.toFixed(2)}%` : `$${bond.level.toFixed(2)}`)
                        : 'N/A'}
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                      {bond.unit === 'yield' ? 'Yield' : 'ETF Price'}
                    </td>
                    <td style={{
                      textAlign: 'right', fontFamily: 'monospace',
                      color: getChangeColor(bond.change1m), fontWeight: 500,
                    }}>
                      {formatPct(bond.change1m)}
                    </td>
                    <td style={{
                      textAlign: 'right', fontFamily: 'monospace',
                      color: getChangeColor(bond.change1y), fontWeight: 500,
                    }}>
                      {formatPct(bond.change1y)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(() => {
            const tips = getGlobalBondsTakeaway();
            if (!tips || tips.length === 0) return null;
            return (
              <div className="notebook-note" style={{ marginTop: '1rem' }}>
                <strong>Key Takeaways</strong>
                <ul className="notebook-list">
                  {tips.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
              </div>
            );
          })()}
        </div>
      )}

      {/* ═══════ PORTFOLIO POSITIONING TIPS ═══════ */}
      {(() => {
        const groups = getOverallRecommendations();
        if (groups.length === 0) return null;
        return (
          <div className="dashboard-chart-card">
            <div className="chart-header">
              <h3 className="dashboard-section-title">Portfolio Positioning Tips</h3>
              {overallRisk && (
                <span className={`risk-badge-large ${getRiskBadgeClass(overallRisk)}`} style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                  Risk: {overallRisk}
                </span>
              )}
            </div>
            <div className="tips-grid">
              {groups.map((group, gi) => (
                <div key={gi} className="tips-category">
                  <div className="tips-category-title">{group.category}</div>
                  <div className="tips-list">
                    {group.items.map((item, ii) => (
                      <div key={ii} className="tip-item">
                        <div className="tip-title">{item.title}</div>
                        <div className="tip-desc">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default MacroSituationResults;

