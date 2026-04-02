import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Card from '../Card/Card';
import './Results.css';

const firstDefined = (...values) => {
  for (const v of values) if (v != null) return v;
  return null;
};

const capitalize = (s) =>
  s.charAt(0).toUpperCase() + s.slice(1).replaceAll('_', ' ');

const correlationColor = (v) =>
  v > 0.7 ? '#10b981' : v > 0.3 ? '#3b82f6' : v > -0.3 ? '#f59e0b' : '#ef4444';

const pct = (v, decimals = 2) =>
  v != null ? `${(v * 100).toFixed(decimals)}%` : 'N/A';

const Interpretation = ({ text }) =>
  text ? <div className="metric-interpretation">{text}</div> : null;

const PairTable = ({ title, pairs }) => (
  <Card className="result-table-card">
    <h3 className="result-section-title">{title}</h3>
    <div className="table-container">
      <table className="results-table">
        <thead>
          <tr><th>Pair</th><th>Correlation</th></tr>
        </thead>
        <tbody>
          {pairs.map((pair, idx) => (
            <tr key={idx}>
              <td className="factor-name">{pair.pair}</td>
              <td className="numeric correlation-cell"
                style={{ backgroundColor: correlationColor(pair.value) }}>
                {pair.value.toFixed(3)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

const RiskResults = ({ data, type }) => {
  if (!data) return null;

  if (type === 'ratios') {
    const ratios = [
      { name: 'Sharpe Ratio',       value: data.sharpe_ratio,       color: '#2563eb', interpretation: data.sharpe_interpretation },
      { name: 'Sortino Ratio',      value: data.sortino_ratio,      color: '#10b981', interpretation: data.sortino_interpretation },
      { name: 'Calmar Ratio',       value: data.calmar_ratio,       color: '#f59e0b', interpretation: data.calmar_interpretation },
      { name: 'Information Ratio',  value: data.information_ratio,  color: '#8b5cf6', interpretation: data.information_interpretation },
      { name: 'Sterling Ratio',     value: data.sterling_ratio,     color: '#ec4899', interpretation: null },
    ].filter(r => r.value != null);

    return (
      <div className="results-container">
        <Card className="result-summary-card">
          <h3 className="result-section-title">Performance/Risk Ratios</h3>
          <div className="ratios-grid">
            {ratios.map((ratio, idx) => (
              <div key={idx} className="ratio-card">
                <div className="ratio-name">{ratio.name}</div>
                <div className="ratio-value" style={{ color: ratio.color }}>
                  {ratio.value.toFixed(4)}
                </div>
                <Interpretation text={ratio.interpretation} />
              </div>
            ))}
          </div>
        </Card>

        {(data.annual_return != null || data.annual_volatility != null || data.downside_volatility != null) && (
          <Card className="result-summary-card">
            <h3 className="result-section-title">Additional Metrics</h3>
            <div className="summary-grid">
              {data.annual_return != null && (
                <div className="summary-item">
                  <span className="summary-label">Annual Return</span>
                  <span className={`summary-value ${data.annual_return >= 0 ? 'positive' : 'negative'}`}>
                    {pct(data.annual_return)}
                  </span>
                </div>
              )}
              {data.annual_volatility != null && (
                <div className="summary-item">
                  <span className="summary-label">Annual Volatility</span>
                  <span className="summary-value">{pct(data.annual_volatility)}</span>
                </div>
              )}
              {data.downside_volatility != null && (
                <div className="summary-item">
                  <span className="summary-label">Downside Volatility</span>
                  <span className="summary-value">{pct(data.downside_volatility)}</span>
                </div>
              )}
              {data.excess_return != null && (
                <div className="summary-item">
                  <span className="summary-label">Excess Return</span>
                  <span className={`summary-value ${data.excess_return >= 0 ? 'positive' : 'negative'}`}>
                    {pct(data.excess_return)}
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    );
  }

  if (type === 'var') {
    const methods    = data.methods || data.comparison || {};
    const varValue   = firstDefined(data.var_daily, data.var, data.value_at_risk);
    const esValue    = firstDefined(data.es_daily, data.es, data.expected_shortfall);
    const varAnnual  = data.var_annual;
    const esAnnual   = data.es_annual;
    const confidence = data.confidence_level || 0.95;
    const warnings   = data.warnings || data.distribution_warnings || [];
    const riskLevel  = data.risk_level || data.interpretation || '';
    const hasMethods = Object.keys(methods).length > 0;

    return (
      <div className="results-container">
        {warnings.length > 0 && (
          <Card className="result-summary-card warning-card">
            <h3 className="result-section-title">⚠️ Warnings</h3>
            <ul className="warning-list">
              {warnings.map((w, idx) => <li key={idx}>{w}</li>)}
            </ul>
          </Card>
        )}

        {hasMethods ? (
          <>
            <Card className="result-table-card">
              <h3 className="result-section-title">Method Comparison</h3>
              <div className="table-container">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Daily VaR</th>
                      <th>Annual VaR</th>
                      <th>Daily ES</th>
                      <th>Annual ES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(methods).map(([method, v], idx) => (
                      <tr key={idx}>
                        <td className="factor-name">{capitalize(method)}</td>
                        <td className="numeric negative">{pct(firstDefined(v.var_daily, v.var))}</td>
                        <td className="numeric negative">{pct(v.var_annual)}</td>
                        <td className="numeric negative">{pct(firstDefined(v.es_daily, v.es))}</td>
                        <td className="numeric negative">{pct(v.es_annual)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="result-summary-card">
              <h3 className="result-section-title">Interpretation</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Average Daily VaR</span>
                  <span className="summary-value negative">{pct(data.avg_var_daily)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Average Daily ES</span>
                  <span className="summary-value negative">{pct(data.avg_es_daily)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Maximum Expected Loss</span>
                  <span className="summary-value negative">{pct(data.max_loss)}</span>
                </div>
                {riskLevel && (
                  <div className="summary-item">
                    <span className="summary-label">Risk Level</span>
                    <span className="summary-value">{riskLevel}</span>
                  </div>
                )}
              </div>
            </Card>
          </>
        ) : (
          <Card className="result-summary-card">
            <h3 className="result-section-title">Value at Risk (VaR) & Expected Shortfall (ES)</h3>
            <div className="summary-grid">
              {varValue != null ? (
                <>
                  <div className="summary-item">
                    <span className="summary-label">Daily VaR</span>
                    <span className="summary-value negative">{pct(varValue, 4)}</span>
                  </div>
                  {varAnnual != null && (
                    <div className="summary-item">
                      <span className="summary-label">Annual VaR</span>
                      <span className="summary-value negative">{pct(varAnnual)}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="summary-item">
                  <span className="summary-label">VaR</span>
                  <span className="summary-value">N/A</span>
                </div>
              )}
              {esValue != null ? (
                <>
                  <div className="summary-item">
                    <span className="summary-label">Daily ES</span>
                    <span className="summary-value negative">{pct(esValue, 4)}</span>
                  </div>
                  {esAnnual != null && (
                    <div className="summary-item">
                      <span className="summary-label">Annual ES</span>
                      <span className="summary-value negative">{pct(esAnnual)}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="summary-item">
                  <span className="summary-label">Expected Shortfall (ES)</span>
                  <span className="summary-value">N/A</span>
                </div>
              )}
              <div className="summary-item">
                <span className="summary-label">Confidence Level</span>
                <span className="summary-value">{pct(confidence, 0)}</span>
              </div>
              {data.method && (
                <div className="summary-item">
                  <span className="summary-label">Method</span>
                  <span className="summary-value">{capitalize(data.method)}</span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    );
  }

  if (type === 'drawdown') {
    const drawdownData     = data.drawdown_series || [];
    const maxDrawdown      = data.max_drawdown || 0;
    const maxDrawdownDate  = data.max_drawdown_date || data.drawdown_date || null;
    const drawdownDuration = data.drawdown_duration || data.duration || null;
    const calmarRatio      = data.calmar_ratio ?? null;
    const sterlingRatio    = data.sterling_ratio ?? null;
    const annualReturn     = data.annual_return ?? null;
    const riskLevel        = data.risk_level || data.interpretation || '';

    return (
      <div className="results-container">
        <Card className="result-summary-card">
          <h3 className="result-section-title">Drawdown Analysis</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Maximum Drawdown</span>
              <span className="summary-value negative">{pct(maxDrawdown)}</span>
            </div>
            {maxDrawdownDate && (
              <div className="summary-item">
                <span className="summary-label">Date</span>
                <span className="summary-value">
                  {new Date(maxDrawdownDate).toLocaleDateString('en-US')}
                </span>
              </div>
            )}
            {drawdownDuration != null && (
              <div className="summary-item">
                <span className="summary-label">Duration</span>
                <span className="summary-value">{drawdownDuration} days</span>
              </div>
            )}
            {annualReturn != null && (
              <div className="summary-item">
                <span className="summary-label">Annual Return</span>
                <span className={`summary-value ${annualReturn >= 0 ? 'positive' : 'negative'}`}>
                  {pct(annualReturn)}
                </span>
              </div>
            )}
          </div>
        </Card>

        {(calmarRatio != null || sterlingRatio != null) && (
          <Card className="result-summary-card">
            <h3 className="result-section-title">Drawdown Ratios</h3>
            <div className="summary-grid">
              {calmarRatio != null && (
                <div className="summary-item">
                  <span className="summary-label">Calmar Ratio</span>
                  <span className="summary-value">{calmarRatio.toFixed(3)}</span>
                  <Interpretation text={data.calmar_interpretation} />
                </div>
              )}
              {sterlingRatio != null && (
                <div className="summary-item">
                  <span className="summary-label">Sterling Ratio</span>
                  <span className="summary-value">{sterlingRatio.toFixed(3)}</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {riskLevel && (
          <Card className="result-summary-card">
            <h3 className="result-section-title">Interpretation</h3>
            <div className="interpretation-box">
              <p><strong>Risk level:</strong> {riskLevel}</p>
            </div>
          </Card>
        )}

        {drawdownData.length > 0 && (
          <Card className="result-chart-card">
            <h3 className="result-section-title">Drawdown Series</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={drawdownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickFormatter={(v) => pct(v, 1)} />
                <Tooltip formatter={(v) => pct(v)} />
                <Line
                  type="monotone"
                  dataKey="drawdown"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Drawdown"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    );
  }

  if (type === 'correlation') {
    const meanCorr = data.mean_correlation ?? null;
    const maxCorr  = data.max_correlation ?? null;
    const minCorr  = data.min_correlation ?? null;
    const stdCorr  = data.std_correlation ?? null;

    let correlationMatrix = data.correlation_matrix || data.correlation || {};
    let assets = [];
    const correlations = [];

    if (Array.isArray(correlationMatrix) && correlationMatrix.length > 0) {
      const firstRow = correlationMatrix[0];
      assets = Object.keys(firstRow).filter(k => k !== 'index' && k !== 'Index');

      const newMatrix = {};
      assets.forEach(a => { newMatrix[a] = { [a]: 1.0 }; });

      correlationMatrix.forEach(row => {
        const rowAsset = row.index || row.Index || assets[0];
        assets.forEach(col => {
          if (row[col] != null) {
            if (!newMatrix[rowAsset]) newMatrix[rowAsset] = {};
            newMatrix[rowAsset][col] = row[col];
          }
        });
      });
      correlationMatrix = newMatrix;
    } else if (correlationMatrix && typeof correlationMatrix === 'object' && !Array.isArray(correlationMatrix)) {
      assets = Object.keys(correlationMatrix);
    }

    assets.forEach((a1, i) => {
      assets.forEach((a2, j) => {
        if (i === j) return;
        const value = correlationMatrix[a1]?.[a2];
        if (value != null && !isNaN(value)) {
          correlations.push({
            pair: `${a1.replace('^', '')} - ${a2.replace('^', '')}`,
            value,
          });
        }
      });
    });

    const avgCorr = meanCorr ?? (correlations.length > 0
      ? correlations.reduce((s, c) => s + c.value, 0) / correlations.length : 0);
    const maxCorrValue = maxCorr ?? (correlations.length > 0
      ? Math.max(...correlations.map(c => c.value)) : 0);
    const minCorrValue = minCorr ?? (correlations.length > 0
      ? Math.min(...correlations.map(c => c.value)) : 0);
    const stdCorrValue = stdCorr ?? (correlations.length > 0
      ? Math.sqrt(correlations.reduce((s, c) => s + (c.value - avgCorr) ** 2, 0) / correlations.length) : 0);

    const sorted = [...correlations].sort((a, b) => b.value - a.value);
    const topPairs    = sorted.slice(0, 3);
    const bottomPairs = sorted.slice(-3).reverse();

    return (
      <div className="results-container">
        <Card className="result-summary-card">
          <h3 className="result-section-title">Correlation Statistics</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Average Correlation</span>
              <span className="summary-value">{avgCorr.toFixed(3)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Maximum Correlation</span>
              <span className="summary-value">{maxCorrValue.toFixed(3)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Minimum Correlation</span>
              <span className="summary-value">{minCorrValue.toFixed(3)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Standard Deviation</span>
              <span className="summary-value">{stdCorrValue.toFixed(3)}</span>
            </div>
          </div>
        </Card>

        {topPairs.length > 0 && <PairTable title="Most Correlated Pairs" pairs={topPairs} />}
        {bottomPairs.length > 0 && <PairTable title="Least Correlated Pairs" pairs={bottomPairs} />}

        {assets.length > 0 && (
          <Card className="result-table-card">
            <h3 className="result-section-title">Correlation Matrix</h3>
            <div className="table-container">
              <table className="results-table correlation-table">
                <thead>
                  <tr>
                    <th></th>
                    {assets.map(a => <th key={a}>{a.replace('^', '')}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a1, i) => (
                    <tr key={a1}>
                      <td className="factor-name">{a1.replace('^', '')}</td>
                      {assets.map((a2, j) => {
                        const value = correlationMatrix[a1]?.[a2] ?? (i === j ? 1 : 0);
                        return (
                          <td key={a2} className="numeric correlation-cell"
                            style={{ backgroundColor: correlationColor(value) }}>
                            {value.toFixed(3)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    );
  }

  if (type === 'distribution') {
    const skewness  = data.skewness || 0;
    const kurtosis  = data.kurtosis || data.excess_kurtosis || 0;
    const jarqueBera = firstDefined(data.jarque_bera, data.jb_statistic);
    const jbPValue   = firstDefined(data.jb_pvalue, data.p_value);
    const isNormal   = data.is_normal != null ? data.is_normal : (jbPValue != null ? jbPValue > 0.05 : null);

    return (
      <div className="results-container">
        <Card className="result-summary-card">
          <h3 className="result-section-title">Distribution Analysis</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Skewness</span>
              <span className="summary-value">{skewness.toFixed(3)}</span>
              <Interpretation text={data.skewness_interpretation} />
            </div>
            <div className="summary-item">
              <span className="summary-label">Excess Kurtosis</span>
              <span className="summary-value">{kurtosis.toFixed(3)}</span>
              <Interpretation text={data.kurtosis_interpretation} />
            </div>
            {jarqueBera != null && (
              <div className="summary-item">
                <span className="summary-label">JB Statistic</span>
                <span className="summary-value">{jarqueBera.toFixed(2)}</span>
              </div>
            )}
            {jbPValue != null && (
              <div className="summary-item">
                <span className="summary-label">P-Value</span>
                <span className="summary-value">{jbPValue.toFixed(4)}</span>
              </div>
            )}
            {isNormal != null && (
              <div className="summary-item">
                <span className="summary-label">Normal Distribution</span>
                <span>
                  <span className="significance-badge"
                    style={{ backgroundColor: isNormal ? '#10b981' : '#ef4444' }}>
                    {isNormal ? 'Yes' : 'No'}
                  </span>
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (type === 'benchmark') {
    const trackingError      = firstDefined(data.tracking_error, data.tracking_error_daily);
    const trackingErrorAnn   = data.tracking_error_annual ?? null;
    const informationRatio   = data.information_ratio ?? null;
    const beta               = data.beta ?? null;
    const rSquared           = firstDefined(data.r_squared, data.r2);
    const correlation        = data.correlation ?? null;
    const alpha              = firstDefined(data.alpha, data.alpha_annual);
    const portfolioReturn    = firstDefined(data.portfolio_return, data.portfolio_return_annual);
    const benchmarkReturn    = firstDefined(data.benchmark_return, data.benchmark_return_annual);
    const expectedReturn     = firstDefined(data.expected_return, data.expected_return_capm);

    return (
      <div className="results-container">
        <Card className="result-summary-card">
          <h3 className="result-section-title">Benchmark Analysis</h3>
          <div className="summary-grid">
            {trackingError != null && (
              <div className="summary-item">
                <span className="summary-label">Tracking Error (Daily)</span>
                <span className="summary-value">{pct(trackingError)}</span>
                <Interpretation text={data.tracking_interpretation} />
              </div>
            )}
            {trackingErrorAnn != null && (
              <div className="summary-item">
                <span className="summary-label">Tracking Error (Annual)</span>
                <span className="summary-value">{pct(trackingErrorAnn)}</span>
              </div>
            )}
            {informationRatio != null && (
              <div className="summary-item">
                <span className="summary-label">Information Ratio</span>
                <span className={`summary-value ${informationRatio >= 0 ? 'positive' : 'negative'}`}>
                  {informationRatio.toFixed(3)}
                </span>
                <Interpretation text={data.information_interpretation} />
              </div>
            )}
            {beta != null && (
              <div className="summary-item">
                <span className="summary-label">Beta</span>
                <span className="summary-value">{beta.toFixed(3)}</span>
                <Interpretation text={data.beta_interpretation} />
              </div>
            )}
            {rSquared != null && (
              <div className="summary-item">
                <span className="summary-label">R²</span>
                <span className="summary-value">{rSquared.toFixed(3)}</span>
              </div>
            )}
            {correlation != null && (
              <div className="summary-item">
                <span className="summary-label">Correlation</span>
                <span className="summary-value">{correlation.toFixed(3)}</span>
              </div>
            )}
            {alpha != null && (
              <div className="summary-item">
                <span className="summary-label">Alpha (Jensen) Annual</span>
                <span className={`summary-value ${alpha >= 0 ? 'positive' : 'negative'}`}>
                  {pct(alpha)}
                </span>
                <Interpretation text={data.alpha_interpretation} />
              </div>
            )}
          </div>
        </Card>

        {(portfolioReturn != null || benchmarkReturn != null || expectedReturn != null) && (
          <Card className="result-summary-card">
            <h3 className="result-section-title">Return Comparison</h3>
            <div className="summary-grid">
              {portfolioReturn != null && (
                <div className="summary-item">
                  <span className="summary-label">Portfolio Return</span>
                  <span className={`summary-value ${portfolioReturn >= 0 ? 'positive' : 'negative'}`}>
                    {pct(portfolioReturn)}
                  </span>
                </div>
              )}
              {benchmarkReturn != null && (
                <div className="summary-item">
                  <span className="summary-label">Benchmark Return</span>
                  <span className={`summary-value ${benchmarkReturn >= 0 ? 'positive' : 'negative'}`}>
                    {pct(benchmarkReturn)}
                  </span>
                </div>
              )}
              {expectedReturn != null && (
                <div className="summary-item">
                  <span className="summary-label">Expected Return (CAPM)</span>
                  <span className={`summary-value ${expectedReturn >= 0 ? 'positive' : 'negative'}`}>
                    {pct(expectedReturn)}
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    );
  }

  return null;
};

export default RiskResults;
