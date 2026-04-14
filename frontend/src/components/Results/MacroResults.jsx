import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../Card/Card';
import { getFactorDescription } from '../../utils/options';
import './Results.css';

const MacroResults = ({ data }) => {
  if (!data || !data.regression) {
    return null;
  }

  const { regression, t_stats, p_values, risk_decomposition } = data;
  const betasData = Object.entries(regression.betas || {}).map(([factor, value]) => {
    const factorKey = factor.startsWith('^') ? factor : `^${factor}`;
    return {
      factor: factor.replace(/^\^/, ''),
      beta: typeof value === 'number' ? value : 0,
      tStat: (t_stats && t_stats[factorKey]) || (t_stats && t_stats[factor]) || 0,
      pValue: (p_values && p_values[factorKey]) || (p_values && p_values[factor]) || 0,
      description: getFactorDescription(factor),
    };
  }).filter(item => item.beta !== 0 || item.tStat !== 0);

  const sortedBetasData = [...betasData].sort((a, b) => Math.abs(b.beta) - Math.abs(a.beta));

  const getSignificanceLabel = (pValue) => {
    if (pValue < 0.01) return '***';
    if (pValue < 0.05) return '**';
    if (pValue < 0.10) return '*';
    return '—';
  };

  const getModelFit = (r2) => {
    if (r2 >= 0.70) return 'Excellent - high factor exposure';
    if (r2 >= 0.40) return 'Good - significant factor exposure';
    if (r2 >= 0.25) return 'Moderate - partial exposure';
    if (r2 >= 0.15) return 'Low - weak exposure';
    return 'Very low - mostly idiosyncratic portfolio';
  };
  
  const alphaAnnualPct = (regression.alpha_annual || 0) * 100;
  const r2 = regression.r_squared || 0;
  const systematicPct = risk_decomposition?.systematic_pct || (r2 * 100);
  const idiosyncraticPct = risk_decomposition?.idiosyncratic_pct || ((1 - r2) * 100);

  const getAlphaInterpretation = () => {
    const abs = Math.abs(alphaAnnualPct);
    if (abs < 1) return 'Alpha is close to zero — the macro factors explain nearly all of the portfolio return.';
    if (alphaAnnualPct > 5) return 'Significant positive alpha — the portfolio generates excess return beyond macro factor exposure.';
    if (alphaAnnualPct > 0) return 'Slight positive alpha — the portfolio slightly outperforms what the macro factors predict.';
    if (alphaAnnualPct > -5) return 'Slight negative alpha — the portfolio slightly underperforms what the macro factors predict.';
    return 'Significant negative alpha — the portfolio underperforms relative to its macro factor exposure.';
  };

  const getR2Interpretation = () => {
    if (r2 >= 0.90) return `R² = ${r2.toFixed(3)} — the macro factors explain ${(r2 * 100).toFixed(1)}% of portfolio variance. The model has very strong explanatory power.`;
    if (r2 >= 0.70) return `R² = ${r2.toFixed(3)} — the macro factors explain ${(r2 * 100).toFixed(1)}% of portfolio variance. Strong systematic exposure to macro conditions.`;
    if (r2 >= 0.40) return `R² = ${r2.toFixed(3)} — the macro factors explain ${(r2 * 100).toFixed(1)}% of portfolio variance. Moderate macro dependency, the rest comes from idiosyncratic factors.`;
    return `R² = ${r2.toFixed(3)} — the macro factors explain only ${(r2 * 100).toFixed(1)}% of portfolio variance. The portfolio is mostly driven by non-macro (idiosyncratic) factors.`;
  };

  const significantFactors = sortedBetasData.filter(item => item.pValue < 0.05);
  const marginalFactors = sortedBetasData.filter(item => item.pValue >= 0.05 && item.pValue < 0.10);

  const getFactorsInterpretation = () => {
    const allRelevant = [...significantFactors, ...marginalFactors];
    if (allRelevant.length === 0) return 'No factors are statistically significant (p < 0.10). The portfolio has no clear macro sensitivities detected.';
    const names = allRelevant.map(f => f.factor).join(', ');
    const dominant = allRelevant[0];
    let text = `${allRelevant.length} relevant factor${allRelevant.length > 1 ? 's' : ''} detected: ${names}. `;
    text += `The dominant factor is ${dominant.factor} (β = ${dominant.beta.toFixed(4)}) — `;
    text += dominant.beta > 0
      ? 'the portfolio moves in the same direction as this factor.'
      : 'the portfolio moves inversely to this factor.';
    return text;
  };

  const getRiskInterpretation = () => {
    if (systematicPct >= 80) return `${systematicPct.toFixed(1)}% of portfolio risk is systematic (driven by macro factors). Very little diversifiable risk remains.`;
    if (systematicPct >= 50) return `${systematicPct.toFixed(1)}% systematic vs ${idiosyncraticPct.toFixed(1)}% idiosyncratic. Macro conditions dominate, but there is room for stock-specific risk reduction.`;
    return `Only ${systematicPct.toFixed(1)}% of risk is systematic. The portfolio is largely driven by idiosyncratic (stock-specific) factors rather than macro conditions.`;
  };

  return (
    <div className="results-container">
      {/* Header */}
      <div className="notebook-header">
        <h2>MACRO FACTOR ANALYSIS</h2>
      </div>

      {/* Regression Summary */}
      <Card className="result-summary-card notebook-style">
        <h3 className="notebook-section-title">REGRESSION SUMMARY</h3>
        <p className="notebook-description">
          Multifactor OLS regression: measures how much of the portfolio returns are explained by macro factors.
          The alpha here is the <strong>regression intercept</strong> (return not explained by the factors), different from Jensen's alpha in CAPM.
        </p>
        <div className="notebook-table">
          <div className="notebook-row">
            <span className="notebook-label">Regression Alpha (daily):</span>
            <span className={`notebook-value ${regression.alpha >= 0 ? 'positive' : 'negative'}`}>
              {(regression.alpha * 100).toFixed(4)}%
            </span>
          </div>
          <div className="notebook-row">
            <span className="notebook-label">Regression Alpha (annual):</span>
            <span className={`notebook-value ${regression.alpha_annual >= 0 ? 'positive' : 'negative'}`}>
              {(regression.alpha_annual * 100).toFixed(2)}%
            </span>
          </div>
          <div className="notebook-row">
            <span className="notebook-label">R²:</span>
            <span className="notebook-value">
              {regression.r_squared?.toFixed(3) || 'N/A'}
            </span>
          </div>
          <div className="notebook-row">
            <span className="notebook-label">Adjusted R²:</span>
            <span className="notebook-value">
              {regression.adj_r_squared?.toFixed(3) || 'N/A'}
            </span>
          </div>
          <div className="notebook-row">
            <span className="notebook-label">Observations:</span>
            <span className="notebook-value">
              {regression.n_obs || 'N/A'}
            </span>
          </div>
          <div className="notebook-row">
            <span className="notebook-label">Model fit:</span>
            <span className="notebook-value interpretation">
              {getModelFit(r2)}
            </span>
          </div>
        </div>
        <div className="notebook-interpretation">
          <p>{getAlphaInterpretation()}</p>
          <p>{getR2Interpretation()}</p>
        </div>
      </Card>

      {/* Factor Loadings (Betas) */}
      <Card className="result-table-card notebook-style">
        <h3 className="notebook-section-title">FACTOR LOADINGS (BETAS)</h3>
        <p className="notebook-description">
          Each beta measures the portfolio's sensitivity to a macro factor.
          A beta of 1.0 means the portfolio moves 1:1 with that factor. Significance is assessed via t-stat and p-value.
        </p>
        <div className="table-container">
          <table className="notebook-table-styled">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Factor</th>
                <th style={{ textAlign: 'left' }}>Description</th>
                <th style={{ textAlign: 'right' }}>Beta</th>
                <th style={{ textAlign: 'right' }}>t-stat</th>
                <th style={{ textAlign: 'right' }}>p-value</th>
                <th style={{ textAlign: 'center' }}>Signif</th>
              </tr>
            </thead>
            <tbody>
              {sortedBetasData.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: 'left', fontWeight: '500' }}>{row.factor}</td>
                  <td style={{ textAlign: 'left', fontSize: '0.85em', color: '#666' }}>
                    {row.description}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                    {row.beta.toFixed(4)}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                    {row.tStat.toFixed(3)}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                    {row.pValue.toFixed(4)}
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                    {getSignificanceLabel(row.pValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="notebook-note">
            Significance: *** p&lt;0.01, ** p&lt;0.05, * p&lt;0.10
          </div>
        </div>
        <div className="notebook-interpretation">
          <p>{getFactorsInterpretation()}</p>
        </div>
      </Card>

      {/* Risk Decomposition */}
      {risk_decomposition && (
        <Card className="result-summary-card notebook-style">
          <h3 className="notebook-section-title">RISK DECOMPOSITION</h3>
          <p className="notebook-description">
            Breaks down total portfolio risk into systematic (macro-driven) and idiosyncratic (stock-specific) components based on R².
          </p>
          <div className="notebook-table">
            <div className="notebook-row">
              <span className="notebook-label">Systematic risk:</span>
              <span className="notebook-value">
                {systematicPct.toFixed(2)}%
              </span>
            </div>
            <div className="notebook-row">
              <span className="notebook-label">Idiosyncratic risk:</span>
              <span className="notebook-value">
                {idiosyncraticPct.toFixed(2)}%
              </span>
            </div>
            <div className="notebook-row">
              <span className="notebook-label">R² (explained variance):</span>
              <span className="notebook-value">
                {r2.toFixed(3)}
              </span>
            </div>
          </div>
          <div className="notebook-interpretation">
            <p>{getRiskInterpretation()}</p>
          </div>
        </Card>
      )}

      {/* Significant Factors (p < 0.05) */}
      {significantFactors.length > 0 && (
        <Card className="result-summary-card notebook-style">
          <h3 className="notebook-section-title">SIGNIFICANT FACTORS</h3>
          <ul className="notebook-list">
            {significantFactors.map((item, idx) => (
              <li key={idx}>
                <strong>{item.factor}</strong>{' '}
                <span style={{ color: '#666', fontSize: '0.9em' }}>{item.description}</span>
                : β = {item.beta.toFixed(4)}{' '}
                ({item.beta > 0 ? 'positive exposure' : 'negative exposure'},
                {' '}p = {item.pValue.toFixed(4)})
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Marginally Significant Factors (p < 0.10) */}
      {marginalFactors.length > 0 && (
        <Card className="result-summary-card notebook-style">
          <h3 className="notebook-section-title">MARGINALLY SIGNIFICANT FACTORS</h3>
          <ul className="notebook-list">
            {marginalFactors.map((item, idx) => (
              <li key={idx}>
                <strong>{item.factor}</strong>{' '}
                <span style={{ color: '#666', fontSize: '0.9em' }}>{item.description}</span>
                : β = {item.beta.toFixed(4)}{' '}
                ({item.beta > 0 ? 'positive exposure' : 'negative exposure'},
                {' '}p = {item.pValue.toFixed(4)})
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Betas Chart */}
      <Card className="result-chart-card">
        <h3 className="result-section-title">BETA VISUALIZATION</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sortedBetasData.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="factor" />
            <YAxis />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'beta') return value.toFixed(4);
                return value;
              }}
            />
            <Legend />
            <Bar
              dataKey="beta"
              fill="#2563eb"
              name="Beta"
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default MacroResults;
