import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../Card/Card';
import {
  getFactorDescription,
  getFactorMetadata,
  normalizeFactorId,
  formatFactorCategoryLabel,
} from '../../utils/options';
import './Results.css';

const MacroCorrelationResults = ({ data }) => {
  if (!data) {
    return (
      <Card className="result-summary-card">
        <p>No data available to display.</p>
      </Card>
    );
  }

  let bestLaggedCorrelations = [];
  let correlationData = [];
  let optimalLag = null;
  let correlationMatrix = {};

  if (Array.isArray(data.best_lagged_correlations)) {
    bestLaggedCorrelations = data.best_lagged_correlations;
    correlationData = bestLaggedCorrelations.map((item) => {
      const raw = item.factor || '';
      const canonical = normalizeFactorId(raw) || String(raw).replace(/^\^/, '');
      return {
        factor: String(canonical).replace(/^\^/, ''),
        correlation: item.corr || item.correlation || 0,
        lag: item.lag || 0,
        tStat: item.t || null,
        pValue: item.p || null,
        n: item.n || null,
        isSignificant: item.is_significant || false,
        description: getFactorDescription(item.factor),
        factorKind: formatFactorCategoryLabel(getFactorMetadata(raw)?.category),
      };
    }).filter(item => item.correlation !== 0 && !isNaN(item.correlation));

    if (correlationData.length > 0) {
      const lags = correlationData.map(d => d.lag).filter(l => l !== null && l !== undefined);
      if (lags.length > 0) {
        optimalLag = Math.round(lags.reduce((a, b) => a + b, 0) / lags.length);
      }
    }
  } else {
    let correlations = {};
    
    if (data.optimal_correlations) {
      correlations = data.optimal_correlations;
    } else if (data.correlations) {
      correlations = data.correlations;
    } else if (data.correlation) {
      correlations = data.correlation;
    } else if (data.best_correlations) {
      correlations = data.best_correlations;
    }

    correlationData = Object.entries(correlations).map(([factor, value]) => {
      const canonical = normalizeFactorId(factor) || factor.replace(/^\^/, '');
      return {
        factor: String(canonical).replace(/^\^/, ''),
        correlation: typeof value === 'number' ? value : 0,
        lag: null,
        tStat: null,
        pValue: null,
        n: null,
        isSignificant: null,
        description: getFactorDescription(factor),
        factorKind: formatFactorCategoryLabel(getFactorMetadata(factor)?.category),
      };
    }).filter(item => item.correlation !== 0 && !isNaN(item.correlation));

    optimalLag = data.optimal_lag || data.best_lag || data.optimal_lag_value || data.lag || null;
  }

  correlationMatrix = data.correlation_matrix || data.correlation_matrix_full || {};

  const leadingFactors = correlationData.filter(item => item.lag < 0);
  const laggingFactors = correlationData.filter(item => item.lag > 0);
  const significantFactors = correlationData.filter(item => item.isSignificant || (item.pValue !== null && item.pValue < 0.05));
  const positiveCorrs = correlationData.filter(item => item.correlation > 0);
  const negativeCorrs = correlationData.filter(item => item.correlation < 0);
  const strongestFactor = correlationData.length > 0
    ? correlationData.reduce((a, b) => Math.abs(a.correlation) > Math.abs(b.correlation) ? a : b)
    : null;

  const getCorrelationInterpretation = () => {
    if (correlationData.length === 0) return 'No correlations available.';
    let text = `${correlationData.length} factor${correlationData.length > 1 ? 's' : ''} analyzed. `;
    if (significantFactors.length > 0) {
      text += `${significantFactors.length} statistically significant (p < 0.05). `;
    } else {
      text += 'No factors reached statistical significance (p < 0.05). ';
    }
    text += `${positiveCorrs.length} positive and ${negativeCorrs.length} negative correlation${negativeCorrs.length !== 1 ? 's' : ''}. `;
    if (strongestFactor) {
      const dir = strongestFactor.correlation > 0 ? 'positive' : 'inverse';
      text += `Strongest: ${strongestFactor.factor} (corr = ${strongestFactor.correlation.toFixed(3)}, lag = ${strongestFactor.lag}) — ${dir} relationship.`;
    }
    return text;
  };

  const getLeadingInterpretation = () => {
    if (leadingFactors.length === 0) return '';
    const strongest = leadingFactors.reduce((a, b) => Math.abs(a.correlation) > Math.abs(b.correlation) ? a : b);
    let text = `${leadingFactors.length} factor${leadingFactors.length > 1 ? 's' : ''} lead the portfolio. `;
    text += `These macro variables move before the portfolio, making them potential predictive signals. `;
    text += `The strongest leading signal is ${strongest.factor} (corr = ${strongest.correlation.toFixed(3)}, ${Math.abs(strongest.lag)} ${Math.abs(strongest.lag) === 1 ? 'day' : 'days'} ahead) — `;
    text += strongest.correlation > 0
      ? 'a rise in this factor anticipates a portfolio increase.'
      : 'a rise in this factor anticipates a portfolio decline.';
    return text;
  };

  const getLaggingInterpretation = () => {
    if (laggingFactors.length === 0) return '';
    const strongest = laggingFactors.reduce((a, b) => Math.abs(a.correlation) > Math.abs(b.correlation) ? a : b);
    let text = `${laggingFactors.length} factor${laggingFactors.length > 1 ? 's' : ''} lag the portfolio. `;
    text += `These macro variables react after the portfolio moves, suggesting the portfolio may influence or anticipate these indicators. `;
    text += `The strongest lagging signal is ${strongest.factor} (corr = ${strongest.correlation.toFixed(3)}, ${strongest.lag} ${strongest.lag === 1 ? 'day' : 'days'} behind).`;
    return text;
  };

  const getOverallInsight = () => {
    if (correlationData.length === 0) return 'Insufficient data for analysis.';
    let text = '';
    if (leadingFactors.length > laggingFactors.length) {
      text += 'More factors lead than lag the portfolio — macro conditions may be a useful predictor of portfolio performance. ';
    } else if (laggingFactors.length > leadingFactors.length) {
      text += 'More factors lag than lead the portfolio — the portfolio tends to anticipate macro movements. ';
    } else if (leadingFactors.length === laggingFactors.length && leadingFactors.length > 0) {
      text += 'Equal number of leading and lagging factors — the portfolio has a balanced relationship with macro conditions. ';
    }
    if (strongestFactor && Math.abs(strongestFactor.correlation) >= 0.7) {
      text += `Very strong correlation detected with ${strongestFactor.factor} — consider this factor as a key driver.`;
    } else if (strongestFactor && Math.abs(strongestFactor.correlation) >= 0.4) {
      text += `Moderate macro sensitivity detected. The portfolio has meaningful but not dominant macro exposure.`;
    } else {
      text += `Weak correlations overall — the portfolio appears largely independent of the macro factors tested.`;
    }
    return text;
  };

  return (
    <div className="results-container">
      {/* Notebook-style header */}
      <div className="notebook-header">
        <h2>MACRO CORRELATION ANALYSIS</h2>
      </div>

      {/* Unified Correlations Table */}
      <Card className="result-table-card notebook-style">
        <h3 className="notebook-section-title">CORRELATIONS WITH OPTIMAL LAG</h3>
        <p className="notebook-description">
          Cross-correlation analysis with optimal lag detection. Each factor is tested at multiple lags to find
          the time offset that maximizes the correlation with portfolio returns.
        </p>
        <div className="table-container">
          <table className="notebook-table-styled">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Factor (id)</th>
                <th style={{ textAlign: 'left' }}>Tipo</th>
                <th style={{ textAlign: 'left' }}>Description</th>
                <th style={{ textAlign: 'right' }}>Corr</th>
                <th style={{ textAlign: 'right' }}>Lag</th>
                <th style={{ textAlign: 'center' }}>Direction</th>
                <th style={{ textAlign: 'right' }}>t-stat</th>
                <th style={{ textAlign: 'right' }}>p-value</th>
              </tr>
            </thead>
            <tbody>
              {correlationData.map((row, idx) => {
                const absLag = Math.abs(row.lag);
                const dirLabel = row.lag < 0
                  ? `${absLag}d ahead`
                  : row.lag > 0
                    ? `${absLag}d behind`
                    : 'Same day';
                const dirColor = row.lag < 0 ? '#2563eb' : row.lag > 0 ? '#f59e0b' : '#6b7280';
                return (
                  <tr key={idx}>
                    <td style={{ textAlign: 'left', fontWeight: '500' }}>{row.factor}</td>
                    <td style={{ textAlign: 'left', fontSize: '0.8em', color: '#64748b' }}>{row.factorKind}</td>
                    <td style={{ textAlign: 'left', fontSize: '0.85em', color: '#666' }}>
                      {row.description}
                    </td>
                    <td style={{
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      color: row.correlation >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      {row.correlation.toFixed(3)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                      {row.lag}
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '0.85em', fontWeight: '500', color: dirColor }}>
                      {dirLabel}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                      {row.tStat !== null ? row.tStat.toFixed(3) : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                      {row.pValue !== null ? row.pValue.toFixed(4) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="notebook-note">
          <span style={{ color: '#2563eb' }}>Ahead</span> = factor moves before the portfolio (predictive signal),{' '}
          <span style={{ color: '#f59e0b' }}>Behind</span> = factor reacts after the portfolio,{' '}
          <span style={{ color: '#6b7280' }}>Same day</span> = simultaneous movement.
        </div>
        <div className="notebook-interpretation">
          <p><strong>Interpretation:</strong> {getCorrelationInterpretation()}</p>
          {leadingFactors.length > 0 && (
            <p><strong>Leading factors:</strong> {getLeadingInterpretation()}</p>
          )}
          {laggingFactors.length > 0 && (
            <p><strong>Lagging factors:</strong> {getLaggingInterpretation()}</p>
          )}
        </div>
      </Card>

      {/* Correlation chart */}
      {correlationData.length > 0 && (
        <Card className="result-chart-card">
          <h3 className="result-section-title">CORRELATION VISUALIZATION</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={correlationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="factor" />
              <YAxis domain={[-1, 1]} />
              <Tooltip 
                formatter={(value) => value.toFixed(4)}
              />
              <Legend />
              <Bar 
                dataKey="correlation" 
                fill="#2563eb"
                name="Correlation"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Overall Interpretation */}
      <Card className="result-summary-card notebook-style">
        <h3 className="notebook-section-title">OVERALL INTERPRETATION</h3>
        <div className="notebook-interpretation">
          <p>{getOverallInsight()}</p>
        </div>
      </Card>

      {/* Insight */}
      <div className="notebook-insight">
        <span className="insight-icon"></span>
        <span className="insight-text">
          Insight: Leading factors predict future portfolio movements. Use them as early warning signals for portfolio allocation decisions.
        </span>
      </div>
    </div>
  );
};

export default MacroCorrelationResults;

