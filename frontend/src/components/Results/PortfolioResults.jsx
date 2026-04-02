import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import Card from '../Card/Card';
import { formatLargeNumber } from '../../utils/dataFormatter';
import './Results.css';

const SECTOR_PALETTE = [
  '#1e3a5f', '#2d6a4f', '#c0392b', '#d4a017', '#6c3483',
  '#117a65', '#2e86c1', '#b9770e', '#1a5276', '#7b241c',
  '#148f77', '#884ea0', '#2c3e50', '#a04000', '#1f618d',
];

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '8px 12px',
};

const CATEGORY_SCORE_MAP = {
  'Profitability': 'profitability',
  'Financial Health': 'financial_health',
  'Growth': 'growth',
  'Efficiency': 'efficiency',
  'Valuation': 'valuation',
};

const CATEGORY_NAMES = {
  profitability: 'Profitability',
  financial_health: 'Financial Health',
  growth: 'Growth',
  efficiency: 'Efficiency',
  valuation: 'Valuation',
};

const CATEGORY_KEYS = Object.keys(CATEGORY_NAMES);

const PERCENTAGE_KEYWORDS = ['margin', 'yield'];
const RATIO_KEYWORDS = [
  'debt_equity', 'debt_ebitda', 'net_cash_ebitda', 'current_ratio', 'quick_ratio',
  'pe_ttm', 'pe_forward', 'pb_ratio', 'ps_ratio', 'ev_ebitda', 'ev_revenue',
  'peg_ratio', 'asset_turnover', 'inventory_turnover', 'receivables_turnover',
];
const MONETARY_KEYWORDS = [
  'total_debt', 'total_cash', 'net_cash', 'free_cash_flow', 'ebitda',
  'total_revenue', 'total_assets', 'market_cap', 'revenue_per_employee',
];

const scoreColor = (score) => {
  if (score >= 70) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
};

const CONCLUSION_COLORS = {
  EXCELLENT: '#10b981', EXCELENTE: '#10b981',
  GOOD: '#3b82f6', BUENA: '#3b82f6', BUENO: '#3b82f6',
  REGULAR: '#f59e0b', AVERAGE: '#f59e0b', FAIR: '#f59e0b',
  WEAK: '#f59e0b', 'DÉBIL': '#f59e0b',
  CRITICAL: '#ef4444', 'CRÍTICA': '#ef4444',
};

const conclusionColor = (overall) =>
  CONCLUSION_COLORS[(overall || '').toUpperCase()] || '#64748b';

const GOOD_CLASSIFICATIONS = new Set(['excellent', 'good', 'very_cheap', 'cheap']);
const NEUTRAL_CLASSIFICATIONS = new Set(['regular', 'average', 'fair']);

const classificationScore = (cls) =>
  GOOD_CLASSIFICATIONS.has(cls) ? 80 : NEUTRAL_CLASSIFICATIONS.has(cls) ? 50 : 30;

const correlationColor = (v) =>
  v > 0.7 ? '#10b981' : v > 0.3 ? '#3b82f6' : v > -0.3 ? '#f59e0b' : '#ef4444';

const formatMetricValue = (key, value) => {
  if (value == null) return 'N/A';
  if (typeof value !== 'number') return value;

  const k = key.toLowerCase();

  if (PERCENTAGE_KEYWORDS.some(m => k.includes(m)) && Math.abs(value) <= 1.5)
    return (value * 100).toFixed(2) + '%';

  if (RATIO_KEYWORDS.some(m => k.includes(m)))
    return Math.abs(value) >= 1000 ? formatLargeNumber(value) : value.toFixed(2);

  if (k.includes('days')) return value.toFixed(2);

  if (MONETARY_KEYWORDS.some(m => k.includes(m)) || Math.abs(value) >= 1e6)
    return formatLargeNumber(value);

  if (Math.abs(value) < 1 && Math.abs(value) > 0) {
    if (['ratio', 'yield', 'margin', 'growth', 'ro'].some(m => k.includes(m)))
      return (value * 100).toFixed(2) + '%';
    return value.toFixed(4);
  }

  return value.toFixed(2);
};

const PortfolioResults = ({ data }) => {
  if (!data) return null;

  const metrics = data.metrics || data;
  const returns = data.returns || data.portfolio_returns || {};
  const weights = data.weights || data.optimal_weights || {};
  const correlation = data.correlation_matrix || data.correlation || {};

  const companyInfo = {};
  if (data.analysis) {
    Object.entries(data.analysis).forEach(([ticker, companyData]) => {
      if (companyData && companyData.success) {
        const sectorVal = companyData.sector && companyData.sector !== 'N/A' ? companyData.sector : null;
        const industryVal = companyData.industry && companyData.industry !== 'N/A' ? companyData.industry : null;
        companyInfo[ticker] = {
          name: companyData.company_name || ticker,
          sector: sectorVal,
          industry: industryVal,
        };
      }
    });
  }

  const weightsData = Object.entries(weights).map(([asset, weight]) => {
    const cleanAsset = asset.replace(/^\^/, '');
    const info = companyInfo[asset] || companyInfo[cleanAsset] || {};
    return {
      name: cleanAsset,
      value: typeof weight === 'number' ? weight : 0,
      companyName: info.name || cleanAsset,
      sector: info.sector || null,
      industry: info.industry || null,
    };
  }).filter(item => item.value > 0.0001);

  const totalWeight = weightsData.reduce((sum, item) => sum + item.value, 0);

  const sectorBreakdown = weightsData.reduce((acc, item) => {
    const sector = item.sector || 'Unclassified';
    acc[sector] = (acc[sector] || 0) + item.value;
    return acc;
  }, {});

  const sectorData = Object.entries(sectorBreakdown)
    .map(([sector, weight]) => ({ sector, weight, count: weightsData.filter(w => (w.sector || 'Unclassified') === sector).length }))
    .sort((a, b) => {
      if (a.sector === 'Unclassified') return 1;
      if (b.sector === 'Unclassified') return -1;
      return b.weight - a.weight;
    });

  // Single color map: sector → color, shared by pie chart and legend
  const sectorColorMap = {};
  sectorData.forEach((s, idx) => {
    sectorColorMap[s.sector] = SECTOR_PALETTE[idx % SECTOR_PALETTE.length];
  });

  const getAssetColor = (asset) => {
    const sector = asset.sector || 'Unclassified';
    return sectorColorMap[sector] || '#64748b';
  };

  const returnsData = Object.entries(returns)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([date, value]) => {
      const dateValue = typeof value === 'object' && value !== null 
        ? Object.values(value)[0] 
        : value;
      return {
        date: date,
        return: typeof dateValue === 'number' ? dateValue : 0,
      };
    })
    .filter(item => item.return !== 0);

  const correlationAssets = Object.keys(correlation);
  const hasCorrelation = correlationAssets.length > 0;

  return (
    <div className="results-container">
      {/* Main metrics */}
      {(metrics.sharpe_ratio !== undefined || metrics.expected_return !== undefined) && (
        <Card className="result-summary-card">
          <h3 className="result-section-title">Portfolio Metrics</h3>
          <div className="summary-grid">
            {metrics.expected_return !== undefined && (
              <div className="summary-item">
                <span className="summary-label">Expected Return</span>
                <span className={`summary-value ${metrics.expected_return >= 0 ? 'positive' : 'negative'}`}>
                  {isNaN(metrics.expected_return) || metrics.expected_return === null 
                    ? 'N/A' 
                    : `${(metrics.expected_return * 100).toFixed(4)}%`}
                </span>
              </div>
            )}
            {metrics.volatility !== undefined && (
              <div className="summary-item">
                <span className="summary-label">Volatility</span>
                <span className="summary-value">
                  {(metrics.volatility * 100).toFixed(4)}%
                </span>
              </div>
            )}
            {metrics.sharpe_ratio !== undefined && (
              <div className="summary-item">
                <span className="summary-label">Sharpe Ratio</span>
                <span className="summary-value">
                  {metrics.sharpe_ratio.toFixed(4)}
                </span>
              </div>
            )}
            {metrics.sortino_ratio !== undefined && (
              <div className="summary-item">
                <span className="summary-label">Sortino Ratio</span>
                <span className="summary-value">
                  {metrics.sortino_ratio.toFixed(4)}
                </span>
              </div>
            )}
            {metrics.max_drawdown !== undefined && (
              <div className="summary-item">
                <span className="summary-label">Maximum Drawdown</span>
                <span className="summary-value negative">
                  {(metrics.max_drawdown * 100).toFixed(4)}%
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Portfolio weights */}
      {weightsData.length > 0 && (
        <Card className="result-chart-card portfolio-weights-card">
          <h3 className="result-section-title">Portfolio Allocation</h3>
          <div className="portfolio-allocation-container">
          <div className="portfolio-chart-row">
            <div className="pie-chart-wrapper">
              <ResponsiveContainer width="100%" height={360}>
                <PieChart>
                  <defs>
                    {weightsData.map((entry, index) => {
                      const color = getAssetColor(entry);
                      return (
                        <linearGradient key={`grad-${index}`} id={`pieGrad-${index}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={color} stopOpacity={0.85} />
                          <stop offset="100%" stopColor={color} stopOpacity={1} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <Pie
                    data={weightsData}
                    cx="50%"
                    cy="50%"
                    outerRadius={145}
                    innerRadius={85}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={1.5}
                    cornerRadius={4}
                    animationBegin={0}
                    animationDuration={800}
                    stroke="none"
                    label={({ name, percent, cx, cy, midAngle, outerRadius: oR }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = oR + (percent < 0.03 ? 30 : 22);
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x} y={y}
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          style={{ fontSize: percent < 0.03 ? '0.65rem' : '0.75rem', fontWeight: 600, fill: '#334155' }}
                        >
                          {name} {(percent * 100).toFixed(1)}%
                        </text>
                      );
                    }}
                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  >
                    {weightsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#pieGrad-${index})`}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${(value * 100).toFixed(2)}%`, name]}
                    contentStyle={{
                      ...TOOLTIP_STYLE,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '0.875rem',
                    }}
                  />
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central"
                    style={{ fontSize: '1.75rem', fontWeight: 700, fill: '#1e293b' }}>
                    {weightsData.length}
                  </text>
                  <text x="50%" y="56%" textAnchor="middle" dominantBaseline="central"
                    style={{ fontSize: '0.8rem', fontWeight: 500, fill: '#94a3b8' }}>
                    assets
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="sector-legend">
              <h4 className="sector-legend-title">Sector Distribution</h4>
              <div className="sector-legend-list">
                {sectorData.map((s) => {
                  const pct = (s.weight * 100).toFixed(1);
                  const color = sectorColorMap[s.sector];
                  return (
                    <div key={s.sector} className="sector-legend-item">
                      <div className="sector-legend-left">
                        <div className="sector-legend-dot" style={{ backgroundColor: color }} />
                        <div className="sector-legend-info">
                          <span className="sector-legend-name">{s.sector}</span>
                          <span className="sector-legend-count">{s.count} {s.count === 1 ? 'asset' : 'assets'}</span>
                        </div>
                      </div>
                      <div className="sector-legend-right">
                        <span className="sector-legend-pct">{pct}%</span>
                        <div className="sector-legend-bar-bg">
                          <div className="sector-legend-bar" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {sectorData.length > 0 && (
                <div className="sector-concentration-note">
                  {sectorData[0].weight > 0.5
                    ? `High concentration: ${sectorData[0].sector} represents ${(sectorData[0].weight * 100).toFixed(0)}% of the portfolio.`
                    : sectorData.length <= 2
                      ? `Low diversification: only ${sectorData.length} sectors represented.`
                      : `Diversified across ${sectorData.length} sectors.`
                  }
                </div>
              )}
            </div>
          </div>
            <div className="weights-table-wrapper">
              <div className="weights-table-header">
                <h4>Asset Breakdown</h4>
                <div className="total-weight-badge">
                  Total: {totalWeight.toFixed(0) === '1' ? '100%' : `${(totalWeight * 100).toFixed(1)}%`}
                </div>
              </div>
              <div className="weights-list">
                {weightsData
                  .sort((a, b) => b.value - a.value)
                  .map((row, idx) => {
                    const color = getAssetColor(row);
                    return (
                      <div key={idx} className="weight-item">
                        <div className="weight-item-header">
                          <div className="weight-item-info">
                            <div 
                              className="weight-color-indicator" 
                              style={{ backgroundColor: color }}
                            ></div>
                            <div className="weight-item-details">
                              <div className="weight-item-main">
                                <span className="weight-asset-name">{row.name}</span>
                                <span className="weight-percentage">{(row.value * 100).toFixed(2)}%</span>
                              </div>
                              <div className="weight-item-meta">
                                <span className="weight-company-name">{row.companyName}</span>
                                {row.sector && (
                                  <span className="weight-sector">{row.sector}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="weight-bar-container">
                          <div 
                            className="weight-bar" 
                            style={{ 
                              width: `${row.value * 100}%`,
                              backgroundColor: color
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Historical returns */}
      {returnsData.length > 0 && (
        <Card className="result-chart-card">
          <h3 className="result-section-title">Historical Returns</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={returnsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tickFormatter={(value) => `${(value * 100).toFixed(2)}%`}
              />
              <Tooltip 
                formatter={(value) => `${(value * 100).toFixed(4)}%`}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="return" 
                stroke="#2563eb" 
                strokeWidth={2}
                name="Return"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Correlation matrix */}
      {hasCorrelation && (
        <Card className="result-table-card">
          <h3 className="result-section-title">Correlation Matrix</h3>
          <div className="table-container">
            <table className="results-table correlation-table">
              <thead>
                <tr>
                  <th></th>
                  {correlationAssets.map(asset => (
                    <th key={asset}>{asset.replace(/^\^/, '')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlationAssets.map((asset1, i) => {
                  const rowData = correlation[asset1] || {};
                  return (
                    <tr key={asset1}>
                      <td className="factor-name">{asset1.replace(/^\^/, '')}</td>
                      {correlationAssets.map((asset2, j) => {
                        const value = rowData[asset2] || (i === j ? 1 : 0);
                        return (
                          <td 
                            key={asset2}
                            className="numeric correlation-cell"
                            style={{ backgroundColor: correlationColor(value) }}
                          >
                            {value.toFixed(3)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detailed Company Analysis */}
      {data.analysis && Object.keys(data.analysis).length > 0 && (
        <div>
          <h3 className="result-section-title detailed-analysis-heading">
            Detailed Company Analysis
          </h3>
          {Object.entries(data.analysis)
            .filter(([ticker]) => {
              const cleanTicker = ticker.replace(/^\^/, '');
              const weight = weights[ticker] || weights[cleanTicker] || 0;
              return weight > 0.0001; 
            })
            .map(([ticker, companyData]) => {
            if (!companyData || !companyData.success) return null;

            const scores = companyData.scores || {};
            const conclusion = companyData.conclusion || {};
            const overall = conclusion.overall || 'N/A';
            const totalScore = scores.total ?? 0;
            const overallColor = conclusionColor(overall);

            const renderCategoryMetrics = (categoryName, categoryData) => {
              if (!categoryData?.metrics) return null;

              const catMetrics = categoryData.metrics || {};
              if (Object.keys(catMetrics).length === 0) return null;

              const classifications = categoryData.classifications || {};
              const categoryKey = CATEGORY_SCORE_MAP[categoryName] || categoryName.toLowerCase().replace(/\s+/g, '_');
              const catScore = scores[categoryKey] ?? null;

              return (
                <Card className="result-summary-card company-category-card" key={categoryName}>
                  <div className="category-header">
                    <h4 className="category-title">{categoryName}</h4>
                    <div className="category-score-badge" style={{
                      backgroundColor: catScore != null ? scoreColor(catScore) + '20' : '#94a3b820',
                      color: catScore != null ? scoreColor(catScore) : '#94a3b8',
                    }}>
                      {catScore != null ? catScore.toFixed(1) : 'N/A'}
                    </div>
                  </div>

                  <div className="summary-grid">
                    {Object.entries(catMetrics).map(([key, value]) => {
                      if (value == null) return null;
                      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      const cls = classifications[`${key} class`] || classifications[key] || null;
                      const clsScore = cls ? classificationScore(cls) : null;

                      return (
                        <div className="summary-item" key={key}>
                          <span className="summary-label">{label}</span>
                          <span className="summary-value">{formatMetricValue(key, value)}</span>
                          {cls && (
                            <span className="classification-badge" style={{
                              backgroundColor: scoreColor(clsScore) + '20',
                              color: scoreColor(clsScore),
                            }}>
                              {cls.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {categoryData.alerts?.length > 0 && (
                    <div className="category-alerts">
                      <div className="category-alerts-title">Alerts:</div>
                      <ul className="category-alerts-list">
                        {categoryData.alerts.map((alert, idx) => (
                          <li key={idx}>{alert}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              );
            };

            return (
              <Card key={ticker} className="result-summary-card company-card">
                <div className="company-header">
                  <div>
                    <h3 className="result-section-title company-name">{companyData.company_name || ticker}</h3>
                    <div className="company-meta">
                      <span className="company-meta-item"><strong>Ticker:</strong> {ticker}</span>
                      {companyData.sector && companyData.sector !== 'N/A' && (
                        <span className="company-meta-item"><strong>Sector:</strong> {companyData.sector}</span>
                      )}
                      {companyData.industry && companyData.industry !== 'N/A' && (
                        <span className="company-meta-item"><strong>Industry:</strong> {companyData.industry}</span>
                      )}
                    </div>
                  </div>
                  <div className="conclusion-badge" style={{
                    backgroundColor: overallColor + '20',
                    borderColor: overallColor,
                  }}>
                    <div className="conclusion-label">Conclusion</div>
                    <div className="conclusion-value" style={{ color: overallColor }}>{overall}</div>
                    <div className="conclusion-score" style={{ color: scoreColor(totalScore) }}>
                      {totalScore.toFixed(1)} / 100
                    </div>
                  </div>
                </div>

                {/* Category Scores */}
                <div className="scores-section">
                  <h4 className="scores-section-title">Scores by Category</h4>
                  <div className="summary-grid">
                    {CATEGORY_KEYS.map(catKey => {
                      const s = scores[catKey] ?? null;
                      if (s === 0 && !companyData[catKey]?.metrics) return null;
                      return (
                        <div className="summary-item" key={catKey}>
                          <span className="summary-label">{CATEGORY_NAMES[catKey]}</span>
                          <span className="summary-value" style={{ color: s != null ? scoreColor(s) : '#94a3b8' }}>
                            {s != null ? s.toFixed(1) : 'N/A'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed metrics by category */}
                {companyData.profitability && renderCategoryMetrics('Profitability', companyData.profitability)}
                {companyData.financial_health && renderCategoryMetrics('Financial Health', companyData.financial_health)}
                {companyData.growth && renderCategoryMetrics('Growth', companyData.growth)}
                {companyData.efficiency && renderCategoryMetrics('Efficiency', companyData.efficiency)}
                {companyData.valuation && renderCategoryMetrics('Valuation', companyData.valuation)}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PortfolioResults;

