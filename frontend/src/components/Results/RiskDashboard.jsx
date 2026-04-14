import { useState, useEffect } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import Card from '../Card/Card';
import { formatPercent, formatNumber } from '../../utils/formatters';
import './Results.css';
import './MacroSituationDashboard.css';


const posNeg = (v) => v >= 0 ? 'var(--accent)' : 'var(--danger)';

const riskColor = (level) =>
  level === 'LOW' ? 'var(--accent)' : level === 'MEDIUM' ? 'var(--warning)' : 'var(--danger)';

const normalColor = (ok) => ok ? 'var(--accent)' : 'var(--danger)';

const sharpeLabel = (v) =>
  v > 2 ? 'exceptional' : v > 1 ? 'good' : v > 0.5 ? 'acceptable' : v > 0 ? 'weak' : 'negative';

const MetricCard = ({ label, value, hint, color }) => (
  <div className="metric-card">
    <div className="metric-card__label">{label}</div>
    <div className="metric-card__value" style={color ? { color } : undefined}>{value}</div>
    {hint && <div className="metric-card__hint">{hint}</div>}
  </div>
);

const WarningCallout = ({ warnings, severity = 'callout-warning' }) => {
  if (!warnings?.length) return null;
  return (
    <div className={`insight-callout ${severity}`}>
      {warnings.map((w, i) => <span key={i}>{w}{i < warnings.length - 1 ? ' ' : ''}</span>)}
    </div>
  );
};

const NormalityRow = ({ label, hint, children }) => (
  <div className="notebook-row">
    <span className="notebook-label">
      {label}
      {hint && <span className="normality-hint">{hint}</span>}
    </span>
    {children}
  </div>
);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

const getTickerPerformanceInsight = (data) => {
  if (!data.ticker_performance) return null;
  const entries = Object.entries(data.ticker_performance).filter(([k]) => k !== 'error');
  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => b[1].annual_return - a[1].annual_return);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const byVol = [...entries].sort((a, b) => b[1].annual_volatility - a[1].annual_volatility);
  const mostVolatile = byVol[0];
  const negativeReturns = entries.filter(([, p]) => p.annual_return < 0);
  const withRR = entries.filter(([, p]) => p.annual_volatility > 0);
  const bestRR = withRR.length > 0
    ? [...withRR].sort((a, b) => (b[1].annual_return / b[1].annual_volatility) - (a[1].annual_return / a[1].annual_volatility))[0]
    : null;

  const warnings = [];
  if (negativeReturns.length > 0)
    warnings.push(`${negativeReturns.map(([t]) => t).join(', ')} ${negativeReturns.length === 1 ? 'shows' : 'show'} negative returns, dragging overall portfolio performance.`);
  if (mostVolatile[1].annual_volatility > 0.30)
    warnings.push(`${mostVolatile[0]} exhibits elevated volatility (${formatPercent(mostVolatile[1].annual_volatility)}) — consider reducing its weight or hedging the exposure.`);

  if (entries.length === 1) {
    const [ticker, perf] = entries[0];
    const rr = perf.annual_volatility > 0 ? perf.annual_return / perf.annual_volatility : null;
    return (
      <>
        <div className="insight-callout">
          <strong>{ticker}</strong> delivers an annualized return of <strong>{formatPercent(perf.annual_return)}</strong> with
          a volatility of <strong>{formatPercent(perf.annual_volatility)}</strong>.
          {rr != null && (
            <> Return/risk ratio of <strong>{formatNumber(rr)}</strong> units of return per unit of risk taken.</>
          )}
        </div>
        <WarningCallout warnings={warnings} />
      </>
    );
  }

  return (
    <>
      <div className="insight-callout">
        <strong>{best[0]}</strong> leads the portfolio with an annualized return of <strong>{formatPercent(best[1].annual_return)}</strong>,
        while <strong>{worst[0]}</strong> is the weakest performer ({formatPercent(worst[1].annual_return)}).
        {bestRR && (
          <> Best risk-adjusted efficiency: <strong>{bestRR[0]}</strong> with a ratio of {formatNumber(bestRR[1].annual_return / bestRR[1].annual_volatility)} units of return per unit of risk.</>
        )}
        {entries.length > 2 && (
          <span className="insight-conclusion">
            {negativeReturns.length === 0
              ? 'All assets generate positive returns — constructive portfolio structure.'
              : `${negativeReturns.length} of ${entries.length} assets with negative returns — review allocation.`}
          </span>
        )}
      </div>
      <WarningCallout warnings={warnings} />
    </>
  );
};

const getRatiosInsight = (data) => {
  if (!data.ratios) return null;
  const { sharpe_ratio, sortino_ratio, annual_return, annual_volatility, downside_volatility } = data.ratios;

  const warnings = [];
  if (sharpe_ratio != null && sharpe_ratio < 0)
    warnings.push('Negative Sharpe indicates the portfolio is destroying value relative to the risk-free rate — the risk exposure is not being compensated.');
  if (downside_volatility != null && annual_volatility != null && downside_volatility > annual_volatility * 0.65)
    warnings.push(`Downside volatility (${formatPercent(downside_volatility)}) is disproportionately high relative to total volatility (${formatPercent(annual_volatility)}), indicating negative asymmetry in returns.`);

  return (
    <>
      <div className="insight-callout">
        {sharpe_ratio != null && (
          <>Sharpe of <strong>{formatNumber(sharpe_ratio)}</strong> indicates <strong>{sharpeLabel(sharpe_ratio)}</strong> risk-adjusted performance. </>
        )}
        {sortino_ratio != null && sharpe_ratio != null && (
          <>Sortino of <strong>{formatNumber(sortino_ratio)}</strong>{' '}
            {sortino_ratio > sharpe_ratio * 1.3
              ? '— significantly higher than Sharpe, suggesting upside volatility exceeds downside (favorable asymmetric profile).'
              : sortino_ratio < sharpe_ratio * 0.8
                ? '— lower than Sharpe, signaling that drawdowns are more pronounced than rallies (negative asymmetry).'
                : '— aligned with Sharpe, suggesting a symmetric risk profile.'
            }{' '}
          </>
        )}
        {annual_return != null && annual_volatility != null && (
          <span className="insight-conclusion">
            The portfolio generates {formatPercent(annual_return)} annually while bearing {formatPercent(annual_volatility)} volatility.
          </span>
        )}
      </div>
      <WarningCallout warnings={warnings} severity={sharpe_ratio < 0 ? 'callout-danger' : 'callout-warning'} />
    </>
  );
};

const getVarEsInsight = (data) => {
  if (!data.var_es) return null;
  const methods = Object.entries(data.var_es).filter(([m, v]) =>
    v && typeof v === 'object' && 'var_daily' in v && m !== 'error' && m !== 'risk_level'
  );
  if (methods.length === 0) return null;

  const varDailies = methods.map(([, v]) => Math.abs(v.var_daily));
  const maxVar = Math.max(...varDailies);
  const minVar = Math.min(...varDailies);
  const divergence = maxVar - minVar;

  const worstMethod = methods.reduce((a, b) =>
    Math.abs(a[1].var_daily) > Math.abs(b[1].var_daily) ? a : b
  );
  const bestMethod = methods.reduce((a, b) =>
    Math.abs(a[1].var_daily) < Math.abs(b[1].var_daily) ? a : b
  );

  const warnings = [];
  if (divergence > 0.005)
    warnings.push(`Significant divergence between methods (${formatPercent(divergence)}) — indicates fat tails in the distribution. Parametric VaR likely underestimates actual risk.`);
  if (maxVar > 0.03)
    warnings.push(`Daily VaR exceeds 3% — in an adverse scenario, a loss of ${formatPercent(maxVar)} in a single day is plausible.`);

  return (
    <>
      <div className="insight-callout">
        Maximum expected loss on a typical bad day (95% confidence) ranges
        from <strong>{formatPercent(Math.abs(bestMethod[1].var_daily))}</strong> ({bestMethod[0].replace('_', ' ')})
        to <strong>{formatPercent(Math.abs(worstMethod[1].var_daily))}</strong> ({worstMethod[0].replace('_', ' ')}).
        {worstMethod[1].es_daily && (
          <> Expected Shortfall extends the potential loss to <strong>{formatPercent(Math.abs(worstMethod[1].es_daily))}</strong> in
            the worst tail scenarios.</>
        )}
        {worstMethod[1].var_annual && (
          <span className="insight-conclusion">
            Annualized, VaR reaches {formatPercent(Math.abs(worstMethod[1].var_annual))} — meaning in an adverse year you could lose up to that proportion of the portfolio.
          </span>
        )}
      </div>
      <WarningCallout warnings={warnings} />
    </>
  );
};

const getDrawdownInsight = (data) => {
  if (!data.drawdown?.per_ticker) return null;
  const entries = Object.entries(data.drawdown.per_ticker);
  if (entries.length === 0) return null;

  const worst = entries.reduce((a, b) => a[1].max_drawdown < b[1].max_drawdown ? a : b);
  const bestEntry = entries.reduce((a, b) => a[1].max_drawdown > b[1].max_drawdown ? a : b);

  const warnings = [];
  if (Math.abs(worst[1].max_drawdown) > 0.30)
    warnings.push(`${worst[0]} suffered a drawdown of ${formatPercent(worst[1].max_drawdown)}, exceeding the 30% threshold. Losses of this magnitude are mathematically difficult to recover from.`);
  if (worst[1].max_underwater_duration && worst[1].max_underwater_duration > 120)
    warnings.push(`The longest recovery period was ${worst[1].max_underwater_duration} trading days — over 5 months underwater, a significant stress test for any investor.`);

  return (
    <>
      <div className="insight-callout">
        The deepest drawdown was recorded in <strong>{worst[0]}</strong> with a decline of <strong>{formatPercent(worst[1].max_drawdown)}</strong>
        {worst[1].max_drawdown_date && <> (trough: {fmtDate(worst[1].max_drawdown_date)})</>}
        {worst[1].max_underwater_duration && <>, lasting <strong>{worst[1].max_underwater_duration} days</strong></>}.
        {entries.length > 1 && (
          <> Most resilient: <strong>{bestEntry[0]}</strong> ({formatPercent(bestEntry[1].max_drawdown)}).</>
        )}
        {worst[1].calmar_ratio != null && (
          <span className="insight-conclusion">
            Calmar Ratio of {formatNumber(worst[1].calmar_ratio)} for {worst[0]}{' '}
            — {worst[1].calmar_ratio > 1 ? 'strong recovery capacity.' : worst[1].calmar_ratio > 0.5 ? 'moderate recovery capacity.' : 'weak recovery relative to the drawdown.'}
          </span>
        )}
      </div>
      <WarningCallout warnings={warnings} severity={Math.abs(worst[1].max_drawdown) > 0.40 ? 'callout-danger' : 'callout-warning'} />
    </>
  );
};

const getDistributionInsight = (data) => {
  if (!data.distribution) return null;
  const { skewness, excess_kurtosis, jarque_bera_pvalue, is_normal } = data.distribution;

  const warnings = [];
  if (skewness != null && skewness < -0.5)
    warnings.push(`Negative skewness of ${formatNumber(skewness, 3)} — extreme losses are more frequent than extreme gains. Left-tail risk is underestimated by symmetric metrics.`);
  if (excess_kurtosis != null && excess_kurtosis > 1)
    warnings.push(`Excess kurtosis of ${formatNumber(excess_kurtosis, 3)} — fat tails. Extreme events (crashes, spikes) occur more frequently than a normal distribution assumes.`);
  if (jarque_bera_pvalue != null && jarque_bera_pvalue < 0.05)
    warnings.push('Distribution is NOT normal (Jarque-Bera rejected). Parametric VaR and other Gaussian metrics should be interpreted with caution.');

  return (
    <>
      <div className="insight-callout">
        {skewness != null && (
          <>Returns exhibit skewness of <strong>{formatNumber(skewness, 3)}</strong>{' '}
            ({skewness > 0.3 ? 'positive — heavier right tail, favorable' : skewness < -0.3 ? 'negative — more exposed to extreme losses' : 'approximately symmetric'}).{' '}</>
        )}
        {excess_kurtosis != null && (
          <>Excess kurtosis of <strong>{formatNumber(excess_kurtosis, 3)}</strong>{' '}
            ({excess_kurtosis > 1 ? 'significantly fatter tails than a normal distribution' : excess_kurtosis > 0 ? 'slightly leptokurtic' : 'close to a normal distribution'}).{' '}</>
        )}
        <span className="insight-conclusion">
          {is_normal
            ? 'Distribution approximates normality — parametric metrics are reliable.'
            : 'Non-normal distribution — prioritize Historical/Monte Carlo VaR over Parametric.'}
        </span>
      </div>
      <WarningCallout warnings={warnings} />
    </>
  );
};

const getBenchmarkInsight = (data) => {
  if (!data.benchmark_analysis) return null;
  const { alpha_annual, beta, r_squared, information_ratio } = data.benchmark_analysis;

  const warnings = [];
  if (alpha_annual != null && alpha_annual < 0)
    warnings.push(`Negative alpha (${formatPercent(alpha_annual)}) — the portfolio is not being compensated for the active risk taken versus the benchmark.`);
  if (beta != null && beta > 1.3)
    warnings.push(`Beta of ${formatNumber(beta)} — the portfolio amplifies market movements by ${((beta - 1) * 100).toFixed(0)}%. In benchmark declines, the impact will be proportionally larger.`);
  if (information_ratio != null && information_ratio < 0)
    warnings.push(`Negative Information Ratio (${formatNumber(information_ratio)}) — active management is not generating value versus a passive strategy.`);

  return (
    <>
      <div className={`insight-callout ${alpha_annual != null && alpha_annual > 0 ? 'callout-success' : ''}`}>
        {alpha_annual != null && (
          <>The portfolio generates an annual alpha of <strong>{formatPercent(alpha_annual)}</strong>{' '}
            — {alpha_annual > 0 ? 'outperforming the benchmark on a risk-adjusted basis.' : 'failing to outperform the benchmark after adjusting for risk.'}{' '}</>
        )}
        {beta != null && (
          <>With a beta of <strong>{formatNumber(beta)}</strong>,{' '}
            {beta > 1.1 ? 'the portfolio is more aggressive than the market.' : beta < 0.9 ? 'the portfolio is more defensive than the market.' : 'market exposure is neutral.'}{' '}</>
        )}
        {r_squared != null && (
          <>R² of <strong>{formatPercent(r_squared)}</strong>{' '}
            {r_squared > 0.8 ? 'indicates high benchmark dependence — most of the movement is explained by the market.' : r_squared > 0.5 ? 'shows moderate benchmark dependence.' : 'suggests the portfolio has its own dynamics, largely unexplained by the benchmark.'}{' '}</>
        )}
        {information_ratio != null && (
          <span className="insight-conclusion">
            Information Ratio of {formatNumber(information_ratio)}{' '}
            — {information_ratio > 0.5 ? 'excellent active management.' : information_ratio > 0 ? 'positive but improvable active management.' : 'active management is not adding value.'}
          </span>
        )}
      </div>
      <WarningCallout warnings={warnings} />
    </>
  );
};

const getPortfolioVsBenchmarkInsight = (data) => {
  if (!data.portfolio_vs_benchmark) return null;
  const { portfolio, benchmark, excess_return, excess_volatility } = data.portfolio_vs_benchmark;
  if (!portfolio || !benchmark) return null;

  const isOut = excess_return >= 0;
  const isLess = excess_volatility <= 0;
  const ideal = isOut && isLess;
  const worst = !isOut && !isLess;

  const warnings = [];
  if (worst)
    warnings.push(`The portfolio underperforms (${formatPercent(excess_return)}) while taking on more risk (+${formatPercent(Math.abs(excess_volatility))} volatility) than the benchmark. Consider rebalancing or adopting a passive strategy.`);

  return (
    <>
      <div className={`insight-callout ${ideal ? 'callout-success' : worst ? 'callout-danger' : ''}`}>
        The portfolio {isOut ? 'outperforms' : 'underperforms'} the benchmark
        by <strong>{excess_return >= 0 ? '+' : ''}{formatPercent(excess_return)}</strong> annual return,
        with <strong>{isLess ? 'lower' : 'higher'}</strong> volatility ({excess_volatility >= 0 ? '+' : ''}{formatPercent(excess_volatility)}).
        <span className="insight-conclusion">
          {ideal
            ? 'Optimal positioning: higher return with lower risk. The portfolio offers a dominant profile versus the benchmark.'
            : worst
              ? 'Unfavorable positioning: lower return with higher risk. Active exposure is not justified.'
              : isOut
                ? 'Higher return but with more risk — evaluate whether the additional compensation justifies the extra volatility.'
                : 'Lower risk but also lower return — acceptable if the objective is capital preservation.'}
        </span>
      </div>
      <WarningCallout warnings={warnings} severity="callout-danger" />
    </>
  );
};

const getCorrelationInsight = (data) => {
  if (!data.correlation) return null;
  const { avg_correlation, min_correlation, correlation_matrix } = data.correlation;

  const warnings = [];
  if (avg_correlation != null && avg_correlation > 0.7)
    warnings.push(`Average correlation of ${formatNumber(avg_correlation, 3)} — limited diversification. In a market downturn, most assets will move together, amplifying losses.`);

  let maxPair = null;
  if (correlation_matrix) {
    const tickers = Object.keys(correlation_matrix);
    let maxVal = -1;
    for (let i = 0; i < tickers.length; i++) {
      for (let j = i + 1; j < tickers.length; j++) {
        const val = Number(correlation_matrix[tickers[i]]?.[tickers[j]] ?? 0);
        if (val > maxVal) { maxVal = val; maxPair = { a: tickers[i], b: tickers[j], val }; }
      }
    }
  }
  if (maxPair && maxPair.val > 0.85)
    warnings.push(`${maxPair.a} and ${maxPair.b} have a correlation of ${formatNumber(maxPair.val, 3)} — highly redundant. Holding both provides little additional diversification.`);

  return (
    <>
      <div className={`insight-callout ${avg_correlation != null && avg_correlation < 0.5 ? 'callout-success' : ''}`}>
        {avg_correlation != null && (
          <>Average cross-asset correlation: <strong>{formatNumber(avg_correlation, 3)}</strong>{' '}
            — {avg_correlation < 0.3 ? 'excellent diversification, assets move independently.' : avg_correlation < 0.5 ? 'good diversification with low inter-asset dependence.' : avg_correlation < 0.7 ? 'moderate diversification, some assets share common dynamics.' : 'limited diversification — the portfolio behaves almost like a single asset.'}{' '}</>
        )}
        {maxPair && (
          <>Most correlated pair: <strong>{maxPair.a}/{maxPair.b}</strong> ({formatNumber(maxPair.val, 3)}).{' '}</>
        )}
        {min_correlation != null && (
          <span className="insight-conclusion">
            Minimum correlation of {formatNumber(min_correlation, 3)}{' '}
            {min_correlation < 0 ? '— natural hedging exists between at least one pair of assets.' : '— all assets move in the same direction, no natural hedging present.'}
          </span>
        )}
      </div>
      <WarningCallout warnings={warnings} />
    </>
  );
};

const RiskDashboard = ({ data }) => {
  const [renderError, setRenderError] = useState(null);

  useEffect(() => { setRenderError(null); }, [data]);

  if (!data) return null;

  if (renderError) {
    return (
      <Card className="result-summary-card">
        <div className="dashboard-error">
          <h3 className="dashboard-error__title">Error displaying the dashboard</h3>
          <p className="dashboard-error__message">{renderError.message || 'Unknown error rendering results'}</p>
          <details className="dashboard-error__details">
            <summary className="dashboard-error__summary">Technical details</summary>
            <pre className="dashboard-error__stack">{renderError.stack || renderError.toString()}</pre>
          </details>
        </div>
      </Card>
    );
  }

  try {
    const nw = data.normality_warnings;
    const jb = nw?.jarque_bera;
    const ad = nw?.anderson_darling;

    // Pre-compute Key Insights drawdown data
    const ddEntries = data.drawdown?.per_ticker ? Object.entries(data.drawdown.per_ticker) : [];
    const ddWorst = ddEntries.length > 0 ? ddEntries.reduce((a, b) => a[1].max_drawdown < b[1].max_drawdown ? a : b) : null;
    const ddBest = ddEntries.length > 1 ? ddEntries.reduce((a, b) => a[1].max_drawdown > b[1].max_drawdown ? a : b) : null;

    return (
      <div className="results-container">

        {/* ── Portfolio Information ── */}
        <Card className="result-summary-card notebook-style">
          <h3 className="notebook-section-title">PORTFOLIO INFORMATION</h3>
          <div className="notebook-table">
            <div className="notebook-row">
              <span className="notebook-label">Tickers:</span>
              <span className="notebook-value notebook-value--bold">{data.tickers?.join(', ') || 'N/A'}</span>
            </div>
            <div className="notebook-row">
              <span className="notebook-label">Benchmark:</span>
              <span className="notebook-value">{data.benchmark_name || data.benchmark || 'N/A'}</span>
            </div>
            <div className="notebook-row">
              <span className="notebook-label">Period:</span>
              <span className="notebook-value">
                {data.start_date && data.end_date ? `${fmtDate(data.start_date)} → ${fmtDate(data.end_date)}` : 'N/A'}
              </span>
            </div>
            <div className="notebook-row">
              <span className="notebook-label">Analysis Days:</span>
              <span className="notebook-value">{data.period_days ? data.period_days.toLocaleString() : 'N/A'}</span>
            </div>
            <div className="notebook-row">
              <span className="notebook-label">Risk-Free Rate:</span>
              <span className="notebook-value">{data.risk_free_rate != null ? formatPercent(data.risk_free_rate) : 'N/A'}</span>
            </div>
            <div className="notebook-row">
              <span className="notebook-label">Weights:</span>
              <span className="notebook-value">
                {data.weights ? data.weights.map(w => (w * 100).toFixed(1) + '%').join(', ') : 'Equal'}
              </span>
            </div>
          </div>
        </Card>

        {/* ── Normality Warnings ── */}
        {nw && !nw.error && nw.conclusion && nw.conclusion !== 'NORMAL' && (
          <Card className="result-summary-card notebook-style normality-card">
            <h3 className="notebook-section-title">WARNING: {nw.conclusion} RETURNS</h3>
            <p className="normality-recommendation">
              {nw.recommendation || 'Review return distribution'}
            </p>
            <p className="normality-explanation">
              Normality tests check whether portfolio returns follow a bell-curve (Gaussian) distribution.
              This matters because parametric VaR assumes normality — if returns have <strong>fat tails</strong> (high
              kurtosis) or <strong>asymmetry</strong> (skewness), parametric VaR will underestimate extreme losses.
              Jarque-Bera tests moments (skewness + kurtosis), while Anderson-Darling focuses specifically
              on the <strong>tails</strong> of the distribution, making it more relevant for risk management.
            </p>
            <div className="notebook-table">
              <NormalityRow label="Jarque-Bera p-value:" hint={<>Tests skewness + kurtosis combined. p {'>'} 0.05 = normal.</>}>
                <span className="notebook-value notebook-value--bold" style={{ color: normalColor(jb?.is_normal) }}>
                  {formatNumber(jb?.p_value || 0, 4)}
                  <span className="normality-annotation">{jb?.is_normal ? '(normal)' : '(not normal)'}</span>
                </span>
              </NormalityRow>
              {ad && (
                <NormalityRow label="Anderson-Darling:" hint="Tail-focused test. More relevant for VaR/ES accuracy.">
                  <span className="notebook-value notebook-value--bold" style={{ color: normalColor(ad.is_normal) }}>
                    {ad.p_value != null ? formatNumber(ad.p_value, 4) : formatNumber(ad.statistic, 4)}
                    {ad.p_value == null && (
                      <span className="normality-annotation">vs {formatNumber(ad.critical_value, 4)} crit.</span>
                    )}
                    <span className="normality-annotation">
                      ({ad.is_normal ? 'normal' : `tail risk: ${ad.tail_risk}`})
                    </span>
                  </span>
                </NormalityRow>
              )}
              <NormalityRow label="Skewness:" hint={<>Asymmetry of returns. 0 = symmetric, {'<'} 0 = more extreme losses.</>}>
                <span className="notebook-value" style={{ color: normalColor(nw.is_skew_ok) }}>
                  {formatNumber(nw.skewness || 0, 3)}
                  <span className="normality-annotation">{nw.is_skew_ok ? '(acceptable)' : '(high)'}</span>
                </span>
              </NormalityRow>
              <NormalityRow label="Excess Kurtosis:" hint={<>Tail thickness. 0 = normal tails, {'>'} 0 = fatter tails = more extreme events.</>}>
                <span className="notebook-value" style={{ color: normalColor(nw.is_kurt_ok) }}>
                  {formatNumber(nw.excess_kurtosis || 0, 3)}
                  <span className="normality-annotation">{nw.is_kurt_ok ? '(acceptable)' : '(fat tails)'}</span>
                </span>
              </NormalityRow>
              <div className="notebook-row">
                <span className="notebook-label">Normality Score:</span>
                <span className="notebook-value notebook-value--bold">
                  {nw.normality_score ?? 'N/A'} / {nw.normality_checks ?? 4}
                </span>
              </div>
              <div className="notebook-row">
                <span className="notebook-label">Risk Level:</span>
                <span className="notebook-value notebook-value--bold" style={{ color: riskColor(nw.risk_level) }}>
                  {nw.risk_level || 'N/A'}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* ── Performance Ratios ── */}
        {data.ratios && !data.ratios.error && (
          <Card className="result-summary-card notebook-style">
            <h3 className="notebook-section-title">PERFORMANCE RATIOS</h3>
            {getRatiosInsight(data)}
            <div className="metric-cards-grid">
              {data.ratios.sharpe_ratio != null && (
                <MetricCard label="Sharpe Ratio" value={formatNumber(data.ratios.sharpe_ratio)} hint={data.ratios.sharpe_interpretation} />
              )}
              {data.ratios.sortino_ratio != null && (
                <MetricCard label="Sortino Ratio" value={formatNumber(data.ratios.sortino_ratio)} hint={data.ratios.sortino_interpretation} />
              )}
              {data.ratios.calmar_ratio != null && (
                <MetricCard label="Calmar Ratio" value={formatNumber(data.ratios.calmar_ratio)} />
              )}
              {data.ratios.annual_return != null && (
                <MetricCard label="Annual Return" value={formatPercent(data.ratios.annual_return)} color={posNeg(data.ratios.annual_return)} />
              )}
              {data.ratios.annual_volatility != null && (
                <MetricCard label="Annual Volatility" value={formatPercent(data.ratios.annual_volatility)} />
              )}
              {data.ratios.downside_volatility != null && (
                <MetricCard label="Downside Volatility" value={formatPercent(data.ratios.downside_volatility)} />
              )}
            </div>
          </Card>
        )}

        {/* ── Per-Ticker Performance ── */}
        {data.ticker_performance && !data.ticker_performance.error && Object.keys(data.ticker_performance).length > 0 && (
          <Card className="result-summary-card notebook-style">
            <h3 className="notebook-section-title">INDIVIDUAL TICKER PERFORMANCE</h3>
            {getTickerPerformanceInsight(data)}
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th className="text-right">Weight</th>
                    <th className="text-right">Annual Return</th>
                    <th className="text-right">Annual Volatility</th>
                    <th className="text-right">Return/Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.ticker_performance).map(([ticker, perf]) => (
                    <tr key={ticker}>
                      <td className="td-ticker">{ticker}</td>
                      <td className="text-right">{(perf.weight * 100).toFixed(1)}%</td>
                      <td className="text-right" style={{ fontWeight: 600, color: posNeg(perf.annual_return) }}>
                        {formatPercent(perf.annual_return)}
                      </td>
                      <td className="text-right">{formatPercent(perf.annual_volatility)}</td>
                      <td className="td-strong">
                        {perf.annual_volatility ? formatNumber(perf.annual_return / perf.annual_volatility) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── VaR & ES ── */}
        {data.var_es && !data.var_es.error && (
          <Card className="result-summary-card notebook-style">
            <h3 className="notebook-section-title">VALUE AT RISK (VaR) & EXPECTED SHORTFALL (ES)</h3>
            {getVarEsInsight(data)}
            {(data.var_es.historical || data.var_es.parametric || data.var_es.monte_carlo) && (
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th className="text-right">VaR Daily</th>
                      <th className="text-right">VaR Annual</th>
                      <th className="text-right">ES Daily</th>
                      <th className="text-right">ES Annual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.var_es)
                      .filter(([m, v]) => v && typeof v === 'object' && 'var_daily' in v && m !== 'error' && m !== 'risk_level')
                      .map(([method, values]) => (
                        <tr key={method}>
                          <td className="td-label">{method.replace('_', ' ')}</td>
                          <td className="td-danger">{formatPercent(values.var_daily)}</td>
                          <td className="td-danger">{formatPercent(values.var_annual)}</td>
                          <td className="td-danger">{formatPercent(values.es_daily)}</td>
                          <td className="td-danger">{formatPercent(values.es_annual)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            {data.var_es.risk_level && (
              <div className="risk-level-badge">
                <strong>Risk Level: </strong>
                <span style={{ fontWeight: 700, color: riskColor(data.var_es.risk_level) }}>
                  {data.var_es.risk_level}
                </span>
              </div>
            )}
          </Card>
        )}

        {/* ── Drawdown per Ticker ── */}
        {data.drawdown && !data.drawdown.error && data.drawdown.per_ticker && (
          <Card className="result-summary-card notebook-style">
            <h3 className="notebook-section-title">DRAWDOWN ANALYSIS (Per Ticker)</h3>
            {getDrawdownInsight(data)}
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th className="text-right">Max Drawdown</th>
                    <th className="text-right">Date</th>
                    <th className="text-right">Duration (days)</th>
                    <th className="text-right">Calmar Ratio</th>
                    <th className="text-right">Sterling Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.drawdown.per_ticker).map(([ticker, dd]) => (
                    <tr key={ticker}>
                      <td className="td-ticker">{ticker}</td>
                      <td className="td-danger-bold">{formatPercent(dd.max_drawdown)}</td>
                      <td className="text-right">{fmtDate(dd.max_drawdown_date)}</td>
                      <td className="text-right">{dd.max_underwater_duration ?? 'N/A'}</td>
                      <td className="td-strong">{formatNumber(dd.calmar_ratio)}</td>
                      <td className="td-strong">{formatNumber(dd.sterling_ratio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── Distribution ── */}
        {data.distribution && !data.distribution.error && (
          <Card className="result-summary-card notebook-style">
            <h3 className="notebook-section-title">DISTRIBUTION ANALYSIS</h3>
            {getDistributionInsight(data)}

            {data.distribution.histogram?.length > 0 && (() => {
              const TICKER_COLORS = [
                '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899',
                '#84cc16', '#6366f1', '#f97316', '#14b8a6', '#e11d48',
              ];
              const histSample = data.distribution.histogram[0] || {};
              const tickerKeys = Object.keys(histSample).filter(
                k => !['x', 'density', 'normal'].includes(k)
              );
              const isMultiTicker = tickerKeys.length > 1;

              const tooltipFormatter = (value, name) => {
                if (name === 'density') return [value.toFixed(4), isMultiTicker ? 'Portfolio' : 'Actual Distribution'];
                if (name === 'normal') return [value.toFixed(4), 'Normal Distribution'];
                return [value.toFixed(4), name];
              };

              return (
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                  <ResponsiveContainer width="100%" height={340}>
                    <ComposedChart data={data.distribution.histogram} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="x"
                        tick={{ fontSize: 11 }}
                        label={{ value: 'Daily Return (%)', position: 'insideBottom', offset: -10, fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        label={{ value: 'Density', angle: -90, position: 'insideLeft', offset: 5, fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={tooltipFormatter}
                        labelFormatter={(v) => `Return: ${v}%`}
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                        }}
                      />
                      <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="4 4" />
                      <Bar
                        dataKey="density"
                        fill={isMultiTicker ? 'rgba(37, 99, 235, 0.35)' : 'rgba(37, 99, 235, 0.5)'}
                        stroke={isMultiTicker ? 'rgba(37, 99, 235, 0.5)' : 'rgba(37, 99, 235, 0.7)'}
                        name="density"
                        barSize={Math.max(4, Math.round(600 / data.distribution.histogram.length))}
                      />
                      {tickerKeys.map((ticker, idx) => (
                        <Line
                          key={ticker}
                          dataKey={ticker}
                          stroke={TICKER_COLORS[idx % TICKER_COLORS.length]}
                          strokeWidth={1.8}
                          dot={false}
                          name={ticker}
                          type="monotone"
                          opacity={0.8}
                        />
                      ))}
                      <Line
                        dataKey="normal"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        strokeDasharray="6 3"
                        dot={false}
                        name="normal"
                        type="monotone"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div style={{
                    display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap',
                    fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem',
                  }}>
                    <span>
                      <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: 'rgba(37,99,235,0.5)', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }} />
                      {isMultiTicker ? 'Portfolio' : 'Actual Returns'}
                    </span>
                    {tickerKeys.map((ticker, idx) => (
                      <span key={ticker}>
                        <span style={{ display: 'inline-block', width: 16, height: 2, backgroundColor: TICKER_COLORS[idx % TICKER_COLORS.length], marginRight: 4, verticalAlign: 'middle' }} />
                        {ticker}
                      </span>
                    ))}
                    <span>
                      <span style={{ display: 'inline-block', width: 16, height: 2, backgroundColor: '#ef4444', marginRight: 4, verticalAlign: 'middle', borderTop: '2px dashed #ef4444' }} />
                      Normal Distribution
                    </span>
                  </div>
                </div>
              );
            })()}

            {data.distribution.per_ticker && Object.keys(data.distribution.per_ticker).length > 0 ? (
              <div className="dash-table-wrap" style={{ marginTop: 'var(--spacing-md)' }}>
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th className="text-right">Mean (%)</th>
                      <th className="text-right">Std (%)</th>
                      <th className="text-right">Skewness</th>
                      <th className="text-right">Excess Kurtosis</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="row-highlight">
                      <td className="td-bold">Portfolio</td>
                      <td className="text-right">{formatPercent(data.distribution.mean)}</td>
                      <td className="text-right">{formatPercent(data.distribution.std)}</td>
                      <td className="text-right" style={{ fontWeight: 600 }}>{formatNumber(data.distribution.skewness, 3)}</td>
                      <td className="text-right" style={{ fontWeight: 600 }}>{formatNumber(data.distribution.excess_kurtosis, 3)}</td>
                    </tr>
                    {Object.entries(data.distribution.per_ticker).map(([ticker, stats]) => (
                      <tr key={ticker}>
                        <td className="td-ticker">{ticker}</td>
                        <td className="text-right">{formatPercent(stats.mean)}</td>
                        <td className="text-right">{formatPercent(stats.std)}</td>
                        <td className="text-right">{formatNumber(stats.skewness, 3)}</td>
                        <td className="text-right">{formatNumber(stats.excess_kurtosis, 3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="notebook-table" style={{ marginTop: 'var(--spacing-md)' }}>
                {data.distribution.skewness != null && (
                  <div className="notebook-row">
                    <span className="notebook-label">Skewness:</span>
                    <span className="notebook-value notebook-value--bold">{formatNumber(data.distribution.skewness)}</span>
                  </div>
                )}
                {data.distribution.excess_kurtosis != null && (
                  <div className="notebook-row">
                    <span className="notebook-label">Excess Kurtosis:</span>
                    <span className="notebook-value notebook-value--bold">{formatNumber(data.distribution.excess_kurtosis)}</span>
                  </div>
                )}
              </div>
            )}
            {data.distribution.jarque_bera_pvalue != null && (
              <div className="notebook-table" style={{ marginTop: 'var(--spacing-sm)' }}>
                <div className="notebook-row">
                  <span className="notebook-label">Jarque-Bera p-value (Portfolio):</span>
                  <span className="notebook-value notebook-value--bold" style={{ color: normalColor(data.distribution.jarque_bera_pvalue > 0.05) }}>
                    {formatNumber(data.distribution.jarque_bera_pvalue, 4)}
                    <span className="normality-annotation">
                      {data.distribution.is_normal ? '(normal distribution)' : '(non-normal distribution)'}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ── Benchmark Analysis ── */}
        {data.benchmark_analysis && !data.benchmark_analysis.error && (
          <Card className="result-summary-card notebook-style">
            <h3 className="notebook-section-title">BENCHMARK ANALYSIS</h3>
            {getBenchmarkInsight(data)}
            <div className="metric-cards-grid">
              {data.benchmark_analysis.tracking_error_annual != null && (
                <MetricCard label="Tracking Error (Annual)" value={formatPercent(data.benchmark_analysis.tracking_error_annual)} />
              )}
              {data.benchmark_analysis.information_ratio != null && (
                <MetricCard label="Information Ratio" value={formatNumber(data.benchmark_analysis.information_ratio)} hint={data.benchmark_analysis.information_interpretation} />
              )}
              {data.benchmark_analysis.beta != null && (
                <MetricCard label="Beta" value={formatNumber(data.benchmark_analysis.beta)} hint={data.benchmark_analysis.beta_interpretation} />
              )}
              {data.benchmark_analysis.r_squared != null && (
                <MetricCard label="R²" value={formatPercent(data.benchmark_analysis.r_squared)} />
              )}
              {data.benchmark_analysis.alpha_annual != null && (
                <MetricCard label="Alpha (Annual)" value={formatPercent(data.benchmark_analysis.alpha_annual)} color={posNeg(data.benchmark_analysis.alpha_annual)} hint={data.benchmark_analysis.alpha_interpretation} />
              )}
            </div>
          </Card>
        )}

        {/* ── Portfolio vs Benchmark ── */}
        {data.portfolio_vs_benchmark && !data.portfolio_vs_benchmark.error && (
          <Card className="result-summary-card notebook-style">
            <h3 className="notebook-section-title">PORTFOLIO vs BENCHMARK</h3>
            {getPortfolioVsBenchmarkInsight(data)}
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th></th>
                    <th className="text-right">Annual Return</th>
                    <th className="text-right">Annual Volatility</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="td-bold">Portfolio</td>
                    <td className="text-right" style={{ fontWeight: 600, color: posNeg(data.portfolio_vs_benchmark.portfolio.annual_return) }}>
                      {formatPercent(data.portfolio_vs_benchmark.portfolio.annual_return)}
                    </td>
                    <td className="text-right">{formatPercent(data.portfolio_vs_benchmark.portfolio.annual_volatility)}</td>
                  </tr>
                  <tr>
                    <td className="td-bold">{data.benchmark_name || 'Benchmark'}</td>
                    <td className="text-right" style={{ fontWeight: 600, color: posNeg(data.portfolio_vs_benchmark.benchmark.annual_return) }}>
                      {formatPercent(data.portfolio_vs_benchmark.benchmark.annual_return)}
                    </td>
                    <td className="text-right">{formatPercent(data.portfolio_vs_benchmark.benchmark.annual_volatility)}</td>
                  </tr>
                  <tr className="row-highlight">
                    <td className="td-bold">Excess</td>
                    <td className="text-right" style={{ fontWeight: 700, color: posNeg(data.portfolio_vs_benchmark.excess_return) }}>
                      {data.portfolio_vs_benchmark.excess_return >= 0 ? '+' : ''}{formatPercent(data.portfolio_vs_benchmark.excess_return)}
                    </td>
                    <td className="text-right" style={{ fontWeight: 500, color: data.portfolio_vs_benchmark.excess_volatility <= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                      {data.portfolio_vs_benchmark.excess_volatility >= 0 ? '+' : ''}{formatPercent(data.portfolio_vs_benchmark.excess_volatility)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── Correlation Matrix ── */}
        {data.correlation && !data.correlation.error && (
          <Card className="result-summary-card notebook-style">
            <h3 className="notebook-section-title">CORRELATION MATRIX</h3>
            {getCorrelationInsight(data)}
            {data.correlation.correlation_matrix && typeof data.correlation.correlation_matrix === 'object' && (
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th></th>
                      {Object.keys(data.correlation.correlation_matrix).map(t => (
                        <th key={t} className="text-center">{t}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.correlation.correlation_matrix).map(([t1, corrs]) => {
                      if (!corrs || typeof corrs !== 'object') return null;
                      return (
                        <tr key={t1}>
                          <td className="td-ticker">{t1}</td>
                          {Object.entries(corrs).map(([t2, value]) => {
                            const v = Number(value);
                            const isDiag = t1 === t2;
                            return (
                              <td key={t2} className="text-center" style={{
                                fontWeight: isDiag ? 600 : 400,
                                color: isDiag ? 'var(--text-primary)' : 'var(--text-secondary)',
                                backgroundColor: isDiag ? 'var(--bg-tertiary)' :
                                  v > 0.7 ? 'rgba(5, 150, 105, 0.08)' :
                                  v < 0.3 ? 'rgba(220, 38, 38, 0.05)' : 'transparent'
                              }}>
                                {formatNumber(value, 3)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {(data.correlation.avg_correlation != null || data.correlation.max_correlation != null || data.correlation.min_correlation != null) && (
              <div className="notebook-table" style={{ marginTop: 'var(--spacing-md)' }}>
                {data.correlation.avg_correlation != null && (
                  <div className="notebook-row">
                    <span className="notebook-label">Average Correlation:</span>
                    <span className="notebook-value notebook-value--bold">{formatNumber(data.correlation.avg_correlation, 3)}</span>
                  </div>
                )}
                {data.correlation.max_correlation != null && (
                  <div className="notebook-row">
                    <span className="notebook-label">Max Correlation:</span>
                    <span className="notebook-value">{formatNumber(data.correlation.max_correlation, 3)}</span>
                  </div>
                )}
                {data.correlation.min_correlation != null && (
                  <div className="notebook-row">
                    <span className="notebook-label">Min Correlation:</span>
                    <span className="notebook-value">{formatNumber(data.correlation.min_correlation, 3)}</span>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* ── Key Insights ── */}
        <Card className="result-summary-card notebook-style section-spacer">
          <h3 className="notebook-section-title">KEY INSIGHTS</h3>
          <div className="insights-grid">
            {data.ratios && data.ratios.sharpe_ratio != null && (
              <div className="insight-kpi insight-kpi--blue">
                <strong className="insight-kpi__title">Risk-Adjusted Performance</strong>
                <p className="insight-kpi__body">
                  Sharpe Ratio of <strong style={{ color: '#3b82f6' }}>{formatNumber(data.ratios.sharpe_ratio)}</strong> indicates{' '}
                  <strong>{sharpeLabel(data.ratios.sharpe_ratio)}</strong>{' '}
                  risk-adjusted returns. The portfolio generates{' '}
                  <strong style={{ color: '#3b82f6' }}>{formatNumber(data.ratios.sharpe_ratio)}</strong> units of return per unit of risk taken.
                </p>
              </div>
            )}

            {ddWorst && (
              <div className="insight-kpi insight-kpi--red">
                <strong className="insight-kpi__title">Downside Risk</strong>
                <p className="insight-kpi__body">
                  Worst individual drawdown: <strong>{ddWorst[0]}</strong> with{' '}
                  <strong style={{ color: 'var(--danger)' }}>{formatPercent(ddWorst[1].max_drawdown)}</strong>,
                  lasting <strong>{ddWorst[1].max_underwater_duration || 'N/A'}</strong> days.
                  {ddBest && (
                    <> Best: <strong>{ddBest[0]}</strong> with{' '}
                    <strong style={{ color: 'var(--danger)' }}>{formatPercent(ddBest[1].max_drawdown)}</strong>.</>
                  )}
                </p>
              </div>
            )}

            {data.benchmark_analysis && data.benchmark_analysis.alpha_annual != null && (
              <div className={`insight-kpi ${data.benchmark_analysis.alpha_annual >= 0 ? 'insight-kpi--positive' : 'insight-kpi--negative'}`}>
                <strong className="insight-kpi__title">Benchmark Comparison</strong>
                <p className="insight-kpi__body">
                  Alpha of <strong style={{ color: posNeg(data.benchmark_analysis.alpha_annual) }}>
                    {formatPercent(data.benchmark_analysis.alpha_annual)}
                  </strong> (annual) indicates the portfolio{' '}
                  <strong>{data.benchmark_analysis.alpha_annual >= 0 ? 'outperforms' : 'underperforms'}</strong> the benchmark
                  with a beta of <strong>{formatNumber(data.benchmark_analysis.beta)}</strong> and
                  R² of <strong>{formatPercent(data.benchmark_analysis.r_squared)}</strong>.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  } catch (error) {
    if (!renderError) {
      setTimeout(() => setRenderError(error), 0);
    }
    return (
      <Card className="result-summary-card">
        <div className="dashboard-error">
          <h3 className="dashboard-error__title">Error rendering the dashboard</h3>
          <p className="dashboard-error__message">{error.message || 'Unknown error'}</p>
          <details className="dashboard-error__details">
            <summary className="dashboard-error__summary">View error details</summary>
            <pre className="dashboard-error__stack">{error.stack || error.toString()}</pre>
          </details>
        </div>
      </Card>
    );
  }
};

export default RiskDashboard;
