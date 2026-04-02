import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, LineChart, Line, Cell, ReferenceLine, PieChart, Pie } from 'recharts';
import Card from '../Card/Card';
import './Results.css';
import './MacroSituationDashboard.css';

const CHART_COLORS = [
  '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#e11d48',
];

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
};

const CAPMResults = ({ data, type }) => {
  const [visibleSeries, setVisibleSeries] = useState({
    'Efficient Frontier': true,
    'Capital Market Line (CML)': true,
    'Risk-Free Rate': true,
    'Tangent Portfolio': true,
  });

  const handleLegendClick = (dataKey) => {
    setVisibleSeries(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };

  if (!data) return null;

  const fmt = (v, d = 2) => v != null && !isNaN(v) ? Number(v).toFixed(d) : 'N/A';
  const fmtPct = (v, d = 2) => v != null && !isNaN(v) ? (Number(v) * 100).toFixed(d) + '%' : 'N/A';

  if (type === 'analyze') {
    const isSignificant = data.is_significant || false;
    const alphaDaily = data.alpha_daily !== undefined ? data.alpha_daily : (data.alpha !== undefined ? data.alpha : null);
    const alphaAnnual = data.alpha_annual !== undefined ? data.alpha_annual : null;
    
    const vizData = data.visualization_data || {};
    const scatterData = vizData.scatter || [];
    const regressionLine = vizData.regression_line || [];
    const histogram = vizData.histogram || [];

    const getSingleAssetInsight = () => {
      const parts = [];
      const warnings = [];
      let calloutType = '';

      if (data.beta != null) {
        if (data.beta > 1.5) {
          parts.push(`Beta of ${fmt(data.beta)} makes this a high-beta asset — it amplifies market moves by ${((data.beta - 1) * 100).toFixed(0)}%, increasing both upside potential and downside risk.`);
          warnings.push(`High beta (${fmt(data.beta)}) implies elevated systematic risk. In a market correction, this asset could decline significantly more than the benchmark.`);
        } else if (data.beta > 1) {
          parts.push(`Beta of ${fmt(data.beta)} indicates slightly higher volatility than the market — expect amplified moves in both directions.`);
        } else if (data.beta > 0.7) {
          parts.push(`Beta of ${fmt(data.beta)} indicates moderate market sensitivity — a defensive-to-neutral profile.`);
        } else if (data.beta > 0) {
          parts.push(`Beta of ${fmt(data.beta)} signals low market sensitivity — behaves as a defensive asset, suitable for risk reduction.`);
        } else {
          parts.push(`Negative beta (${fmt(data.beta)}) — this asset moves inversely to the market, acting as a natural hedge.`);
        }
      }

      if (data.r_squared != null) {
        if (data.r_squared > 0.8) {
          parts.push(`R² of ${fmtPct(data.r_squared, 1)} — the market explains most of this asset's variance. Idiosyncratic risk is low.`);
        } else if (data.r_squared > 0.5) {
          parts.push(`R² of ${fmtPct(data.r_squared, 1)} — moderate market dependence; significant idiosyncratic factors are at play.`);
        } else {
          parts.push(`R² of ${fmtPct(data.r_squared, 1)} — the market explains less than half of the variance. Asset-specific factors dominate.`);
          warnings.push(`Low R² (${fmtPct(data.r_squared, 1)}) means CAPM has limited explanatory power for this asset. Consider multi-factor models (Fama-French, Carhart) for a better fit.`);
        }
      }

      if (alphaAnnual != null) {
        if (isSignificant && alphaAnnual > 0) {
          calloutType = 'callout-success';
          parts.push(`Statistically significant positive alpha of ${fmtPct(alphaAnnual)} annualized — the asset generates genuine excess returns beyond CAPM predictions. This suggests the asset is undervalued or has a persistent edge.`);
        } else if (isSignificant && alphaAnnual < 0) {
          calloutType = 'callout-danger';
          parts.push(`Statistically significant negative alpha of ${fmtPct(alphaAnnual)} — the asset consistently underperforms its risk-adjusted expectation. This suggests overvaluation or structural drag.`);
          warnings.push(`Negative significant alpha indicates persistent underperformance. Holding this asset means accepting returns below what CAPM predicts for its risk level.`);
        } else {
          parts.push(`Alpha of ${fmtPct(alphaAnnual)} is not statistically significant (p=${data.p_value != null ? fmt(data.p_value, 4) : 'N/A'}) — the asset behaves as CAPM predicts. Any observed outperformance or underperformance could be due to random variation.`);
        }
      }

      if (data.expected_return != null && data.market_return_annual != null) {
        const premium = data.expected_return - data.market_return_annual;
        if (premium > 0) {
          parts.push(`CAPM expected return of ${fmtPct(data.expected_return)} exceeds the market return of ${fmtPct(data.market_return_annual)} by ${fmtPct(premium)} — consistent with higher systematic risk exposure.`);
        } else if (premium < 0) {
          parts.push(`CAPM expected return of ${fmtPct(data.expected_return)} is below the market return of ${fmtPct(data.market_return_annual)} — reflecting lower systematic risk.`);
        }
      }

      return (
        <>
          <div className={`insight-callout ${calloutType}`}>
            {parts.map((p, i) => <span key={i}>{p}{i < parts.length - 1 ? ' ' : ''}</span>)}
            {isSignificant && alphaAnnual != null && (
              <span className="insight-conclusion">
                {alphaAnnual > 0
                  ? 'Conclusion: The asset exhibits genuine risk-adjusted outperformance. Consider for alpha-seeking allocations.'
                  : 'Conclusion: The asset fails to compensate for its systematic risk. Review whether continued exposure is justified.'}
              </span>
            )}
            {!isSignificant && (
              <span className="insight-conclusion">
                Conclusion: Returns are consistent with efficient market pricing — use beta for risk budgeting, not alpha for alpha-seeking.
              </span>
            )}
          </div>
          {warnings.length > 0 && (
            <div className="insight-callout callout-warning">
              {warnings.map((w, i) => <span key={i}>{w}{i < warnings.length - 1 ? ' ' : ''}</span>)}
            </div>
          )}
        </>
      );
    };
    
    return (
      <div className="results-container">
        {/* Analysis Header */}
        <div className="notebook-header">
          <h2>CAPM ANALYSIS</h2>
        </div>

        {/* Dynamic Insight */}
        <Card className="result-summary-card notebook-style">
          <h3 className="notebook-section-title">ANALYSIS SUMMARY</h3>
          {getSingleAssetInsight()}
        </Card>

        {/* Model Parameters Section */}
        <Card className="result-summary-card notebook-style" style={{ marginTop: 'var(--spacing-lg)' }}>
          <h3 className="notebook-section-title">MODEL PARAMETERS</h3>
          <div className="notebook-table">
            <div className="notebook-row">
              <span className="notebook-label">
                Beta (β):
                <span className="normality-hint">Sensitivity to market movements. β=1 means same as market.</span>
              </span>
              <span className="notebook-value" style={{ fontWeight: 'bold' }}>
                {data.beta != null ? data.beta.toFixed(4) : 'N/A'}
                {data.beta != null && (
                  <span className="normality-annotation">
                    {data.beta > 1.3 ? '(aggressive)' : data.beta > 1 ? '(slightly aggressive)' : data.beta > 0.7 ? '(moderate)' : data.beta > 0 ? '(defensive)' : '(inverse)'}
                  </span>
                )}
              </span>
            </div>
            <div className="notebook-row">
              <span className="notebook-label">
                Correlation:
                <span className="normality-hint">Linear relationship with the market. 1 = perfect, 0 = none.</span>
              </span>
              <span className="notebook-value">
                {data.correlation != null ? data.correlation.toFixed(4) : 'N/A'}
                {data.correlation != null && (
                  <span className="normality-annotation">
                    {Math.abs(data.correlation) > 0.8 ? '(strong)' : Math.abs(data.correlation) > 0.5 ? '(moderate)' : '(weak)'}
                  </span>
                )}
              </span>
            </div>
            <div className="notebook-row">
              <span className="notebook-label">
                R²:
                <span className="normality-hint">Proportion of variance explained by the market.</span>
              </span>
              <span className="notebook-value">
                {data.r_squared != null ? data.r_squared.toFixed(4) : 'N/A'}
                {data.r_squared != null && (
                  <span className="normality-annotation">
                    {data.r_squared > 0.8 ? '(high fit)' : data.r_squared > 0.5 ? '(moderate fit)' : '(low fit)'}
                  </span>
                )}
              </span>
            </div>
          </div>
        </Card>

        {/* Expected Return Section */}
        {data.expected_return !== undefined && data.expected_return !== null && (
          <Card className="result-summary-card notebook-style" style={{ marginTop: 'var(--spacing-lg)' }}>
            <h3 className="notebook-section-title">EXPECTED RETURN (CAPM)</h3>
            <div className="notebook-table">
              <div className="notebook-row">
                <span className="notebook-label">Expected Return (1-year):</span>
                <span className="notebook-value" style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#3b82f6' }}>
                  {((data.expected_return || 0) * 100).toFixed(2)}%
                </span>
              </div>
              <div className="notebook-row">
                <span className="notebook-label">Formula:</span>
                <span className="notebook-value" style={{ fontSize: '0.875rem' }}>
                  E(R) = Rf + β × (Rm - Rf)
                </span>
              </div>
              {data.market_return_annual !== undefined && data.market_return_annual !== null && (
                <div className="notebook-row" style={{ 
                  marginTop: 'var(--spacing-sm)',
                  paddingTop: 'var(--spacing-sm)',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  <span className="notebook-label" style={{ fontSize: '0.875rem' }}>
                    Market Return (Annual){data.market_ticker ? ` (${data.market_ticker})` : ''}:
                  </span>
                  <span className="notebook-value" style={{ fontSize: '0.875rem' }}>
                    {((data.market_return_annual || 0) * 100).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Alpha (Jensen) Section */}
        <Card className="result-summary-card notebook-style" style={{ marginTop: 'var(--spacing-lg)' }}>
          <h3 className="notebook-section-title">ALPHA — Jensen's Alpha</h3>

          {/* Definition */}
          <p className="notebook-description">
            <strong>Jensen's Alpha (α)</strong> measures the excess return an asset generates above or below what CAPM predicts
            given its level of systematic risk (β). It answers: <em>"After accounting for market risk, did this asset over- or underperform?"</em>
            A positive α means the asset beat its risk-adjusted benchmark; a negative α signals it fell short.
            Statistical significance (p&nbsp;&lt;&nbsp;0.05) is required to confirm that the observed alpha is not merely random noise.
            The daily alpha is annualized using the compound formula: α_annual = (1&nbsp;+&nbsp;α_daily)^252 − 1.
          </p>

          <div className="notebook-table">
            <div className="notebook-row">
              <span className="notebook-label">Alpha Daily:</span>
              <span className={`notebook-value ${alphaDaily !== null && alphaDaily < 0 ? 'negative' : 'positive'}`}>
                {alphaDaily !== null && alphaDaily !== undefined ? (alphaDaily * 100).toFixed(4) + '%' : 'N/A'}
              </span>
            </div>
            <div className="notebook-row">
              <span className="notebook-label">Alpha Annual:</span>
              <span
                className={`notebook-value ${alphaAnnual !== null && alphaAnnual !== undefined && alphaAnnual < 0 ? 'negative' : 'positive'}`}
                style={{ fontWeight: 'bold', fontSize: '1.1rem' }}
              >
                {alphaAnnual !== null && alphaAnnual !== undefined ? (alphaAnnual * 100).toFixed(2) + '%' : 'N/A'}
              </span>
            </div>
          </div>

          {/* Dynamic interpretation */}
          {alphaAnnual !== null && (() => {
            let interpretation = '';
            let implication = '';
            let borderColor = '#94a3b8';
            let bgColor = 'rgba(100,116,139,0.05)';

            if (alphaAnnual > 0) {
              borderColor = '#10b981';
              bgColor = 'rgba(16,185,129,0.06)';
              if (isSignificant) {
                interpretation = `The asset generates a statistically significant positive Jensen's Alpha of ${fmtPct(alphaAnnual)} per year — it produces ${fmtPct(alphaAnnual)} more annual return than CAPM prescribes for its level of systematic risk. This constitutes genuine risk-adjusted outperformance.`;
                implication = `✅ Strong evidence of persistent outperformance. Consider this asset for alpha-seeking allocations. Monitor for regime changes that may erode the alpha over time.`;
              } else {
                interpretation = `The asset shows a positive alpha of ${fmtPct(alphaAnnual)} per year, but the result is not statistically significant (p = ${data.p_value != null ? fmt(data.p_value, 4) : 'N/A'}). The observed outperformance could be attributable to random variation rather than a genuine pricing edge.`;
                implication = `⚠️ Positive but inconclusive. Do not rely on this alpha for investment decisions without a longer data sample or corroborating evidence (e.g. Fama-French multi-factor confirmation).`;
              }
            } else if (alphaAnnual < 0) {
              borderColor = '#ef4444';
              bgColor = 'rgba(239,68,68,0.06)';
              if (isSignificant) {
                interpretation = `The asset exhibits a statistically significant negative Jensen's Alpha of ${fmtPct(alphaAnnual)} per year. It consistently underperforms its risk-adjusted expectation, delivering ${fmtPct(Math.abs(alphaAnnual))} less annually than CAPM predicts for its beta.`;
                implication = `❌ Significant underperformance. This asset fails to compensate investors for its systematic risk. Continued exposure should be critically reviewed — passive alternatives may offer better risk-adjusted returns.`;
              } else {
                interpretation = `The asset shows a negative alpha of ${fmtPct(alphaAnnual)} per year, but this is not statistically significant (p = ${data.p_value != null ? fmt(data.p_value, 4) : 'N/A'}). The underperformance may reflect random noise rather than a structural problem.`;
                implication = `⚠️ Negative but inconclusive. Returns are broadly consistent with efficient market pricing for this risk level. Extend the sample period before drawing conclusions.`;
              }
            } else {
              interpretation = `Alpha is approximately zero — the asset returns almost exactly what CAPM predicts for its level of systematic risk.`;
              implication = `The asset appears fairly priced according to CAPM. There is no evidence of systematic outperformance or underperformance.`;
            }

            return (
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                <div style={{
                  padding: 'var(--spacing-md)',
                  backgroundColor: bgColor,
                  borderLeft: `3px solid ${borderColor}`,
                  borderRadius: '0 8px 8px 0',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  <p style={{ margin: '0 0 var(--spacing-xs) 0', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.65' }}>
                    {interpretation}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.65', fontStyle: 'italic' }}>
                    {implication}
                  </p>
                </div>
                <div style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5'
                }}>
                  <strong>Alpha magnitude reference:</strong>&nbsp;
                  |α|&nbsp;&lt;&nbsp;2% = low &nbsp;·&nbsp; 2–5% = moderate &nbsp;·&nbsp; 5–10% = high &nbsp;·&nbsp; &gt;10% = exceptional
                  <em style={{ marginLeft: 4 }}>(treat very large values on short samples with caution — potential overfitting)</em>
                </div>
              </div>
            );
          })()}
        </Card>

        {/* Statistical Significance Section */}
        <Card className="result-summary-card notebook-style" style={{ marginTop: 'var(--spacing-lg)' }}>
          <h3 className="notebook-section-title">STATISTICAL SIGNIFICANCE</h3>

          <p className="notebook-description">
            The significance test (HAC Newey-West robust standard errors) evaluates whether the observed alpha is statistically
            distinguishable from zero. The <strong>t-statistic</strong> measures how many standard errors α is from zero;
            the <strong>p-value</strong> is the probability of observing such a result by chance under the null hypothesis α&nbsp;=&nbsp;0.
            A p-value&nbsp;&lt;&nbsp;0.05 (two-tailed) is the conventional threshold for statistical significance.
          </p>

          {/* Alpha significance */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
            Alpha Significance Test
          </div>
          <div className="notebook-table">
            <div className="notebook-row">
              <span className="notebook-label">Alpha T-Statistic:</span>
              <span className="notebook-value">
                {data.t_statistic !== undefined && data.t_statistic !== null ? data.t_statistic.toFixed(4) : 'N/A'}
              </span>
            </div>
            <div className="notebook-row">
              <span className="notebook-label">Alpha P-Value:</span>
              <span className="notebook-value" style={{
                fontWeight: 'bold',
                color: (data.p_value !== undefined && data.p_value !== null && data.p_value < 0.05) ? '#10b981' : '#ef4444'
              }}>
                {data.p_value !== undefined && data.p_value !== null ? data.p_value.toFixed(4) : 'N/A'}
                {data.p_value !== undefined && data.p_value !== null && (
                  <span style={{ marginLeft: 'var(--spacing-xs)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                    {data.p_value < 0.05 ? '(p < 0.05 ✓)' : '(p > 0.05, not significant)'}
                  </span>
                )}
              </span>
            </div>
            <div className="notebook-row">
              <span className="notebook-label">Alpha Significant (α=0.05):</span>
              <span className="notebook-value">
                <span
                  className="significance-badge"
                  style={{
                    backgroundColor: isSignificant ? '#10b981' : '#ef4444',
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {isSignificant ? '✓ YES' : '✗ NO'}
                </span>
              </span>
            </div>
          </div>

          {/* Beta significance (available after alpha_significance improvements) */}
          {data.beta_t_statistic != null && (
            <>
              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: 'var(--spacing-md) 0 var(--spacing-sm) 0' }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
                Beta Significance Test
              </div>
              <div className="notebook-table">
                <div className="notebook-row">
                  <span className="notebook-label">Beta T-Statistic:</span>
                  <span className="notebook-value">{fmt(data.beta_t_statistic, 4)}</span>
                </div>
                <div className="notebook-row">
                  <span className="notebook-label">Beta P-Value:</span>
                  <span className="notebook-value" style={{
                    fontWeight: 'bold',
                    color: data.beta_p_value < 0.05 ? '#10b981' : '#ef4444'
                  }}>
                    {fmt(data.beta_p_value, 4)}
                    <span style={{ marginLeft: 'var(--spacing-xs)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                      {data.beta_p_value < 0.05 ? '(p < 0.05 ✓)' : '(p > 0.05, not significant)'}
                    </span>
                  </span>
                </div>
                <div className="notebook-row">
                  <span className="notebook-label">Beta Significant (α=0.05):</span>
                  <span className="notebook-value">
                    <span
                      style={{
                        backgroundColor: data.beta_is_significant ? '#10b981' : '#ef4444',
                        color: 'white',
                        padding: '6px 16px',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {data.beta_is_significant ? '✓ YES' : '✗ NO'}
                    </span>
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Interpretation of significance outcome */}
          <div style={{
            marginTop: 'var(--spacing-md)',
            padding: 'var(--spacing-md)',
            backgroundColor: isSignificant ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
            borderLeft: `3px solid ${isSignificant ? '#10b981' : '#ef4444'}`,
            borderRadius: '0 8px 8px 0',
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            lineHeight: '1.65'
          }}>
            {isSignificant ? (
              <>
                <strong>Statistically significant alpha detected.</strong> With p&nbsp;=&nbsp;{data.p_value != null ? fmt(data.p_value, 4) : 'N/A'} and
                t-stat&nbsp;=&nbsp;{data.t_statistic != null ? fmt(data.t_statistic, 4) : 'N/A'}, there is strong statistical evidence
                that the true alpha is different from zero. The result is unlikely to be due to chance.
                {alphaAnnual > 0
                  ? ' The asset has systematically outperformed its CAPM-predicted return.'
                  : ' The asset has systematically underperformed its CAPM-predicted return.'}
              </>
            ) : (
              <>
                <strong>Alpha is not statistically significant.</strong> With p&nbsp;=&nbsp;{data.p_value != null ? fmt(data.p_value, 4) : 'N/A'},
                the observed alpha of {alphaAnnual != null ? fmtPct(alphaAnnual) : 'N/A'} is within the range of random variation
                expected under the null hypothesis (α&nbsp;=&nbsp;0). There is insufficient evidence to claim genuine outperformance or underperformance.
                Consider using a longer historical window or a multi-factor model for a more robust assessment.
              </>
            )}
          </div>
        </Card>

        {/* CAPM Regression Chart */}
        {scatterData.length > 0 && regressionLine.length > 0 && (() => {
          // Calculate range for market line (β=1)
          const marketExcessValues = scatterData.map(d => d.market_excess);
          const minMarket = Math.min(...marketExcessValues);
          const maxMarket = Math.max(...marketExcessValues);
          
          // Market line (β=1, α=0): y = x
          const marketLine = [
            { x: minMarket, y: minMarket },
            { x: maxMarket, y: maxMarket }
          ];
          
          return (
            <Card className="result-chart-card">
              <h3 className="result-section-title">CAPM REGRESSION</h3>
              <ResponsiveContainer width="100%" height={500}>
                <ScatterChart margin={{ top: 30, right: 40, bottom: 80, left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="x" 
                    name="Market Excess Return"
                    type="number"
                    label={{ 
                      value: 'Market Excess Return (%)', 
                      position: 'insideBottom', 
                      offset: -15,
                      style: { fontSize: 14, fontWeight: 500, fill: '#475569' }
                    }}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    stroke="#94a3b8"
                    tickFormatter={(value) => `${(value * 100).toFixed(1)}`}
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis 
                    dataKey="y"
                    name="Asset Excess Return"
                    type="number"
                    label={{ 
                      value: 'Asset Excess Return (%)', 
                      angle: -90, 
                      position: 'insideLeft',
                      offset: -10,
                      style: { fontSize: 14, fontWeight: 500, fill: '#475569' }
                    }}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    stroke="#94a3b8"
                    tickFormatter={(value) => `${(value * 100).toFixed(1)}`}
                    domain={['dataMin', 'dataMax']}
                  />
                <Tooltip 
                  formatter={(value) => `${(value * 100).toFixed(2)}%`}
                  contentStyle={TOOLTIP_STYLE}
                />
                  <Legend 
                    verticalAlign="top" 
                    height={70}
                    wrapperStyle={{ paddingTop: '10px', paddingBottom: '10px' }}
                    iconType="line"
                  />
                  
                  {/* Market Reference Line (β=1) */}
                  <Scatter 
                    name="Market (β=1)" 
                    data={marketLine} 
                    fill="none"
                    line={{ stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '5 5' }}
                    shape={() => null}
                    isAnimationActive={false}
                  />
                  
                  {/* Scatter points - Observations */}
                  <Scatter 
                    name="Observations" 
                    data={scatterData.map(d => ({ x: d.market_excess, y: d.asset_excess }))} 
                    fill="#2563eb" 
                    fillOpacity={0.4}
                    stroke="#2563eb"
                    strokeWidth={0.5}
                  />
                  
                  {/* CAPM Regression line */}
                  <Scatter 
                    name={`CAPM: α=${alphaDaily !== null ? (alphaDaily * 100).toFixed(4) : 'N/A'}%, β=${data.beta?.toFixed(3) || 'N/A'}`}
                    data={regressionLine.map(p => ({ x: p.x, y: p.y }))} 
                    fill="#ef4444" 
                    line={{ stroke: '#ef4444', strokeWidth: 2.5 }}
                    shape={() => null}
                    isAnimationActive={false}
                  />
                </ScatterChart>
              </ResponsiveContainer>
              <div style={{ 
                marginTop: 'var(--spacing-md)', 
                padding: 'var(--spacing-sm)',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}>
                <strong>Interpretation:</strong> The <strong style={{ color: '#ef4444' }}>red solid line</strong> shows the CAPM regression. 
                The <strong style={{ color: '#94a3b8' }}>gray dashed line</strong> represents the market (β=1) as a reference. 
                Points above the market line indicate outperformance relative to market risk.
              </div>
            </Card>
          );
        })()}

        {/* Residuals Distribution */}
        {histogram.length > 0 && (() => {
          const residualValues = histogram.map(h => h.bin).filter(v => v != null);
          const totalCount = histogram.reduce((s, h) => s + (h.count || 0), 0);
          const residualMean = totalCount > 0
            ? histogram.reduce((s, h) => s + (h.bin || 0) * (h.count || 0), 0) / totalCount
            : 0;
          const isCentered = Math.abs(residualMean) < 0.002;
          const maxResidual = Math.max(...residualValues.map(Math.abs));
          const hasOutliers = maxResidual > 0.03;

          return (
            <Card className="result-chart-card">
              <h3 className="result-section-title">RESIDUALS DISTRIBUTION</h3>
              <p className="notebook-description">
                Residuals represent the portion of returns not explained by the market (CAPM). A well-specified model
                should produce residuals centered around zero with no systematic pattern. Heavy tails or asymmetry
                suggest the model is missing risk factors.
              </p>
              <div className={`insight-callout ${isCentered && !hasOutliers ? '' : 'callout-warning'}`} style={{ marginBottom: 'var(--spacing-md)' }}>
                {isCentered
                  ? 'Residuals are approximately centered around zero — no systematic bias detected in the CAPM model.'
                  : `Residual mean of ${(residualMean * 100).toFixed(3)}% deviates from zero — the model may be slightly biased.`}
                {hasOutliers && (
                  <> Maximum residual of {(maxResidual * 100).toFixed(2)}% indicates occasional large deviations from CAPM predictions — consider fat-tail models or additional risk factors.</>
                )}
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={histogram} margin={{ top: 30, right: 40, bottom: 80, left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="bin" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    stroke="#94a3b8"
                    label={{ 
                      value: 'Residuals (%)', 
                      position: 'insideBottom', 
                      offset: -15,
                      style: { fontSize: 14, fontWeight: 500, fill: '#475569' }
                    }}
                    tickFormatter={(value) => (value * 100).toFixed(1)}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    stroke="#94a3b8"
                    label={{ 
                      value: 'Frequency', 
                      angle: -90, 
                      position: 'insideLeft',
                      offset: -10,
                      style: { fontSize: 14, fontWeight: 500, fill: '#475569' }
                    }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [value, 'Frequency']}
                    labelFormatter={(value) => `Residual: ${(value * 100).toFixed(2)}%`}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Bar dataKey="count" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          );
        })()}

        {/* Removed old static Key Insights — replaced by ANALYSIS SUMMARY above */}
      </div>
    );
  }

  if (type === 'multi') {
    let assets = [];
    if (Array.isArray(data)) {
      assets = data;
    } else if (typeof data === 'object' && data !== null) {
      assets = Object.keys(data);
    }

    const portfolioData = data['_portfolio'] || {};
    
    const multiData = assets
      .filter(asset => asset !== '_portfolio') 
      .map(asset => {
        const assetData = typeof asset === 'string' ? data[asset] : asset;
        const assetName = typeof asset === 'string' ? asset : (assetData?.asset || 'Unknown');
        const vizData = assetData?.visualization_data || {};
        return {
          asset: assetName.replace(/^\^/, ''),
          beta: assetData?.beta || 0,
          alpha: assetData?.alpha || 0,
          alphaDaily: assetData?.alpha_daily || assetData?.alpha || 0,
          alphaAnnual: assetData?.alpha_annual || (assetData?.alpha || 0) * 252 || 0,
          rSquared: assetData?.r_squared || assetData?.r2 || 0,
          isSignificant: assetData?.is_significant || false,
          expectedReturn: assetData?.expected_return || 0,
          scatterData: vizData.scatter || [],
          regressionLine: vizData.regression_line || [],
        };
      })
      .filter(item => item.asset !== 'Unknown');

    const avgBeta = multiData.reduce((sum, d) => sum + d.beta, 0) / multiData.length;
    const avgAlpha = multiData.reduce((sum, d) => sum + d.alphaAnnual, 0) / multiData.length;
    const avgR2 = multiData.reduce((sum, d) => sum + d.rSquared, 0) / multiData.length;
    const significantCount = multiData.filter(d => d.isSignificant).length;
    const scatterData = multiData.map(d => ({
      beta: d.beta,
      alpha: d.alphaAnnual * 100, 
      alphaValue: d.alphaAnnual, 
      asset: d.asset,
      isSignificant: d.isSignificant
    }));
    const sortedByAlpha = [...multiData].sort((a, b) => b.alphaAnnual - a.alphaAnnual);
    const smlBetas = multiData.map(d => d.beta);
    const smlMinBeta = Math.min(...smlBetas);
    const smlMaxBeta = Math.max(...smlBetas);
    let smlRf = 0, smlMrp = 0;
    {
      const smlSorted2 = [...multiData].sort((a, b) => a.beta - b.beta);
      const b1 = smlSorted2[0].beta, b2 = smlSorted2[smlSorted2.length - 1].beta;
      if (Math.abs(b2 - b1) > 0.01) {
        smlMrp = (smlSorted2[smlSorted2.length - 1].expectedReturn - smlSorted2[0].expectedReturn) / (b2 - b1);
        smlRf = smlSorted2[0].expectedReturn - b1 * smlMrp;
      }
    }
    const smlBetaLow  = Math.min(0, smlMinBeta - 0.1);
    const smlBetaHigh = smlMaxBeta + 0.2;
    const smlLinePoints = [
      { x: smlBetaLow,  y: (smlRf + smlBetaLow  * smlMrp) * 100 },
      { x: smlBetaHigh, y: (smlRf + smlBetaHigh * smlMrp) * 100 },
    ];
    const smlAssetPoints = multiData.map(d => ({
      x: d.beta,
      y: (d.expectedReturn + d.alphaAnnual) * 100,   
      expectedY: d.expectedReturn * 100,              
      asset: d.asset,
      alphaAnnual: d.alphaAnnual,
      isSignificant: d.isSignificant,
    }));

    return (
      <div className="results-container">
        {/* Analysis Header */}
        <div className="notebook-header">
          <h2>CAPM ANALYSIS — MULTI-ASSET</h2>
        </div>

        {/* Dynamic Multi-Asset Insight */}
        <Card className="result-summary-card notebook-style">
          <h3 className="notebook-section-title">ANALYSIS SUMMARY</h3>
          {(() => {
            const parts = [];
            const warnings = [];
            let calloutType = '';

            // Beta profile
            const betas = multiData.map(d => d.beta);
            const minBeta = Math.min(...betas);
            const maxBeta = Math.max(...betas);
            const betaSpread = maxBeta - minBeta;
            const highBetaAssets = multiData.filter(d => d.beta > 1.3);
            const lowBetaAssets = multiData.filter(d => d.beta < 0.5);

            parts.push(`Portfolio of ${multiData.length} assets with average beta of ${avgBeta.toFixed(3)} (range: ${minBeta.toFixed(2)} to ${maxBeta.toFixed(2)}).`);

            if (avgBeta > 1.2) {
              parts.push(`The portfolio is aggressively positioned — it amplifies market moves by ${((avgBeta - 1) * 100).toFixed(0)}% on average.`);
              warnings.push(`Average beta of ${avgBeta.toFixed(3)} implies high systematic risk. A 10% market decline would translate to approximately ${(avgBeta * 10).toFixed(1)}% portfolio loss.`);
            } else if (avgBeta < 0.7) {
              parts.push(`The portfolio is defensively positioned, absorbing only ${(avgBeta * 100).toFixed(0)}% of market moves on average.`);
            }

            if (betaSpread > 1.0) {
              parts.push(`Wide beta dispersion (${betaSpread.toFixed(2)}) suggests diverse market sensitivity across assets — some act as shock absorbers while others amplify.`);
            }

            const positiveAlphas = multiData.filter(d => d.alphaAnnual > 0);
            const negativeAlphas = multiData.filter(d => d.alphaAnnual < 0);
            const sigPositive = multiData.filter(d => d.isSignificant && d.alphaAnnual > 0);

            if (sigPositive.length > 0) {
              calloutType = 'callout-success';
              parts.push(`${sigPositive.length} asset${sigPositive.length > 1 ? 's' : ''} (${sigPositive.map(d => d.asset).join(', ')}) show${sigPositive.length === 1 ? 's' : ''} statistically significant positive alpha — genuine risk-adjusted outperformance.`);
            }
            if (significantCount === 0) {
              parts.push(`None of the ${multiData.length} assets show statistically significant alpha — returns are consistent with CAPM pricing.`);
            }

            const lowR2Assets = multiData.filter(d => d.rSquared < 0.3);
            if (lowR2Assets.length > 0) {
              warnings.push(`${lowR2Assets.map(d => d.asset).join(', ')} ${lowR2Assets.length === 1 ? 'has' : 'have'} low R² (<30%) — CAPM explains little of ${lowR2Assets.length === 1 ? 'its' : 'their'} variance. Consider multi-factor models for these assets.`);
            }

            if (negativeAlphas.length > multiData.length / 2) {
              if (!calloutType) calloutType = 'callout-warning';
              warnings.push(`${negativeAlphas.length} of ${multiData.length} assets show negative alpha — the majority underperform CAPM expectations. Review asset selection.`);
            }

            if (highBetaAssets.length > 0) {
              warnings.push(`High-beta assets (${highBetaAssets.map(d => `${d.asset}: β=${d.beta.toFixed(2)}`).join(', ')}) concentrate systematic risk.`);
            }

            return (
              <>
                <div className={`insight-callout ${calloutType}`}>
                  {parts.map((p, i) => <span key={i}>{p}{i < parts.length - 1 ? ' ' : ''}</span>)}
                  <span className="insight-conclusion">
                    {sigPositive.length > 0
                      ? `Focus allocation on assets with significant alpha. ${sigPositive.map(d => d.asset).join(', ')} offer${sigPositive.length === 1 ? 's' : ''} the best risk-adjusted opportunity.`
                      : avgAlpha > 0
                        ? `Portfolio shows modest outperformance trend (avg alpha ${(avgAlpha * 100).toFixed(2)}%), but lack of significance warrants caution.`
                        : `Portfolio returns align with market pricing. Use beta to calibrate desired market exposure.`}
                  </span>
                </div>
                {warnings.length > 0 && (
                  <div className="insight-callout callout-warning">
                    {warnings.map((w, i) => <span key={i}>{w}{i < warnings.length - 1 ? ' ' : ''}</span>)}
                  </div>
                )}
              </>
            );
          })()}
        </Card>

        {/* General Statistics */}
        <Card className="result-summary-card">
          <h3 className="result-section-title">GENERAL STATISTICS</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Assets Analyzed</span>
              <span className="summary-value">
                {multiData.length}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Average Beta</span>
              <span className="summary-value">
                {avgBeta.toFixed(3)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Average Jensen's Alpha (Annual)</span>
              <span className={`summary-value ${avgAlpha >= 0 ? 'positive' : 'negative'}`}>
                {(avgAlpha * 100).toFixed(2)}%
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Average R²</span>
              <span className="summary-value">
                {avgR2.toFixed(3)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Significant Jensen's Alphas</span>
              <span className="summary-value">
                {significantCount} / {multiData.length}
              </span>
            </div>
          </div>
        </Card>

        {/* Portfolio Expected Return — moved to top for visibility */}
        {portfolioData.expected_return !== undefined && portfolioData.expected_return !== null && (
          <Card className="result-summary-card notebook-style" style={{ marginTop: 'var(--spacing-lg)' }}>
            <h3 className="notebook-section-title">PORTFOLIO EXPECTED RETURN (CAPM)</h3>
            <div style={{ padding: 'var(--spacing-md)' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: 'var(--spacing-md)',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
                    Portfolio Expected Return (1-year)
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '600', color: '#3b82f6' }}>
                    {((portfolioData.expected_return || 0) * 100).toFixed(2)}%
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: 'var(--spacing-md)',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
                    Portfolio Beta
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '600', color: '#1e293b' }}>
                    {(portfolioData.beta || avgBeta).toFixed(3)}
                  </div>
                </div>
                {portfolioData.market_return_annual !== undefined && portfolioData.market_return_annual !== null && (
                  <div style={{
                    backgroundColor: '#f8fafc',
                    padding: 'var(--spacing-md)',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
                      Market Return (Annual){portfolioData.market_ticker ? ` (${portfolioData.market_ticker})` : ''}
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '600', color: '#1e293b' }}>
                      {((portfolioData.market_return_annual || 0) * 100).toFixed(2)}%
                    </div>
                  </div>
                )}
              </div>
              <div style={{
                padding: 'var(--spacing-md)',
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
                fontSize: '0.95rem',
                color: '#1e40af',
                lineHeight: '1.7'
              }}>
                <strong>Interpretation:</strong> Based on CAPM, this portfolio should provide an expected return of{' '}
                <strong>{((portfolioData.expected_return || 0) * 100).toFixed(2)}%</strong> over the next year given its average beta of{' '}
                <strong>{(portfolioData.beta || avgBeta).toFixed(3)}</strong>. This represents the theoretical return the portfolio
                should generate based on its systematic risk exposure to the market.
              </div>
            </div>
          </Card>
        )}

        {/* Alpha vs Beta Scatter Plot */}
        {scatterData.length > 0 && (
          <Card className="result-chart-card">
            <h3 className="result-section-title">JENSEN'S ALPHA VS BETA COMPARISON</h3>
            <p className="notebook-description">
              Each dot represents one asset plotted by its <strong>beta</strong> (market sensitivity, x-axis) and
              <strong> Jensen's alpha</strong> (risk-adjusted outperformance, y-axis). Ideal assets sit in the
              <strong> upper-left quadrant</strong> — high alpha with low beta. The vertical dashed line at β=1
              marks market-equivalent sensitivity; the horizontal line at α=0% separates outperformers from underperformers.
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 20, right: 40, bottom: 60, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="beta" 
                  name="Beta"
                  label={{ value: 'Beta (Market Sensitivity)', position: 'insideBottom', offset: -10, style: { fontSize: 14, fontWeight: 500, fill: '#475569' } }}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  stroke="#94a3b8"
                  tickFormatter={(value) => value.toFixed(2)}
                  domain={['dataMin', 'dataMax']}
                />
                <YAxis 
                  dataKey="alpha"
                  name="Alpha"
                  label={{ value: "Jensen's Alpha (Annual %)", angle: -90, position: 'insideLeft', offset: -10, style: { fontSize: 14, fontWeight: 500, fill: '#475569' } }}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  stroke="#94a3b8"
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const alphaValue = data.alphaValue !== undefined ? data.alphaValue : (data.alpha / 100);
                      const betaValue = data.beta !== undefined ? data.beta : payload[0].value;
                      return (
                        <div style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '8px 12px',
                        }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {data.asset || 'Asset'}
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '0.875rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Beta: </span>
                            <span style={{ fontWeight: '600' }}>{betaValue.toFixed(3)}</span>
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '0.875rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Jensen's Alpha (Annual): </span>
                            <span style={{ 
                              color: alphaValue >= 0 ? '#10b981' : '#ef4444', 
                              fontWeight: '600' 
                            }}>
                              {(alphaValue * 100).toFixed(2)}%
                            </span>
                          </p>
                          {data.isSignificant !== undefined && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              Significant: {data.isSignificant ? 'Yes' : 'No'}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x={1} stroke="#94a3b8" strokeDasharray="5 5" label={{ value: 'β=1 (Market)', position: 'top' }} />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="5 5" />
                <Scatter 
                  name="Assets" 
                  data={scatterData} 
                  fill="#2563eb"
                  fillOpacity={0.6}
                  stroke="#1e40af"
                  strokeWidth={1.5}
                >
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isSignificant ? '#10b981' : '#2563eb'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ 
              marginTop: 'var(--spacing-sm)', 
              padding: 'var(--spacing-sm)',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)'
            }}>
              <strong>Legend:</strong> Green dots indicate statistically significant Jensen's alphas (p &lt; 0.05). 
              Blue dots indicate non-significant alphas.
            </div>
          </Card>
        )}

        {/* Top Performers */}
        {sortedByAlpha.length > 0 && (
          <Card className="result-summary-card">
            <h3 className="result-section-title">TOP PERFORMERS (HIGHEST JENSEN'S ALPHA)</h3>
            <div className="table-container">
              <table className="results-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>Rank</th>
                    <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>Asset</th>
                    <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>Jensen's Alpha (Annual)</th>
                    <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>Beta</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedByAlpha.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center', padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-color)' }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </td>
                      <td style={{ textAlign: 'left', padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-color)', fontWeight: '500' }}>{row.asset}</td>
                      <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-color)', color: row.alphaAnnual >= 0 ? '#10b981' : '#ef4444', fontWeight: '500' }}>
                        {(row.alphaAnnual * 100).toFixed(2)}%
                      </td>
                      <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-color)' }}>{row.beta.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Security Market Line (SML) */}
        <Card className="result-chart-card">
          <h3 className="result-section-title">SECURITY MARKET LINE (SML)</h3>
          <p className="notebook-description">
            The SML plots each asset's actual annual return against its beta. The <strong>blue line</strong> is the theoretical
            fair return for each beta level — E(R)&nbsp;=&nbsp;Rf&nbsp;+&nbsp;β&nbsp;×&nbsp;MRP. Assets <strong>above the SML</strong> have
            positive Jensen's alpha (undervalued / outperforming); assets <strong>below the SML</strong> have negative alpha
            (overvalued / underperforming). Larger dots = statistically significant alpha (p&nbsp;&lt;&nbsp;0.05).
          </p>
          <ResponsiveContainer width="100%" height={440}>
            <ScatterChart margin={{ top: 30, right: 60, bottom: 70, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="x"
                name="Beta"
                type="number"
                label={{ value: 'Beta (β)', position: 'insideBottom', offset: -15, style: { fontSize: 14, fontWeight: 500, fill: '#475569' } }}
                tick={{ fontSize: 12, fill: '#64748b' }}
                stroke="#94a3b8"
                tickFormatter={(v) => v.toFixed(2)}
                domain={[smlBetaLow, smlBetaHigh]}
              />
              <YAxis
                dataKey="y"
                name="Annual Return"
                type="number"
                label={{ value: 'Annual Return (%)', angle: -90, position: 'insideLeft', offset: -10, style: { fontSize: 14, fontWeight: 500, fill: '#475569' } }}
                tick={{ fontSize: 12, fill: '#64748b' }}
                stroke="#94a3b8"
                tickFormatter={(v) => `${v.toFixed(1)}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const p = payload[0].payload;
                    if (!p.asset) return null;
                    return (
                      <div style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px' }}>
                        <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.875rem' }}>{p.asset}</p>
                        <p style={{ margin: '2px 0', fontSize: '0.8rem' }}><span style={{ color: '#64748b' }}>Beta: </span><strong>{p.x?.toFixed(3)}</strong></p>
                        <p style={{ margin: '2px 0', fontSize: '0.8rem' }}><span style={{ color: '#64748b' }}>Actual Return: </span><strong style={{ color: p.alphaAnnual >= 0 ? '#10b981' : '#ef4444' }}>{p.y?.toFixed(2)}%</strong></p>
                        <p style={{ margin: '2px 0', fontSize: '0.8rem' }}><span style={{ color: '#64748b' }}>CAPM Expected: </span><strong>{p.expectedY?.toFixed(2)}%</strong></p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                          Jensen's α = <span style={{ color: p.alphaAnnual >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>{((p.alphaAnnual || 0) * 100).toFixed(2)}%</span>
                          {p.isSignificant ? ' ✓ significant' : ' (not significant)'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={55} iconType="line" />

              {/* SML line */}
              <Scatter
                name="Security Market Line (SML)"
                data={smlLinePoints}
                fill="none"
                line={{ stroke: '#2563eb', strokeWidth: 2.5 }}
                shape={() => null}
                isAnimationActive={false}
              />

              {/* Assets above SML — positive alpha */}
              <Scatter
                name="Positive Alpha (above SML)"
                data={smlAssetPoints.filter(d => d.alphaAnnual >= 0)}
                shape={(props) => {
                  const { cx, cy, payload } = props;
                  const r = payload.isSignificant ? 9 : 6;
                  const fill = payload.isSignificant ? '#10b981' : '#6ee7b7';
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={r} fill={fill} stroke="#059669" strokeWidth={payload.isSignificant ? 2 : 1} />
                      <text x={cx + r + 4} y={cy - 6} fontSize={10} fill="#374151" fontWeight="500">{payload.asset}</text>
                    </g>
                  );
                }}
                isAnimationActive={false}
              />

              {/* Assets below SML — negative alpha */}
              <Scatter
                name="Negative Alpha (below SML)"
                data={smlAssetPoints.filter(d => d.alphaAnnual < 0)}
                shape={(props) => {
                  const { cx, cy, payload } = props;
                  const r = payload.isSignificant ? 9 : 6;
                  const fill = payload.isSignificant ? '#ef4444' : '#fca5a5';
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={r} fill={fill} stroke="#dc2626" strokeWidth={payload.isSignificant ? 2 : 1} />
                      <text x={cx + r + 4} y={cy - 6} fontSize={10} fill="#374151" fontWeight="500">{payload.asset}</text>
                    </g>
                  );
                }}
                isAnimationActive={false}
              />

              <ReferenceLine x={1} stroke="#94a3b8" strokeDasharray="5 5" label={{ value: 'β = 1 (Market)', position: 'insideTopRight', fontSize: 11, fill: '#94a3b8' }} />
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 'var(--spacing-sm)', padding: 'var(--spacing-sm)', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <strong>How to read this chart:</strong> Distance from a dot to the SML equals Jensen's Alpha.
            <strong style={{ color: '#10b981' }}> Darker green</strong> = significant positive alpha · <strong style={{ color: '#6ee7b7' }}>light green</strong> = positive but not significant ·
            <strong style={{ color: '#ef4444' }}> dark red</strong> = significant negative alpha · <strong style={{ color: '#fca5a5' }}>light red</strong> = negative but not significant.
          </div>
        </Card>

        {/* Beta Distribution Chart */}
        <Card className="result-chart-card">
          <h3 className="result-section-title">BETA BY ASSET</h3>
          <p className="notebook-description">
            Beta measures each asset's sensitivity to market movements. A beta of 1 means the asset moves in line with the market;
            above 1 amplifies market swings (aggressive); below 1 dampens them (defensive). The <strong>red dashed line</strong> marks β=1.
          </p>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={multiData} margin={{ top: 20, right: 30, bottom: 60, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="asset" 
                tick={{ fontSize: 11, fill: '#64748b', angle: -35, textAnchor: 'end' }}
                stroke="#94a3b8"
                interval={0}
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                stroke="#94a3b8"
                width={60}
                label={{ 
                  value: 'Beta', 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: 0, 
                  style: { fontSize: 14, fontWeight: 500, fill: '#475569', textAnchor: 'middle' } 
                }}
              />
              <Tooltip 
                formatter={(value) => value.toFixed(3)}
                contentStyle={TOOLTIP_STYLE}
              />
              <ReferenceLine y={1} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Market (β=1)', position: 'top', offset: 5 }} />
              <Bar dataKey="beta" fill="#2563eb" name="Beta" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* R² by Asset */}
        <Card className="result-chart-card">
          <h3 className="result-section-title">R² BY ASSET — CAPM EXPLANATORY POWER</h3>
          <p className="notebook-description">
            R² measures what fraction of each asset's return variance is explained by the market (systematic risk).
            High R² means the asset moves largely with the market; low R² means idiosyncratic factors dominate.
          </p>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={[...multiData].sort((a, b) => b.rSquared - a.rSquared)}
              margin={{ top: 20, right: 50, bottom: 80, left: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="asset"
                tick={{ fontSize: 11, fill: '#64748b', angle: -35, textAnchor: 'end' }}
                stroke="#94a3b8"
                interval={0}
                height={60}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                stroke="#94a3b8"
                width={60}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                domain={[0, 1]}
                label={{ value: 'R²', angle: -90, position: 'insideLeft', offset: 0, style: { fontSize: 14, fontWeight: 500, fill: '#475569', textAnchor: 'middle' } }}
              />
              <Tooltip
                formatter={(v) => [`${(v * 100).toFixed(1)}%`, 'R²']}
                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', borderRadius: 8 }}
              />
              <ReferenceLine y={0.7} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'High R² (70%)', position: 'right', fontSize: 11, fill: '#10b981' }} />
              <ReferenceLine y={0.3} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Low R² (30%)', position: 'right', fontSize: 11, fill: '#f59e0b' }} />
              <Bar dataKey="rSquared" name="R²" radius={[4, 4, 0, 0]}>
                {[...multiData].sort((a, b) => b.rSquared - a.rSquared).map((entry, i) => (
                  <Cell
                    key={`r2-${i}`}
                    fill={entry.rSquared >= 0.7 ? '#10b981' : entry.rSquared >= 0.3 ? '#3b82f6' : '#f59e0b'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 'var(--spacing-sm)', padding: 'var(--spacing-sm)', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <strong>Color guide:</strong>&nbsp;
            <strong style={{ color: '#10b981' }}>■ Green</strong> R²&nbsp;≥&nbsp;70% — market dominates, CAPM fits well &nbsp;·&nbsp;
            <strong style={{ color: '#3b82f6' }}>■ Blue</strong> 30–70% — moderate market dependence &nbsp;·&nbsp;
            <strong style={{ color: '#f59e0b' }}>■ Amber</strong> &lt;30% — idiosyncratic factors dominate; CAPM may be insufficient.
          </div>
        </Card>

        {/* Alpha Distribution Chart */}
        <Card className="result-chart-card">
          <h3 className="result-section-title">JENSEN'S ALPHA DISTRIBUTION</h3>
          <p className="notebook-description">
            Ranked view of annualized Jensen's alpha across all assets. <strong style={{ color: '#10b981' }}>Green bars</strong> indicate
            positive alpha (outperformance vs. CAPM expectation); <strong style={{ color: '#ef4444' }}>red bars</strong> indicate negative
            alpha (underperformance). The magnitude shows how far each asset deviates from its fair CAPM return.
          </p>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={sortedByAlpha} margin={{ top: 20, right: 30, bottom: 60, left: 90 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="asset" 
                tick={{ fontSize: 11, fill: '#64748b', angle: -35, textAnchor: 'end' }}
                stroke="#94a3b8"
                interval={0}
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                stroke="#94a3b8"
                width={70}
                tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
                label={{ 
                  value: "Jensen's Alpha (Annual %)", 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: 0, 
                  style: { fontSize: 14, fontWeight: 500, fill: '#475569', textAnchor: 'middle' } 
                }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const value = payload[0].value;
                    const color = value >= 0 ? '#10b981' : '#ef4444';
                    return (
                      <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '8px 12px',
                      }}>
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Jensen's Alpha (Annual): </span>
                          <span style={{ color, fontWeight: '600' }}>
                            {(value * 100).toFixed(2)}%
                          </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="5 5" label={{ value: '0%', position: 'right', offset: 5 }} />
              <Bar dataKey="alphaAnnual" name="Jensen's Alpha (Annual)" radius={[4, 4, 0, 0]}>
                {sortedByAlpha.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.alphaAnnual >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Asset Classification (Quadrant Analysis) */}
        <Card className="result-summary-card">
          <h3 className="result-section-title">ASSET CLASSIFICATION</h3>
          <p className="notebook-description">
            Each asset is classified along two dimensions: <strong>alpha quality</strong> (direction + statistical significance) and
            <strong> beta profile</strong> (market sensitivity). The combination provides an actionable 2-D view of the risk-return
            trade-off across the portfolio universe.
          </p>
          <div className="table-container">
            <table className="results-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>Asset</th>
                  <th style={{ textAlign: 'center', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>Alpha Class</th>
                  <th style={{ textAlign: 'center', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>Beta Profile</th>
                  <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {multiData.map((row, idx) => {

                  let alphaClass, alphaColor, alphaBg;
                  if (row.alphaAnnual > 0 && row.isSignificant) {
                    alphaClass = '✅ Alpha Generator'; alphaColor = '#059669'; alphaBg = 'rgba(16,185,129,0.1)';
                  } else if (row.alphaAnnual > 0 && !row.isSignificant) {
                    alphaClass = '🔷 Potential Outperformer'; alphaColor = '#2563eb'; alphaBg = 'rgba(37,99,235,0.08)';
                  } else if (row.alphaAnnual <= 0 && !row.isSignificant) {
                    alphaClass = '⚪ Neutral'; alphaColor = '#64748b'; alphaBg = 'rgba(100,116,139,0.08)';
                  } else {
                    alphaClass = '❌ Alpha Destroyer'; alphaColor = '#dc2626'; alphaBg = 'rgba(239,68,68,0.08)';
                  }

                  let betaClass, betaColor;
                  if (row.beta > 1.2) {
                    betaClass = '🔺 Aggressive'; betaColor = '#ef4444';
                  } else if (row.beta >= 0.8) {
                    betaClass = '⬜ Market-like'; betaColor = '#64748b';
                  } else {
                    betaClass = '🛡 Defensive'; betaColor = '#10b981';
                  }

                  let interpretation;
                  if (row.alphaAnnual > 0 && row.isSignificant && row.beta < 0.8)
                    interpretation = 'Best risk-adjusted profile: confirmed outperformer with below-market risk.';
                  else if (row.alphaAnnual > 0 && row.isSignificant && row.beta > 1.2)
                    interpretation = 'High-risk outperformer. Strong alpha but elevated market exposure — suitable for aggressive mandates.';
                  else if (row.alphaAnnual > 0 && row.isSignificant)
                    interpretation = 'Confirmed alpha generator with balanced market sensitivity. Strong candidate for allocation.';
                  else if (row.alphaAnnual > 0 && !row.isSignificant && row.beta < 0.8)
                    interpretation = 'Defensive asset with a positive trend. Extend the sample period to confirm the alpha.';
                  else if (row.alphaAnnual > 0 && !row.isSignificant)
                    interpretation = 'Positive trend, but statistically inconclusive. Monitor before committing capital.';
                  else if (row.alphaAnnual <= 0 && !row.isSignificant && row.beta < 0.8)
                    interpretation = 'Defensive asset with neutral alpha. Useful for portfolio risk reduction.';
                  else if (row.alphaAnnual <= 0 && !row.isSignificant)
                    interpretation = 'Returns consistent with CAPM pricing. No confirmed edge or structural drag.';
                  else if (row.alphaAnnual < 0 && row.isSignificant && row.beta > 1.2)
                    interpretation = 'Worst profile: high systematic risk combined with confirmed underperformance.';
                  else
                    interpretation = 'Confirmed underperformer. Risk-adjusted returns fall short of CAPM expectations.';

                  return (
                    <tr key={idx}>
                      <td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-color)', fontWeight: 500 }}>{row.asset}</td>
                      <td style={{ textAlign: 'center', padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ backgroundColor: alphaBg, color: alphaColor, padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {alphaClass}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ color: betaColor, fontWeight: 600, fontSize: '0.85rem' }}>{betaClass}</span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>β = {row.beta.toFixed(2)}</span>
                      </td>
                      <td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        {interpretation}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm)', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
            <strong>Alpha Classes:</strong>&nbsp;
            ✅ <em>Alpha Generator</em> — significant α&nbsp;&gt;&nbsp;0 &nbsp;·&nbsp;
            🔷 <em>Potential Outperformer</em> — positive α, not significant &nbsp;·&nbsp;
            ⚪ <em>Neutral</em> — negative α, not significant &nbsp;·&nbsp;
            ❌ <em>Alpha Destroyer</em> — significant α&nbsp;&lt;&nbsp;0 &nbsp;|&nbsp;
            <strong>Beta Profiles:</strong>&nbsp;
            🔺 Aggressive β&nbsp;&gt;&nbsp;1.2 &nbsp;·&nbsp; ⬜ Market-like 0.8–1.2 &nbsp;·&nbsp; 🛡 Defensive β&nbsp;&lt;&nbsp;0.8
          </div>
        </Card>

        {/* CAPM Regressions - Individual Grid View */}
        {multiData.some(d => d.scatterData && d.scatterData.length > 0) && (
          <Card className="result-chart-card">
            <h3 className="result-section-title">CAPM REGRESSIONS BY ASSET</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: 'var(--spacing-lg)',
              marginTop: 'var(--spacing-md)'
            }}>
              {multiData.map((assetData, idx) => {
                if (!assetData.scatterData || assetData.scatterData.length === 0 || 
                    !assetData.regressionLine || assetData.regressionLine.length === 0) {
                  return null;
                }
                
                const alphaDaily = assetData.alphaDaily !== undefined ? assetData.alphaDaily : (assetData.alphaAnnual / 252);
                const marketExcessValues = assetData.scatterData.map(d => d.market_excess);
                const minMarket = Math.min(...marketExcessValues);
                const maxMarket = Math.max(...marketExcessValues);
                const marketLine = [
                  { x: minMarket, y: minMarket },
                  { x: maxMarket, y: maxMarket }
                ];
                
                return (
                  <div key={`regression-${assetData.asset}`} style={{ 
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'var(--bg-primary)'
                  }}>
                    <h4 style={{ 
                      margin: '0 0 var(--spacing-sm) 0', 
                      fontSize: '1rem', 
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      {assetData.asset}
                    </h4>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--text-secondary)',
                      marginBottom: 'var(--spacing-xs)'
                    }}>
                      α={((alphaDaily || 0) * 100).toFixed(2)}%, β={assetData.beta.toFixed(3)}, R²={assetData.rSquared.toFixed(3)}
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart margin={{ top: 10, right: 20, bottom: 50, left: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="x" 
                          name="Market Excess Return"
                          type="number"
                          label={{ 
                            value: 'Market Excess Return (%)', 
                            position: 'insideBottom', 
                            offset: -5,
                            style: { fontSize: 11, fontWeight: 500, fill: '#475569' }
                          }}
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          stroke="#94a3b8"
                          tickFormatter={(value) => `${(value * 100).toFixed(1)}`}
                          domain={['dataMin', 'dataMax']}
                        />
                        <YAxis 
                          dataKey="y"
                          name="Asset Excess Return"
                          type="number"
                          label={{ 
                            value: 'Asset Excess Return (%)', 
                            angle: -90, 
                            position: 'insideLeft',
                            offset: 0,
                            style: { fontSize: 11, fontWeight: 500, fill: '#475569' }
                          }}
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          stroke="#94a3b8"
                          tickFormatter={(value) => `${(value * 100).toFixed(1)}`}
                          domain={['dataMin', 'dataMax']}
                        />
                        <Tooltip 
                          formatter={(value) => `${(value * 100).toFixed(2)}%`}
                          contentStyle={{ ...TOOLTIP_STYLE, fontSize: '0.75rem' }}
                        />
                        
                        {/* Market Reference Line (β=1) */}
                        <Scatter 
                          name="Market (β=1)" 
                          data={marketLine} 
                          fill="none"
                          line={{ stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '5 5' }}
                          shape={() => null}
                          isAnimationActive={false}
                        />
                        
                        {/* Scatter points - Observations */}
                        <Scatter 
                          name="Observations" 
                          data={assetData.scatterData.map(d => ({ x: d.market_excess, y: d.asset_excess }))} 
                          fill="#2563eb" 
                          fillOpacity={0.4}
                          stroke="#2563eb"
                          strokeWidth={0.5}
                        />
                        
                        {/* CAPM Regression line */}
                        <Scatter 
                          name={`CAPM: α=${((alphaDaily || 0) * 100).toFixed(2)}%, β=${assetData.beta.toFixed(3)}`}
                          data={assetData.regressionLine.map(p => ({ x: p.x, y: p.y }))} 
                          fill="#ef4444" 
                          line={{ stroke: '#ef4444', strokeWidth: 2 }}
                          shape={() => null}
                          isAnimationActive={false}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
            <div style={{ 
              marginTop: 'var(--spacing-md)', 
              padding: 'var(--spacing-sm)',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)'
            }}>
              <strong>Interpretation:</strong> The <strong style={{ color: '#ef4444' }}>red solid line</strong> shows the CAPM regression for each asset. 
              The <strong style={{ color: '#94a3b8' }}>gray dashed line</strong> represents the market (β=1) as a reference. 
              Points above the market line indicate outperformance relative to market risk. Steeper slopes indicate higher beta (more market sensitivity).
            </div>
          </Card>
        )}

        {/* Detailed Results Table */}
        <Card className="result-table-card">
          <h3 className="result-section-title">DETAILED RESULTS</h3>
          <div className="table-container">
            <table className="results-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>Asset</th>
                  <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>Beta</th>
                  <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>Expected Return</th>
                  <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>Jensen's Alpha (Annual)</th>
                  <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>R²</th>
                  <th style={{ textAlign: 'center', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>Significant</th>
                </tr>
              </thead>
              <tbody>
                {multiData.map((row, idx) => {
                  const hasPositiveNonSignificant = row.alphaAnnual > 0 && !row.isSignificant;
                  return (
                    <tr key={idx} style={hasPositiveNonSignificant ? { backgroundColor: 'rgba(16, 185, 129, 0.05)' } : {}}>
                      <td style={{ textAlign: 'left', padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-color)', fontWeight: '500' }}>{row.asset}</td>
                      <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-color)' }}>{row.beta.toFixed(3)}</td>
                      <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-color)', color: '#3b82f6', fontWeight: '500' }}>
                        {((row.expectedReturn || 0) * 100).toFixed(2)}%
                      </td>
                      <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-color)', color: row.alphaAnnual < 0 ? '#ef4444' : '#10b981', fontWeight: '500' }}>
                        {(row.alphaAnnual * 100).toFixed(2)}%
                        {hasPositiveNonSignificant && (
                          <span style={{ 
                            marginLeft: '8px', 
                            fontSize: '0.7rem', 
                            color: '#64748b',
                            fontStyle: 'italic',
                            fontWeight: 'normal'
                          }} title="Positive but not statistically significant">
                            ⚠️
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-color)' }}>{row.rSquared.toFixed(3)}</td>
                      <td style={{ textAlign: 'center', padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-color)' }}>
                        <span 
                          className="significance-badge"
                          style={{ 
                            backgroundColor: row.isSignificant ? '#10b981' : '#ef4444',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}
                        >
                          {row.isSignificant ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {multiData.some(row => row.alphaAnnual > 0 && !row.isSignificant) && (
            <div style={{ 
              marginTop: 'var(--spacing-md)', 
              padding: 'var(--spacing-md)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <strong style={{ color: '#059669', display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                ⚠️ Positive Jensen's Alpha but Not Significant?
              </strong>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Some assets show positive Jensen's alpha (outperformance) but are not statistically significant. This means:
              </p>
              <ul style={{ margin: 'var(--spacing-xs) 0 0 0', paddingLeft: '20px', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                <li><strong>The observed positive Jensen's alpha could be due to random variation</strong> rather than genuine skill or mispricing.</li>
                <li><strong>There's insufficient statistical evidence</strong> to conclude the asset consistently outperforms the market.</li>
                <li><strong>For investment decisions:</strong> Don't rely solely on non-significant positive alphas. The outperformance may not persist.</li>
                <li><strong>For portfolio construction:</strong> These assets behave as expected by CAPM — use beta to understand market sensitivity.</li>
              </ul>
              <p style={{ margin: 'var(--spacing-xs) 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                <strong>Bottom line:</strong> A positive but non-significant Jensen's alpha is better than negative, but you cannot confidently claim the asset outperforms the market.
              </p>
            </div>
          )}
        </Card>

        {/* Removed old static Key Insights — replaced by ANALYSIS SUMMARY above */}
      </div>
    );
  }

  if (type === 'optimize') {

    const frontierData = data.frontier || data.efficient_frontier || [];
    const cmlData = data.cml || data.capital_market_line || [];
    const tangentPoint = data.tangent_point || data.optimal_portfolio || {};
    const tangentWeights = data.tangent_weights || data.weights || {};
    const riskFreePoint = data.risk_free_point || { volatility: 0, return: (data.risk_free_rate || 0) * 100 };
    const riskFreeRate = data.risk_free_rate || 0;

    const weightsData = Object.entries(tangentWeights)
      .map(([asset, weight]) => ({
        asset: asset.replace(/^\^/, ''),
        weight: typeof weight === 'number' ? weight : parseFloat(weight)
      }))
      .filter(item => Math.abs(item.weight) > 0.01)
      .sort((a, b) => b.weight - a.weight);

    const totalWeight = weightsData.reduce((sum, item) => sum + item.weight, 0);
    const frontierChartData = frontierData.map(point => ({
      volatility: typeof point.volatility === 'number' ? point.volatility : parseFloat(point.volatility),
      return: typeof point.return === 'number' ? point.return : parseFloat(point.return)
    }));

    const cmlChartData = cmlData.map(point => ({
      volatility: typeof point.volatility === 'number' ? point.volatility : parseFloat(point.volatility),
      return: typeof point.return === 'number' ? point.return : parseFloat(point.return)
    }));

    return (
      <div className="results-container">
        {/* Analysis Header */}
        <div className="notebook-header">
          <h2>PORTFOLIO OPTIMIZATION ANALYSIS</h2>
        </div>

        {/* Dynamic Optimization Insight */}
        <Card className="result-summary-card notebook-style">
          <h3 className="notebook-section-title">OPTIMIZATION ANALYSIS</h3>
          {(() => {
            const parts = [];
            const warnings = [];
            let calloutType = '';

            const sharpe = tangentPoint?.sharpe ?? tangentPoint?.sharpe_ratio ?? null;
            const expRet = tangentPoint?.return ?? (tangentPoint?.expected_return != null ? tangentPoint.expected_return * 100 : null);
            const vol = tangentPoint?.volatility ?? null;

            if (sharpe != null) {
              if (sharpe > 1.5) {
                calloutType = 'callout-success';
                parts.push(`Excellent Sharpe Ratio of ${sharpe.toFixed(2)} — the tangent portfolio delivers strong risk-adjusted returns.`);
              } else if (sharpe > 1.0) {
                calloutType = 'callout-success';
                parts.push(`Good Sharpe Ratio of ${sharpe.toFixed(2)} — the optimization produces solid risk-adjusted performance.`);
              } else if (sharpe > 0.5) {
                parts.push(`Moderate Sharpe Ratio of ${sharpe.toFixed(2)} — acceptable risk-adjusted returns, but room for improvement through better asset selection.`);
              } else {
                calloutType = 'callout-warning';
                parts.push(`Low Sharpe Ratio of ${sharpe.toFixed(2)} — even after optimization, risk-adjusted returns are weak. The asset universe may lack diversification potential.`);
                warnings.push(`Sharpe below 0.5 suggests the selected assets don't combine well. Consider adding uncorrelated assets (bonds, commodities, international equities) to improve the frontier.`);
              }
            }

            if (expRet != null && vol != null) {
              parts.push(`The optimal allocation yields ${expRet.toFixed(1)}% expected return with ${vol.toFixed(1)}% volatility.`);
              if (vol > 25) {
                warnings.push(`Portfolio volatility of ${vol.toFixed(1)}% is elevated — this level of risk may not be suitable for conservative or income-focused investors.`);
              }
            }

            if (weightsData.length > 0) {
              const topWeight = weightsData[0];
              const top3Weight = weightsData.slice(0, 3).reduce((s, w) => s + w.weight, 0);
              const shortPositions = weightsData.filter(w => w.weight < 0);

              if (topWeight.weight > 60) {
                warnings.push(`Heavy concentration: ${topWeight.asset} receives ${topWeight.weight.toFixed(1)}% of the portfolio — a single-asset failure could be devastating.`);
              } else if (top3Weight > 85 && weightsData.length > 3) {
                warnings.push(`Top 3 assets (${weightsData.slice(0, 3).map(w => w.asset).join(', ')}) account for ${top3Weight.toFixed(1)}% — significant concentration risk remains.`);
              }

              if (shortPositions.length > 0) {
                parts.push(`The optimizer recommends ${shortPositions.length} short position${shortPositions.length > 1 ? 's' : ''} (${shortPositions.map(s => `${s.asset}: ${s.weight.toFixed(1)}%`).join(', ')}). Ensure short selling is feasible and cost-effective.`);
              }

              const zeroOrTiny = weightsData.filter(w => Math.abs(w.weight) < 2);
              if (zeroOrTiny.length > 0 && weightsData.length > 3) {
                parts.push(`${weightsData.length - zeroOrTiny.length} of ${weightsData.length + zeroOrTiny.length} assets receive meaningful allocation — the optimizer effectively narrows the investable universe.`);
              }
            }

            if (riskFreeRate > 0 && expRet != null) {
              const excessReturn = expRet - (riskFreeRate * 100);
              if (excessReturn < 2) {
                warnings.push(`The excess return over risk-free (${excessReturn.toFixed(1)}pp) is thin — at this spread, the additional volatility may not justify leaving risk-free assets.`);
              }
            }

            return (
              <>
                <div className={`insight-callout ${calloutType}`}>
                  {parts.map((p, i) => <span key={i}>{p}{i < parts.length - 1 ? ' ' : ''}</span>)}
                  <span className="insight-conclusion">
                    {sharpe != null && sharpe > 1
                      ? 'The optimization produces a well-balanced portfolio. Implement the suggested weights and rebalance periodically.'
                      : sharpe != null && sharpe > 0.5
                        ? 'The portfolio offers reasonable optimization. Consider whether the return premium justifies the risk versus a simpler allocation.'
                        : 'The optimization result is modest — expanding the asset universe or adjusting constraints may improve the frontier.'}
                  </span>
                </div>
                {warnings.length > 0 && (
                  <div className="insight-callout callout-warning">
                    {warnings.map((w, i) => <span key={i}>{w}{i < warnings.length - 1 ? ' ' : ''}</span>)}
                  </div>
                )}
              </>
            );
          })()}
        </Card>

        {/* Tangent Portfolio Summary */}
        {tangentPoint && tangentPoint.return !== undefined && (
          <Card className="result-summary-card" style={{
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ padding: 'var(--spacing-lg)' }}>
              <h3 className="notebook-section-title">
                TANGENT PORTFOLIO (MAXIMUM SHARPE)
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-md)',
                marginTop: 'var(--spacing-lg)'
              }}>
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: 'var(--spacing-md)',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
                    Expected Return
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '600', color: '#1e293b' }}>
                    {tangentPoint.return?.toFixed(1) || (tangentPoint.expected_return * 100)?.toFixed(1)}%
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: 'var(--spacing-md)',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
                    Volatility
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '600', color: '#1e293b' }}>
                    {tangentPoint.volatility?.toFixed(1) || (tangentPoint.volatility * 100)?.toFixed(1)}%
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: 'var(--spacing-md)',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
                    Sharpe Ratio
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '600', color: '#3b82f6' }}>
                    {tangentPoint.sharpe?.toFixed(2) || tangentPoint.sharpe_ratio?.toFixed(2) || 'N/A'}
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: 'var(--spacing-md)',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
                    Risk-Free Rate
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '600', color: '#1e293b' }}>
                    {(riskFreeRate * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Efficient Frontier and CML Chart */}
        {frontierChartData.length > 0 && (
          <Card className="result-chart-card" style={{ 
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff'
          }}>
            <div style={{
              padding: 'var(--spacing-lg)',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#ffffff'
            }}>
              <h3 className="result-section-title">
                EFFICIENT FRONTIER AND CAPITAL MARKET LINE
              </h3>
              <p className="notebook-description">
                The <strong>blue curve</strong> is the efficient frontier — all optimal risk-return combinations achievable
                by varying asset weights. The <strong>red dashed line</strong> is the Capital Market Line (CML), tangent
                to the frontier from the risk-free rate. The <strong>green dot</strong> marks the risk-free asset and the
                <strong> red star</strong> marks the tangent portfolio (maximum Sharpe Ratio). Click legend items to toggle visibility.
              </p>
            </div>
            <div style={{ padding: 'var(--spacing-md)' }}>
            <ResponsiveContainer width="100%" height={500}>
              <ScatterChart margin={{ top: 30, right: 40, bottom: 80, left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="volatility" 
                  name="Volatility"
                  type="number"
                  label={{ 
                    value: 'Volatility (%)', 
                    position: 'insideBottom', 
                    offset: -15,
                    style: { fontSize: 14, fontWeight: 500, fill: '#475569' }
                  }}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value) => value.toFixed(1)}
                  stroke="#94a3b8"
                  domain={['dataMin', 'dataMax']}
                />
                <YAxis 
                  dataKey="return"
                  name="Expected Return"
                  type="number"
                  label={{ 
                    value: 'Expected Return (%)', 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: -10,
                    style: { fontSize: 14, fontWeight: 500, fill: '#475569' }
                  }}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value) => value.toFixed(1)}
                  stroke="#94a3b8"
                  domain={['dataMin', 'dataMax']}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'volatility' || name === 'return') {
                      return `${value.toFixed(1)}%`;
                    }
                    return value;
                  }}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Legend 
                  verticalAlign="top" 
                  height={60} 
                  wrapperStyle={{ paddingTop: '10px' }}
                  onClick={(e) => {
                    if (e && typeof e.stopPropagation === 'function') {
                      e.stopPropagation();
                    }
                    const dataKey = (e && e.dataKey) || (e && e.value) || (e && e.payload && e.payload.dataKey) || (e && e.payload && e.payload.value);
                    if (dataKey && visibleSeries.hasOwnProperty(dataKey)) {
                      handleLegendClick(dataKey);
                    }
                  }}
                  iconType="line"
                  formatter={(value, entry) => {
                    const isVisible = visibleSeries[value] !== false;
                    let displayValue = value;
                    if (value === 'Risk-Free Rate') {
                      displayValue = `Risk-Free Rate (${(riskFreeRate * 100).toFixed(1)}%)`;
                    } else if (value === 'Tangent Portfolio') {
                      displayValue = `Tangent Portfolio (Sharpe=${tangentPoint.sharpe?.toFixed(2) || tangentPoint.sharpe_ratio?.toFixed(2) || 'N/A'})`;
                    }
                    return (
                      <span 
                        onClick={(e) => {
                          if (e && typeof e.stopPropagation === 'function') {
                            e.stopPropagation();
                          }
                          if (visibleSeries.hasOwnProperty(value)) {
                            handleLegendClick(value);
                          }
                        }}
                        style={{ 
                          opacity: isVisible ? 1 : 0.4,
                          cursor: 'pointer',
                          textDecoration: isVisible ? 'none' : 'line-through',
                          transition: 'opacity 0.2s ease',
                          userSelect: 'none',
                          display: 'inline-block'
                        }}
                        onMouseEnter={(e) => {
                          if (!isVisible && e && e.target) {
                            e.target.style.opacity = '0.6';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (e && e.target) {
                            e.target.style.opacity = isVisible ? '1' : '0.4';
                          }
                        }}
                      >
                        {displayValue}
                      </span>
                    );
                  }}
                />
                
                {/* Efficient Frontier Line - Always render for legend, control visibility */}
                <Scatter
                  data={frontierChartData}
                  fill="none"
                  line={{ 
                    stroke: '#2563eb', 
                    strokeWidth: 3,
                    strokeOpacity: visibleSeries['Efficient Frontier'] ? 1 : 0
                  }}
                  name="Efficient Frontier"
                  shape={() => null}
                  isAnimationActive={false}
                />
                
                {/* Capital Market Line - Always render for legend, control visibility */}
                {cmlChartData.length > 0 && (
                  <Scatter
                    data={cmlChartData}
                    fill="none"
                    line={{ 
                      stroke: '#ef4444', 
                      strokeWidth: 2, 
                      strokeDasharray: '8 4',
                      strokeOpacity: visibleSeries['Capital Market Line (CML)'] ? 1 : 0
                    }}
                    name="Capital Market Line (CML)"
                    shape={() => null}
                    isAnimationActive={false}
                  />
                )}
                
                {/* Risk-Free Rate Point - Always render for legend, control visibility */}
                {riskFreePoint && (
                  <Scatter
                    data={[{
                      volatility: riskFreePoint.volatility || 0,
                      return: riskFreePoint.return || (riskFreeRate * 100)
                    }]}
                    fill="#10b981"
                    fillOpacity={visibleSeries['Risk-Free Rate'] ? 1 : 0}
                    name="Risk-Free Rate"
                    shape="circle"
                    isAnimationActive={false}
                  />
                )}
                
                {/* Tangency Portfolio Point - Always render for legend, control visibility */}
                {tangentPoint && tangentPoint.volatility !== undefined && (
                  <Scatter
                    data={[{
                      volatility: tangentPoint.volatility || 0,
                      return: tangentPoint.return || 0
                    }]}
                    fill="#ef4444"
                    fillOpacity={visibleSeries['Tangent Portfolio'] ? 1 : 0}
                    name="Tangent Portfolio"
                    shape="star"
                    isAnimationActive={false}
                  />
                )}
              </ScatterChart>
            </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Tangent Portfolio Composition - Horizontal Bar Chart */}
        {weightsData.length > 0 && (
          <Card className="result-chart-card" style={{ 
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff'
          }}>
            <div style={{
              padding: 'var(--spacing-lg)',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#ffffff'
            }}>
              <h3 className="result-section-title">
                TANGENT PORTFOLIO COMPOSITION
              </h3>
              <p className="notebook-description">
                Optimal weight allocation for the maximum Sharpe Ratio portfolio. Longer bars indicate higher allocation.
                {weightsData.some(w => w.weight < 0) ? ' Red bars represent short positions — the optimizer suggests selling these assets to improve the portfolio\'s risk-return profile.' : ''}
              </p>
            </div>
            <div style={{ padding: 'var(--spacing-md)' }}>
            <ResponsiveContainer width="100%" height={Math.max(300, weightsData.length * 60)}>
              <BarChart 
                data={weightsData} 
                layout="vertical"
                margin={{ top: 20, right: 40, bottom: 20, left: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  type="number"
                  domain={[
                    weightsData.some(item => item.weight < 0) ? 'dataMin' : 0,
                    100
                  ]}
                  label={{ 
                    value: 'Weight (%)', 
                    position: 'insideBottom', 
                    offset: -10,
                    style: { fontSize: 14, fontWeight: 500, fill: '#475569' }
                  }}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value) => value.toFixed(1)}
                  stroke="#94a3b8"
                  allowDataOverflow={false}
                />
                {weightsData.some(item => item.weight < 0) && (
                  <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
                )}
                <YAxis 
                  dataKey="asset" 
                  type="category"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  stroke="#94a3b8"
                  width={60}
                />
                <Tooltip 
                  formatter={(value) => `${value.toFixed(1)}%`}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Bar 
                  dataKey="weight" 
                  name="Weight (%)"
                  radius={[0, 4, 4, 0]}
                >
                  {weightsData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.weight >= 0 ? '#2563eb' : '#ef4444'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Portfolio Allocation Donut Chart */}
        {weightsData.length > 0 && (
          <Card className="result-chart-card" style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid #e2e8f0' }}>
              <h3 className="result-section-title">PORTFOLIO ALLOCATION OVERVIEW</h3>
            </div>
            <div style={{ padding: 'var(--spacing-md)', display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-lg)', alignItems: 'center', justifyContent: 'center' }}>
              {/* Donut Chart */}
              <div style={{ flex: '1 1 380px', minWidth: '320px', maxWidth: '480px' }}>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={weightsData.filter(w => w.weight > 0).map((w, i) => ({
                        name: w.asset,
                        value: parseFloat(w.weight.toFixed(1)),
                        fill: CHART_COLORS[i % CHART_COLORS.length]
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={130}
                      paddingAngle={2}
                      label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
                      labelLine={{ strokeWidth: 1 }}
                    >
                      {weightsData.filter(w => w.weight > 0).map((w, i) => (
                        <Cell
                          key={`pie-${i}`}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
                {weightsData.some(w => w.weight < 0) && (
                  <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#ef4444', fontStyle: 'italic', marginTop: '4px' }}>
                    ⚠ Short positions ({weightsData.filter(w => w.weight < 0).map(w => `${w.asset}: ${w.weight.toFixed(1)}%`).join(', ')}) are not shown in the donut chart.
                  </p>
                )}
              </div>

              {/* Diversification Metrics */}
              {(() => {
                const longWeights = weightsData.filter(w => w.weight > 0);
                const fractions = longWeights.map(w => w.weight / 100);
                const hhi = fractions.reduce((sum, f) => sum + f * f, 0);
                const effectiveN = hhi > 0 ? (1 / hhi) : longWeights.length;
                const maxWeight = Math.max(...weightsData.map(w => w.weight));
                const top3 = weightsData.slice(0, Math.min(3, weightsData.length)).reduce((s, w) => s + w.weight, 0);
                const shortCount = weightsData.filter(w => w.weight < 0).length;

                const diversificationScore =
                  (effectiveN < 2 && longWeights.length > 1) || hhi > 0.5 ? 'Low' :
                  effectiveN >= longWeights.length * 0.7 && hhi < 0.15 ? 'High' :
                  effectiveN >= longWeights.length * 0.4 ? 'Moderate' : 'Low';
                const diversificationColor =
                  diversificationScore === 'High' ? '#10b981' :
                  diversificationScore === 'Moderate' ? '#f59e0b' : '#ef4444';

                return (
                  <div style={{ flex: '1 1 320px', minWidth: '280px', maxWidth: '400px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e293b', marginBottom: 'var(--spacing-md)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Diversification Metrics
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                      {[
                        { label: 'Herfindahl-Hirschman Index (HHI)', value: hhi.toFixed(4), desc: hhi < 0.15 ? 'Well diversified' : hhi < 0.25 ? 'Moderate concentration' : 'Highly concentrated' },
                        { label: 'Effective Number of Assets', value: effectiveN.toFixed(1) + ` / ${longWeights.length}`, desc: `${(effectiveN / longWeights.length * 100).toFixed(0)}% diversification efficiency` },
                        { label: 'Largest Position', value: `${maxWeight.toFixed(1)}%`, desc: weightsData[0]?.asset || '' },
                        { label: 'Top 3 Concentration', value: `${top3.toFixed(1)}%`, desc: weightsData.slice(0, 3).map(w => w.asset).join(', ') },
                        { label: 'Active Positions', value: `${weightsData.length}${shortCount > 0 ? ` (${shortCount} short)` : ''}`, desc: `Long: ${longWeights.length}` },
                        { label: 'Diversification Level', value: diversificationScore, color: diversificationColor },
                      ].map((item, idx) => (
                        <div key={idx} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                          padding: 'var(--spacing-sm) var(--spacing-md)',
                          backgroundColor: idx % 2 === 0 ? '#f8fafc' : '#ffffff',
                          borderRadius: '6px', border: '1px solid #f1f5f9'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>{item.label}</div>
                            {item.desc && <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{item.desc}</div>}
                          </div>
                          <div style={{
                            fontSize: '0.95rem', fontWeight: '600',
                            color: item.color || '#1e293b', textAlign: 'right', whiteSpace: 'nowrap', marginLeft: '12px'
                          }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </Card>
        )}

        {/* Efficient Frontier & CML Theory */}
        <Card className="result-summary-card notebook-style" style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <h3 className="notebook-section-title">UNDERSTANDING THE EFFICIENT FRONTIER & CML</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#2563eb', marginBottom: 'var(--spacing-xs)' }}>
                📐 Efficient Frontier
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0 }}>
                The <strong>efficient frontier</strong> represents the set of portfolios that offer the highest expected return
                for each level of risk (volatility). Any portfolio <em>below</em> the frontier is sub-optimal — you could
                achieve higher returns at the same risk, or the same returns at lower risk. Portfolios <em>on</em> the frontier
                are mean-variance efficient according to Markowitz (1952) Modern Portfolio Theory.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ef4444', marginBottom: 'var(--spacing-xs)' }}>
                📏 Capital Market Line (CML)
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0 }}>
                The <strong>CML</strong> extends from the risk-free rate through the tangent portfolio. Its slope equals
                the <strong>Sharpe Ratio</strong> of the tangent portfolio — the maximum reward-to-risk achievable.
                Points along the CML represent combinations of the risk-free asset and the tangent portfolio:
                below the tangent point you're lending (conservative), above it you're borrowing (leveraged).
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#10b981', marginBottom: 'var(--spacing-xs)' }}>
                ⭐ Tangent Portfolio
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0 }}>
                The <strong>tangent portfolio</strong> is the point where the CML is tangent to the efficient frontier.
                It maximises the Sharpe Ratio and, under CAPM assumptions, represents the <strong>market portfolio</strong>.
                All rational investors should hold this portfolio combined with risk-free lending or borrowing to match
                their risk tolerance — this is the <strong>Two-Fund Separation Theorem</strong>.
              </p>
            </div>
          </div>
        </Card>

        {/* Investor Positioning on the CML */}
        {tangentPoint && tangentPoint.return !== undefined && (
          <Card className="result-summary-card notebook-style" style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <h3 className="notebook-section-title">INVESTOR POSITIONING ON THE CML</h3>
            {(() => {
              const rf = riskFreeRate * 100;
              const tp = tangentPoint;
              const sharpe = tp?.sharpe ?? tp?.sharpe_ratio ?? null;
              const profiles = [
                { name: 'Conservative', riskAlloc: 0.3, icon: '🛡️' },
                { name: 'Balanced', riskAlloc: 0.7, icon: '⚖️' },
                { name: 'Aggressive (Leveraged)', riskAlloc: 1.3, icon: '🚀' },
              ];

              return (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: 'var(--spacing-md)' }}>
                    Using the <strong>Two-Fund Separation Theorem</strong>, any investor can combine the tangent portfolio
                    with risk-free lending/borrowing to achieve their desired risk level along the CML.
                    Below are example allocations for different risk profiles:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-md)' }}>
                    {profiles.map((profile, idx) => {
                      const w = profile.riskAlloc;
                      const expRet = rf + w * (tp.return - rf);
                      const expVol = w * tp.volatility;
                      const isLeveraged = w > 1;
                      return (
                        <div key={idx} style={{
                          padding: 'var(--spacing-md)',
                          borderRadius: '8px',
                          border: `1px solid ${isLeveraged ? '#fbbf24' : '#e2e8f0'}`,
                          backgroundColor: isLeveraged ? 'rgba(251, 191, 36, 0.05)' : '#f8fafc',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{profile.icon}</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: 'var(--spacing-sm)' }}>
                            {profile.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '4px' }}>
                            {isLeveraged ? `${((w - 1) * 100).toFixed(0)}% borrowed` : `${((1 - w) * 100).toFixed(0)}% risk-free, ${(w * 100).toFixed(0)}% tangent`}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 'var(--spacing-sm)' }}>
                            <div>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Return</div>
                              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#10b981' }}>{expRet.toFixed(1)}%</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Volatility</div>
                              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#ef4444' }}>{expVol.toFixed(1)}%</div>
                            </div>
                            {sharpe != null && (
                              <div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Sharpe</div>
                                <div style={{ fontSize: '1rem', fontWeight: '600', color: '#3b82f6' }}>{sharpe.toFixed(2)}</div>
                              </div>
                            )}
                          </div>
                          {isLeveraged && (
                            <div style={{ fontSize: '0.72rem', color: '#d97706', marginTop: '8px', fontStyle: 'italic' }}>
                              ⚠ Requires margin / borrowing
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', marginTop: 'var(--spacing-md)', textAlign: 'center' }}>
                    Note: All points on the CML share the same Sharpe Ratio — risk tolerance determines position, not skill.
                    Leveraged positions amplify both returns and losses.
                  </p>
                </div>
              );
            })()}
          </Card>
        )}

        {/* Weight Summary Table */}
        {weightsData.length > 0 && (
          <Card className="result-summary-card" style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <h3 className="notebook-section-title" style={{ padding: 'var(--spacing-lg) var(--spacing-lg) 0' }}>COMPLETE WEIGHT ALLOCATION</h3>
            <div style={{ padding: 'var(--spacing-md) var(--spacing-lg) var(--spacing-lg)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>#</th>
                      <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>Asset</th>
                      <th style={{ textAlign: 'right', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>Weight (%)</th>
                      <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>Position</th>
                      <th style={{ textAlign: 'left', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--border-color)' }}>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weightsData.map((w, idx) => {
                      const role =
                        w.weight >= 30 ? 'Core Holding' :
                        w.weight >= 10 ? 'Significant Position' :
                        w.weight >= 3 ? 'Satellite Position' :
                        w.weight > 0 ? 'Minor Allocation' : 'Short Position';
                      const roleColor =
                        w.weight >= 30 ? '#2563eb' :
                        w.weight >= 10 ? '#10b981' :
                        w.weight >= 3 ? '#f59e0b' :
                        w.weight > 0 ? '#94a3b8' : '#ef4444';

                      return (
                        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid #f1f5f9', color: '#94a3b8' }}>{idx + 1}</td>
                          <td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid #f1f5f9', fontWeight: '500' }}>{w.asset}</td>
                          <td style={{
                            padding: 'var(--spacing-sm)', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: '600',
                            color: w.weight >= 0 ? '#1e293b' : '#ef4444'
                          }}>
                            {w.weight.toFixed(2)}%
                            <div style={{
                              height: '4px', borderRadius: '2px', marginTop: '4px',
                              backgroundColor: w.weight >= 0 ? '#2563eb' : '#ef4444',
                              width: `${Math.min(Math.abs(w.weight), 100)}%`,
                              opacity: 0.3
                            }} />
                          </td>
                          <td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '500',
                              backgroundColor: w.weight >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: w.weight >= 0 ? '#059669' : '#dc2626'
                            }}>
                              {w.weight >= 0 ? 'Long' : 'Short'}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ color: roleColor, fontWeight: '500', fontSize: '0.82rem' }}>{role}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#f1f5f9', fontWeight: '600' }}>
                      <td colSpan={2} style={{ padding: 'var(--spacing-sm)', borderTop: '2px solid var(--border-color)' }}>Total</td>
                      <td style={{ padding: 'var(--spacing-sm)', borderTop: '2px solid var(--border-color)', textAlign: 'right' }}>
                        {totalWeight.toFixed(2)}%
                      </td>
                      <td colSpan={2} style={{ padding: 'var(--spacing-sm)', borderTop: '2px solid var(--border-color)', fontSize: '0.78rem', color: '#64748b' }}>
                        {Math.abs(totalWeight - 100) < 1 ? '✅ Fully invested' : `⚠ ${totalWeight > 100 ? 'Leveraged' : 'Not fully invested'}`}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }


  return null;
};

export default CAPMResults;

