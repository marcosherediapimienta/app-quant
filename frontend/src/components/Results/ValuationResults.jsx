import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine, ScatterChart, Scatter, ZAxis, PieChart, Pie } from 'recharts';
import Card from '../Card/Card';
import { formatLargeNumber } from '../../utils/formatters';
import './Results.css';

const CATEGORY_KEYS = ['profitability', 'financial_health', 'growth', 'efficiency', 'valuation'];
const CATEGORY_NAMES = {
  profitability: 'Profitability', financial_health: 'Financial Health',
  growth: 'Growth', efficiency: 'Efficiency', valuation: 'Valuation',
};
const CATEGORY_LABELS = {
  profitability: 'Profitability', financial_health: 'Fin. Health',
  growth: 'Growth', efficiency: 'Efficiency', valuation: 'Valuation',
};
const COMPANY_COLORS = [
  '#1e3a5f', '#2d6a4f', '#c0392b', '#d4a017', '#6c3483',
  '#117a65', '#2e86c1', '#b9770e', '#1a5276', '#7b241c',
  '#148f77', '#884ea0', '#2c3e50', '#a04000', '#1f618d',
];
const TOOLTIP_STYLE = {
  background: '#fff', border: '1px solid #e2e8f0',
  borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '0.85rem',
};

const getScoreColor = (s) => s >= 70 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444';

const getConclusionColor = (overall) => {
  const u = (overall || '').toUpperCase();
  if (u === 'EXCELLENT' || u === 'EXCELENTE') return '#10b981';
  if (u === 'GOOD' || u === 'BUENA' || u === 'BUENO') return '#3b82f6';
  if (u === 'FAIR' || u === 'AVERAGE' || u === 'REGULAR') return '#f59e0b';
  if (u === 'WEAK' || u === 'DÉBIL') return '#f97316';
  if (u === 'CRITICAL' || u === 'CRÍTICA') return '#ef4444';
  return '#64748b';
};

const getSignalColor = (signal) => {
  const u = (signal || '').toUpperCase();
  if (u === 'BUY' || u === 'COMPRA') return '#10b981';
  if (u === 'SELL' || u === 'VENTA') return '#ef4444';
  if (u === 'HOLD' || u === 'MANTENER') return '#f59e0b';
  return '#64748b';
};

const getConfidenceColor = (c) => c >= 70 ? '#10b981' : c >= 50 ? '#f59e0b' : '#ef4444';

const getHeatmapColor = (score) => {
  if (score >= 80) return { bg: '#059669', text: '#ffffff' };
  if (score >= 65) return { bg: '#10b981', text: '#ffffff' };
  if (score >= 50) return { bg: '#84cc16', text: '#1a2e05' };
  if (score >= 40) return { bg: '#eab308', text: '#422006' };
  if (score >= 25) return { bg: '#f97316', text: '#ffffff' };
  return { bg: '#ef4444', text: '#ffffff' };
};

const normConf = (v) => (v > 1 ? v : v * 100);
const normUpside = (v) => (Math.abs(v) > 1 ? v : v * 100);

const classificationScore = (cls) =>
  ['excellent', 'good', 'very_cheap', 'cheap'].includes(cls) ? 80
    : ['regular', 'average', 'fair'].includes(cls) ? 50 : 30;

const RATIO_METRICS = [
  'debt_equity', 'debt_ebitda', 'net_cash_ebitda', 'current_ratio', 'quick_ratio',
  'pe_ttm', 'pe_forward', 'pb_ratio', 'ps_ratio', 'ev_ebitda', 'ev_revenue',
  'peg_ratio', 'asset_turnover', 'inventory_turnover', 'receivables_turnover', 'earnings_yield',
];
const MONETARY_METRICS = [
  'total_debt', 'total_cash', 'net_cash', 'free_cash_flow', 'ebitda',
  'total_revenue', 'total_assets', 'market_cap', 'revenue_per_employee',
];

const formatMetricValue = (key, value) => {
  if (value == null) return 'N/A';
  if (typeof value !== 'number') return value;
  const lk = key.toLowerCase();
  if (['margin', 'yield'].some(m => lk.includes(m)) && Math.abs(value) <= 1.5)
    return (value * 100).toFixed(2) + '%';
  if (RATIO_METRICS.some(m => lk.includes(m))) {
    if (Math.abs(value) >= 1000) return formatLargeNumber(value);
    if (lk.includes('earnings_yield') && Math.abs(value) <= 1) return (value * 100).toFixed(2) + '%';
    return value.toFixed(2);
  }
  if (lk.includes('days')) return value.toFixed(2);
  if (MONETARY_METRICS.some(m => lk.includes(m)) || Math.abs(value) >= 1e6)
    return formatLargeNumber(value);
  if (Math.abs(value) < 1 && value !== 0) {
    if ((lk.includes('yield') || lk.includes('margin')) && !RATIO_METRICS.some(m => lk.includes(m)))
      return (value * 100).toFixed(2) + '%';
    return value.toFixed(4);
  }
  return value.toFixed(2);
};

const CATEGORY_DESCRIPTIONS = {
  'Profitability': 'Measures how effectively the company converts revenue into profit. Key metrics include return on equity (ROE), return on assets (ROA), and operating/net margins. Higher values generally indicate stronger competitive advantages and pricing power.',
  'Financial Health': 'Assesses the company\'s balance sheet strength and ability to meet obligations. Focuses on leverage ratios (debt/equity, debt/EBITDA), liquidity (current ratio), and cash position. Lower debt ratios and higher liquidity indicate greater financial resilience.',
  'Growth': 'Evaluates the company\'s revenue and earnings trajectory. Compares year-over-year and quarter-over-quarter growth rates. Consistent growth above industry averages suggests strong demand and scalability.',
  'Efficiency': 'Measures how well the company uses its assets and resources to generate revenue. Includes asset turnover, inventory management, and receivables collection. Higher turnover ratios indicate better operational efficiency.',
  'Valuation': 'Compares the stock price to fundamental metrics to assess whether the company is fairly priced. Lower P/E, P/B, and EV/EBITDA ratios suggest cheaper valuation relative to earnings and assets. Context matters — growth companies typically trade at higher multiples.',
};

const getInvestmentProfile = (scores, totalScore) => {
  const prof = scores.profitability || 0;
  const growth = scores.growth || 0;
  const val = scores.valuation || 0;
  const health = scores.financial_health || 0;

  if (totalScore >= 75 && prof >= 70 && health >= 70) return { label: 'Quality Compounder', icon: '💎', color: '#10b981', desc: 'High-quality business with strong profitability and financial health. Suitable for long-term compounding strategies.' };
  if (growth >= 70 && val < 50) return { label: 'Growth Stock', icon: '🚀', color: '#8b5cf6', desc: 'High growth potential but elevated valuation. Suitable for growth-oriented investors with higher risk tolerance.' };
  if (val >= 70 && prof >= 50) return { label: 'Value Play', icon: '🏷️', color: '#3b82f6', desc: 'Attractively valued with reasonable profitability. Potential for mean reversion and margin of safety.' };
  if (val >= 70 && prof < 50) return { label: 'Deep Value / Contrarian', icon: '🔍', color: '#f59e0b', desc: 'Cheap valuation but weak fundamentals. High risk/reward — requires deep due diligence and catalyst identification.' };
  if (prof >= 70 && growth < 40) return { label: 'Cash Cow / Income', icon: '🐄', color: '#06b6d4', desc: 'Strong profitability but limited growth. Potentially suitable for income-focused or dividend strategies.' };
  if (health < 35) return { label: 'Distressed / Turnaround', icon: '⚠️', color: '#ef4444', desc: 'Weak financial health signals elevated bankruptcy risk. Only for experienced investors with special situation expertise.' };
  if (totalScore >= 55 && totalScore < 75) return { label: 'Balanced Profile', icon: '⚖️', color: '#64748b', desc: 'No standout strengths or weaknesses. Average company with moderate investment appeal across dimensions.' };
  if (totalScore < 40) return { label: 'Avoid / Underperformer', icon: '🚫', color: '#ef4444', desc: 'Below-average scores across most dimensions. Limited investment merit under current conditions.' };
  return { label: 'Neutral', icon: '➖', color: '#94a3b8', desc: 'Mixed signals — further analysis recommended before making investment decisions.' };
};

const getProfileShort = (scores) => {
  const { label, icon, color } = getInvestmentProfile(scores, scores.total || 0);
  return { label: label.split(' / ')[0], icon, color };
};

const ValuationResults = ({ data }) => {
  if (!data) return null;
  const isSignals = !data.ticker && !data.scores && !data.individual_results && 
    Object.keys(data).length > 0 &&
    Object.values(data).every(item => 
      item && typeof item === 'object' && 
      (item.signal !== undefined || item.confidence !== undefined || item.price_target !== undefined)
    ) &&
    !Object.values(data).some(item => 
      item && typeof item === 'object' && (item.scores || item.conclusion) && !item.signal
    );

  if (isSignals) {
    return <SignalsView data={data} />;
  }

  const hasTopLevelTicker = !!data.ticker;
  const hasTopLevelScores = !!data.scores;
  const hasIndividualResults = !!data.individual_results;
  
  let isComparison = false;

  if (hasIndividualResults && typeof data.individual_results === 'object') {
    const individualResults = data.individual_results;
    const resultKeys = Object.keys(individualResults);
    isComparison = resultKeys.length > 0 && resultKeys.every(key => {
      const item = individualResults[key];
      return item && typeof item === 'object' && (item.ticker || item.scores || item.conclusion || item.success);
    });
  } else if (Array.isArray(data)) {

    isComparison = data.length > 1 && data.every(item => 
      item && typeof item === 'object' && (item.ticker || item.scores || item.conclusion)
    );
  } else if (!hasTopLevelTicker && !hasTopLevelScores) {

    const keys = Object.keys(data);
    const excludeKeys = ['success', 'valid_count', 'ranking', 'category_leaders', 'group_stats', 'summary_df', 'error'];
    const relevantKeys = keys.filter(k => !excludeKeys.includes(k));
    
    isComparison = relevantKeys.length > 0 && relevantKeys.every(key => {
      const item = data[key];
      return item && typeof item === 'object' && (item.ticker || item.scores || item.conclusion);
    });
  }

  if (isComparison) {
    return <ComparisonView data={data} />;
  }

  const ticker = data.ticker || 'N/A';
  const scores = data.scores || {};
  const conclusion = data.conclusion || {};
  const overall = conclusion.overall || 'N/A';
  const totalScore = scores.total || conclusion.score || 0;
  const scoresData = [
    { name: 'Profitability', value: scores.profitability || 0, key: 'profitability' },
    { name: 'Financial Health', value: scores.financial_health || 0, key: 'financial_health' },
    { name: 'Growth', value: scores.growth || 0, key: 'growth' },
    { name: 'Efficiency', value: scores.efficiency || 0, key: 'efficiency' },
    { name: 'Valuation', value: scores.valuation || 0, key: 'valuation' },
  ];

  // CATEGORY_DESCRIPTIONS is defined at module level

  const renderCategoryMetrics = (categoryName, categoryData) => {
    if (!categoryData || !categoryData.metrics) return null;

    const metrics = categoryData.metrics || {};
    const classifications = categoryData.classifications || {};
    const categoryKey = categoryName.toLowerCase().replaceAll(' ', '_');
    let score = scores[categoryKey] || 0;

    if (score === 0 && categoryData.score !== undefined) {
      score = categoryData.score;
    }

    return (
      <Card className="result-summary-card" key={categoryName}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
          <h3 className="result-section-title">{categoryName}</h3>
          <div style={{ 
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--border-radius)',
            backgroundColor: getScoreColor(score) + '20',
            color: getScoreColor(score),
            fontWeight: 700,
            fontSize: '1.25rem'
          }}>
            {score.toFixed(1)}
          </div>
        </div>
        {CATEGORY_DESCRIPTIONS[categoryName] && (
          <p className="notebook-description" style={{ marginBottom: 'var(--spacing-md)' }}>
            {CATEGORY_DESCRIPTIONS[categoryName]}
          </p>
        )}
        
        <div className="summary-grid">
          {Object.entries(metrics).map(([key, value]) => {

            if (value === null || value === undefined || 
                (typeof value === 'number' && (isNaN(value) || !isFinite(value)))) return null;
            
            const label = key
              .replace(/_/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase());
            
            const classification = classifications[`${key} class`] || classifications[key] || null;
            
            return (
              <div className="summary-item" key={key}>
                <span className="summary-label">{label}</span>
                <span className="summary-value">
                  {formatMetricValue(key, value)}
                </span>
                {classification && (
                  <span style={{
                    fontSize: '0.75rem',
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: getScoreColor(classificationScore(classification)) + '20',
                    color: getScoreColor(classificationScore(classification)),
                    fontWeight: 600,
                    marginTop: 'var(--spacing-xs)',
                    display: 'inline-block',
                    textTransform: 'capitalize'
                  }}>
                    {classification.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  const radarDataSingle = scoresData.map(s => ({
    category: s.name,
    score: s.value,
    fullMark: 100
  }));

  const sortedCategories = [...scoresData].sort((a, b) => b.value - a.value);
  const strengths = sortedCategories.filter(c => c.value >= 60);
  const weaknesses = sortedCategories.filter(c => c.value < 40);
  const neutral = sortedCategories.filter(c => c.value >= 40 && c.value < 60);

  const profile = getInvestmentProfile(scores, totalScore);

  const getCompanyInsight = () => {
    const parts = [];
    const warnings = [];
    let calloutType = '';

    if (totalScore >= 75) {
      calloutType = 'callout-success';
      parts.push(`${ticker} scores ${totalScore.toFixed(1)}/100 — an overall "${overall}" rating indicating strong fundamentals across multiple dimensions.`);
    } else if (totalScore >= 55) {
      parts.push(`${ticker} scores ${totalScore.toFixed(1)}/100 — a "${overall}" rating suggesting moderate quality with room for improvement.`);
    } else {
      calloutType = 'callout-warning';
      parts.push(`${ticker} scores ${totalScore.toFixed(1)}/100 — a "${overall}" rating highlighting significant weaknesses that require attention.`);
    }

    if (strengths.length > 0) {
      parts.push(`Key strengths: ${strengths.map(s => `${s.name} (${s.value.toFixed(0)})`).join(', ')}.`);
    }
    if (weaknesses.length > 0) {
      warnings.push(`Areas of concern: ${weaknesses.map(w => `${w.name} (${w.value.toFixed(0)})`).join(', ')}.`);
    }

    const prof = scores.profitability || 0;
    const health = scores.financial_health || 0;
    const growthScore = scores.growth || 0;
    const val = scores.valuation || 0;

    if (prof >= 70 && val >= 60) {
      parts.push('The combination of strong profitability and reasonable valuation is particularly attractive — a hallmark of quality-at-a-fair-price investing.');
    } else if (prof >= 70 && val < 40) {
      warnings.push('Despite strong profitability, the stock appears overvalued. Consider waiting for a better entry point or validating growth assumptions.');
    }

    if (health < 40 && growthScore >= 60) {
      warnings.push('High growth combined with weak financial health is a classic risk pattern — the company may be growing unsustainably through excessive leverage.');
    }

    if (prof < 40 && val >= 70) {
      warnings.push('Low profitability with cheap valuation can be a value trap. Verify the company has a credible path to margin improvement before investing.');
    }

    return { parts, warnings, calloutType };
  };
  const insight = getCompanyInsight();

  return (
    <div className="results-container">
      {/* Analysis Header */}
      <div className="notebook-header">
        <h2>VALUATION ANALYSIS</h2>
      </div>

      {/* Main Summary */}
      <Card className="result-summary-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-lg)' }}>
          <div>
            <h3 className="result-section-title" style={{ marginBottom: 'var(--spacing-sm)' }}>
              Valuation Analysis — {ticker}
              {data.company_name && data.company_name !== ticker && (
                <span style={{ fontWeight: 400, fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                  ({data.company_name})
                </span>
              )}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              {data.sector && data.sector !== 'N/A' ? `${data.sector}` : 'Comprehensive evaluation of fundamentals and valuation'}
              {data.industry && data.industry !== 'N/A' ? ` · ${data.industry}` : ''}
              {data.country && data.country !== 'N/A' ? ` · ${data.country}` : ''}
            </p>
          </div>
          <div style={{
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderRadius: 'var(--border-radius-lg)',
            backgroundColor: getConclusionColor(overall) + '20',
            border: `2px solid ${getConclusionColor(overall)}`,
            textAlign: 'center',
            minWidth: '150px'
          }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
              Conclusion
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getConclusionColor(overall), marginBottom: 'var(--spacing-xs)' }}>
              {overall}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: getScoreColor(totalScore) }}>
              {totalScore.toFixed(1)} / 100
            </div>
          </div>
        </div>

        {/* Score Bar Chart + Radar Side by Side */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-xl)' }}>
          {/* Bar Chart */}
          <div style={{ flex: '1 1 400px', minWidth: '320px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }}>
            Scores by Category
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoresData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip 
                formatter={(value) => `${value.toFixed(1)} / 100`}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)' }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {scoresData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getScoreColor(entry.value)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </div>

          {/* Radar Chart */}
          <div style={{ flex: '1 1 350px', minWidth: '300px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }}>
              Strength Profile
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarDataSingle} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Radar name={ticker} dataKey="score" stroke={getConclusionColor(overall)} fill={getConclusionColor(overall)} fillOpacity={0.15} strokeWidth={2} dot={{ r: 4, fill: getConclusionColor(overall) }} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Reference */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--border-color)' }}>
          {[
            { label: 'Excellent', min: '≥80', color: '#10b981' },
            { label: 'Good', min: '≥65', color: '#3b82f6' },
            { label: 'Fair', min: '≥50', color: '#f59e0b' },
            { label: 'Weak', min: '≥35', color: '#f97316' },
            { label: 'Critical', min: '<35', color: '#ef4444' },
          ].map(ref => (
            <span key={ref.label} style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '0.72rem', color: '#64748b', padding: '2px 8px',
              borderRadius: '10px', backgroundColor: ref.color + '15'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: ref.color, display: 'inline-block' }} />
              {ref.label} ({ref.min})
            </span>
          ))}
        </div>
      </Card>

      {/* Dynamic Insight */}
      <Card className="result-summary-card notebook-style">
        <h3 className="notebook-section-title">ANALYSIS INSIGHT</h3>
        <div className={`insight-callout ${insight.calloutType}`}>
          {insight.parts.map((p, i) => <span key={i}>{p}{i < insight.parts.length - 1 ? ' ' : ''}</span>)}
        </div>
        {insight.warnings.length > 0 && (
          <div className="insight-callout callout-warning" style={{ marginTop: 'var(--spacing-sm)' }}>
            {insight.warnings.map((w, i) => <span key={i}>{w}{i < insight.warnings.length - 1 ? ' ' : ''}</span>)}
          </div>
        )}
      </Card>

      {/* Investment Profile + Strengths/Weaknesses */}
      <Card className="result-summary-card" style={{ border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xl)' }}>
          {/* Investment Profile */}
          <div style={{ flex: '1 1 280px', minWidth: '250px' }}>
            <h3 className="notebook-section-title">INVESTMENT PROFILE</h3>
            <div style={{
              padding: 'var(--spacing-lg)', borderRadius: '12px',
              border: `2px solid ${profile.color}`, backgroundColor: profile.color + '08',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '4px' }}>{profile.icon}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: profile.color, marginBottom: 'var(--spacing-sm)' }}>
                {profile.label}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {profile.desc}
              </p>
            </div>
            {/* Category Weight Breakdown */}
            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 'var(--spacing-sm)' }}>
                Scoring Weights
              </h4>
              {[
                { name: 'Profitability', w: 25 },
                { name: 'Financial Health', w: 25 },
                { name: 'Growth', w: 20 },
                { name: 'Efficiency', w: 15 },
                { name: 'Valuation', w: 15 },
              ].map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '100px', fontSize: '0.75rem', color: '#64748b' }}>{item.name}</div>
                  <div style={{ flex: 1, height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${item.w}%`, height: '100%', backgroundColor: '#94a3b8', borderRadius: '3px', maxWidth: '100%' }} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', width: '30px', textAlign: 'right' }}>{item.w}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div style={{ flex: '1 1 350px', minWidth: '300px' }}>
            <h3 className="notebook-section-title">STRENGTHS & WEAKNESSES</h3>
            {/* Strengths */}
            {strengths.length > 0 && (
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981', marginBottom: 'var(--spacing-sm)' }}>
                  ✅ Strengths
                </h4>
                {strengths.map(s => (
                  <div key={s.name} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 500 }}>{s.name}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#059669' }}>{s.value.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Neutral */}
            {neutral.length > 0 && (
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f59e0b', marginBottom: 'var(--spacing-sm)' }}>
                  ➖ Neutral
                </h4>
                {neutral.map(n => (
                  <div key={n.name} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    backgroundColor: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: 500 }}>{n.name}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#d97706' }}>{n.value.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Weaknesses */}
            {weaknesses.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ef4444', marginBottom: 'var(--spacing-sm)' }}>
                  ⚠️ Weaknesses
                </h4>
                {weaknesses.map(w => (
                  <div key={w.name} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    backgroundColor: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 500 }}>{w.name}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#dc2626' }}>{w.value.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
            {strengths.length === 0 && weaknesses.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
                All categories score in the neutral range — no standout strengths or critical weaknesses.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Detailed metrics by category */}
      {data.profitability && renderCategoryMetrics('Profitability', data.profitability)}
      {data.financial_health && renderCategoryMetrics('Financial Health', data.financial_health)}
      {data.growth && renderCategoryMetrics('Growth', data.growth)}
      {data.efficiency && renderCategoryMetrics('Efficiency', data.efficiency)}
      {data.valuation && renderCategoryMetrics('Valuation', data.valuation)}

      {/* Additional information if available */}
      {data.recommendation && (
        <Card className="result-summary-card">
          <h3 className="result-section-title">Recommendation</h3>
          <div style={{
            padding: 'var(--spacing-lg)',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--border-radius)',
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'var(--text-primary)'
          }}>
            {data.recommendation}
          </div>
        </Card>
      )}
    </div>
  );
};

const ComparisonView = ({ data }) => {
  let companies = [];

  if (data.individual_results && typeof data.individual_results === 'object') {
    companies = Object.entries(data.individual_results)
      .map(([key, value]) => {
        const companyData = value || {};
        return {
          ticker: companyData.ticker || key,
          company_name: companyData.company_name || companyData.name || companyData.ticker || key,
          success: companyData.success !== false,
          error: companyData.error || null,
          scores: companyData.scores || {},
          conclusion: companyData.conclusion || {},
          profitability: companyData.profitability || {},
          financial_health: companyData.financial_health || {},
          growth: companyData.growth || {},
          efficiency: companyData.efficiency || {},
          valuation: companyData.valuation || {},
        };
      });
  } else if (Array.isArray(data)) {
    companies = data.map((item, idx) => ({
      ticker: item.ticker || `Company ${idx + 1}`,
      company_name: item.company_name || item.name || item.ticker || `Company ${idx + 1}`,
      scores: item.scores || {},
      conclusion: item.conclusion || {},
      profitability: item.profitability || {},
      financial_health: item.financial_health || {},
      growth: item.growth || {},
      efficiency: item.efficiency || {},
      valuation: item.valuation || {},
    }));
  } else {

    const excludeKeys = ['success', 'valid_count', 'ranking', 'category_leaders', 'group_stats', 'summary_df', 'error', 'individual_results'];
    companies = Object.entries(data)
      .filter(([key]) => !excludeKeys.includes(key))
      .map(([key, value]) => {
        const companyData = value || {};
        return {
          ticker: companyData.ticker || key,
          company_name: companyData.company_name || companyData.name || companyData.ticker || key,
          scores: companyData.scores || {},
          conclusion: companyData.conclusion || {},
          profitability: companyData.profitability || {},
          financial_health: companyData.financial_health || {},
          growth: companyData.growth || {},
          efficiency: companyData.efficiency || {},
          valuation: companyData.valuation || {},
        };
      });
  }


  const comparisonScoresData = companies.map(company => ({
    name: company.ticker,
    fullName: company.company_name !== company.ticker ? company.company_name : null,
    profitability: company.scores.profitability || 0,
    financial_health: company.scores.financial_health || 0,
    growth: company.scores.growth || 0,
    efficiency: company.scores.efficiency || 0,
    valuation: company.scores.valuation || 0,
    total: company.scores.total || 0,
  }));

  const rankedData = [...comparisonScoresData].sort((a, b) => (b.total || 0) - (a.total || 0));

  const maxPerCat = {};
  CATEGORY_KEYS.forEach(cat => {
    maxPerCat[cat] = Math.max(...comparisonScoresData.map(d => d[cat] || 0));
  });
  maxPerCat.total = Math.max(...comparisonScoresData.map(d => d.total || 0));

  const top5 = rankedData.slice(0, Math.min(5, rankedData.length));
  const radarData = CATEGORY_KEYS.map(key => {
    const point = { category: CATEGORY_LABELS[key] };
    top5.forEach(c => { point[c.name] = c[key] || 0; });
    return point;
  });

  const getComparisonInsight = () => {
    const parts = [];
    const warnings = [];
    let calloutType = '';
    const validCompanies = companies.filter(c => c.success !== false);

    if (validCompanies.length === 0) return { parts: ['No valid companies to compare.'], warnings: [], calloutType: 'callout-warning' };

    const best = rankedData[0];
    const worst = rankedData[rankedData.length - 1];
    const spread = (best?.total || 0) - (worst?.total || 0);

    const avgTotal = validCompanies.reduce((s, c) => s + (c.scores.total || 0), 0) / validCompanies.length;

    if (validCompanies.length === 1) {
      parts.push(`Analyzing ${best.name} with a total score of ${(best.total || 0).toFixed(0)}/100.`);
    } else if (spread > 30) {
      parts.push(`Wide quality dispersion (${spread.toFixed(0)} pts) between the best (${best.name}: ${(best.total || 0).toFixed(0)}) and worst (${worst.name}: ${(worst.total || 0).toFixed(0)}) company — there's a clear hierarchy in fundamentals.`);
    } else if (spread < 10) {
      parts.push(`Very tight scoring (${spread.toFixed(0)} pts spread) — these companies have similar fundamental quality, making differentiation difficult.`);
    } else {
      parts.push(`Comparing ${validCompanies.length} companies with a moderate quality spread of ${spread.toFixed(0)} pts (best: ${best.name} at ${(best.total || 0).toFixed(0)}, weakest: ${worst.name} at ${(worst.total || 0).toFixed(0)}). Group average: ${avgTotal.toFixed(0)}/100.`);
    }

    const excellentCount = validCompanies.filter(c => (c.scores.total || 0) >= 75).length;
    const goodCount = validCompanies.filter(c => (c.scores.total || 0) >= 55 && (c.scores.total || 0) < 75).length;
    const weakCount = validCompanies.filter(c => (c.scores.total || 0) < 40).length;

    if (excellentCount > 0) {
      calloutType = 'callout-success';
      parts.push(`${excellentCount} of ${validCompanies.length} companies score above 75 — strong investment candidates.`);
    } else if (goodCount > 0 && weakCount === 0) {
      parts.push(`No standout performers, but ${goodCount} companies show solid fundamentals (score ≥55).`);
    }

    if (weakCount > 0) {
      warnings.push(`${weakCount} of ${validCompanies.length} companies score below 40 — significant fundamental risks.`);
    }

    const catLeaders = {};
    CATEGORY_KEYS.forEach(cat => {
      const leader = rankedData.reduce((b, c) => (c[cat] || 0) > (b[cat] || 0) ? c : b);
      catLeaders[cat] = leader;
    });
    const sameLeader = Object.values(catLeaders).every(l => l.name === catLeaders.profitability.name);
    if (sameLeader && validCompanies.length > 1) {
      parts.push(`${catLeaders.profitability.name} leads across all five categories — a dominant position in this comparison group.`);
    } else if (validCompanies.length > 1) {
      const uniqueLeaders = [...new Set(Object.values(catLeaders).map(l => l.name))];
      if (uniqueLeaders.length >= 3) {
        parts.push(`Leadership is fragmented across ${uniqueLeaders.length} different companies — no single stock dominates all dimensions.`);
      }
    }

    return { parts, warnings, calloutType };
  };
  const compInsight = getComparisonInsight();

  return (
    <div className="results-container">
      {/* Analysis Header */}
      <div className="notebook-header">
        <h2>COMPANY COMPARISON</h2>
      </div>

      {/* Comparison Dynamic Insight */}
      <Card className="result-summary-card notebook-style">
        <h3 className="notebook-section-title">COMPARISON INSIGHT</h3>
        <div className={`insight-callout ${compInsight.calloutType}`}>
          {compInsight.parts.map((p, i) => <span key={i}>{p}{i < compInsight.parts.length - 1 ? ' ' : ''}</span>)}
        </div>
        {compInsight.warnings.length > 0 && (
          <div className="insight-callout callout-warning" style={{ marginTop: 'var(--spacing-sm)' }}>
            {compInsight.warnings.map((w, i) => <span key={i}>{w}{i < compInsight.warnings.length - 1 ? ' ' : ''}</span>)}
          </div>
        )}
      </Card>

      {/* Comparative Summary */}
      <Card className="result-summary-card">
        <h3 className="result-section-title">Summary Overview</h3>
        <p className="notebook-description" style={{ marginBottom: 'var(--spacing-md)' }}>
          Head-to-head comparison of all companies ranked by their total fundamental score.
          Each category is weighted equally (20%) to produce the total score out of 100.
          Scores above 60 generally indicate solid fundamentals, while scores below 40 suggest caution.
        </p>
        
        {/* Total Scores Table */}
        <div className="table-container" style={{ marginTop: 'var(--spacing-lg)' }}>
          <table className="results-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Total Score</th>
                <th>Profitability</th>
                <th>Financial Health</th>
                <th>Growth</th>
                <th>Efficiency</th>
                <th>Valuation</th>
                <th>Conclusion</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company, idx) => {

                if (!company.success) {
                  return (
                    <tr key={idx} style={{ backgroundColor: '#fee2e2' }}>
                      <td className="factor-name" style={{ fontWeight: 700, fontSize: '1.1rem', color: '#dc2626' }}>
                        <div>{company.ticker}</div>
                        {company.company_name && company.company_name !== company.ticker && (
                          <div style={{ fontSize: '0.75rem', fontWeight: 400, color: '#ef4444', marginTop: '2px' }}>
                            {company.company_name}
                          </div>
                        )}
                      </td>
                      <td colSpan="7" style={{ 
                        color: '#dc2626',
                        padding: 'var(--spacing-md)',
                        fontStyle: 'italic'
                      }}>
                        ⚠️ Error: {company.error || 'Could not analyze this company'}
                      </td>
                    </tr>
                  );
                }
                
                const totalScore = company.scores.total ?? 0;
                const overall = company.conclusion.overall || 'N/A';
                const renderScore = (val) => {
                  if (val == null) return <span style={{ color: '#94a3b8' }}>N/A</span>;
                  return val.toFixed(1);
                };
                const scoreStyle = (val) => ({ color: val != null ? getScoreColor(val) : '#94a3b8' });
                return (
                  <tr key={idx}>
                    <td className="factor-name" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                      <div>{company.ticker}</div>
                      {company.company_name && company.company_name !== company.ticker && (
                        <div style={{ fontSize: '0.72rem', fontWeight: 400, color: '#64748b', marginTop: '2px', lineHeight: 1.3 }}>
                          {company.company_name}
                        </div>
                      )}
                    </td>
                    <td className="numeric" style={{ 
                      fontWeight: 700,
                      color: getScoreColor(totalScore),
                      fontSize: '1.1rem'
                    }}>
                      {totalScore.toFixed(1)}
                    </td>
                    <td className="numeric" style={scoreStyle(company.scores.profitability)}>
                      {renderScore(company.scores.profitability)}
                    </td>
                    <td className="numeric" style={scoreStyle(company.scores.financial_health)}>
                      {renderScore(company.scores.financial_health)}
                    </td>
                    <td className="numeric" style={scoreStyle(company.scores.growth)}>
                      {renderScore(company.scores.growth)}
                    </td>
                    <td className="numeric" style={scoreStyle(company.scores.efficiency)}>
                      {renderScore(company.scores.efficiency)}
                    </td>
                    <td className="numeric" style={scoreStyle(company.scores.valuation)}>
                      {renderScore(company.scores.valuation)}
                    </td>
                    <td>
                      <span style={{
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        borderRadius: 'var(--border-radius-sm)',
                        backgroundColor: getConclusionColor(overall) + '20',
                        color: getConclusionColor(overall),
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        textTransform: 'uppercase'
                      }}>
                        {overall}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ═══════ Category Leaders ═══════ */}
        {comparisonScoresData.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '1.5rem 0 0' }}>
            {CATEGORY_KEYS.map(cat => {
              const leader = rankedData.reduce((best, curr) =>
                (curr[cat] || 0) > (best[cat] || 0) ? curr : best
              );
              return (
                <div key={cat} style={{
                  padding: '0.4rem 0.85rem', borderRadius: '6px',
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                  fontSize: '0.78rem', color: '#166534', lineHeight: 1.4
                }}>
                  <span style={{ fontWeight: 700 }}>{CATEGORY_LABELS[cat]}:</span>{' '}
                  {leader.name}{' '}
                  <span style={{ fontWeight: 600 }}>({(leader[cat] || 0).toFixed(0)})</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══════ Total Score Ranking ═══════ */}
        {rankedData.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Total Score Ranking
            </h4>
            <ResponsiveContainer width="100%" height={Math.max(220, rankedData.length * 38)}>
              <BarChart data={rankedData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number" domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  dataKey="name" type="category" width={70}
                  tick={{ fontSize: 13, fontWeight: 600, fill: '#334155' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  formatter={(v, _name, props) => {
                    const fullName = props?.payload?.fullName;
                    return [`${Number(v).toFixed(1)} / 100`, fullName || 'Total Score'];
                  }}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={22} name="Total Score">
                  {rankedData.map((entry, i) => (
                    <Cell key={i} fill={getScoreColor(entry.total || 0)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ═══════ Score Heatmap ═══════ */}
        {comparisonScoresData.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Score Comparison by Category
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '4px', fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center', padding: '0.6rem 0.5rem', color: '#64748b', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', width: '2rem' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem', color: '#64748b', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Company</th>
                    {CATEGORY_KEYS.map(key => (
                      <th key={key} style={{ textAlign: 'center', padding: '0.6rem 0.5rem', color: '#64748b', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {CATEGORY_LABELS[key]}
                      </th>
                    ))}
                    <th style={{ textAlign: 'center', padding: '0.6rem 0.5rem', color: '#475569', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderLeft: '3px solid #e2e8f0' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedData.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{
                        padding: '0.5rem 0.5rem', textAlign: 'center',
                        fontWeight: 700, fontSize: '0.8rem',
                        color: idx === 0 ? '#b45309' : idx === 1 ? '#475569' : idx === 2 ? '#92400e' : '#94a3b8'
                      }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </td>
                      <td style={{ padding: '0.5rem 0.8rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{row.name}</div>
                        {row.fullName && (
                          <div style={{ fontSize: '0.68rem', fontWeight: 400, color: '#94a3b8', marginTop: '1px', lineHeight: 1.2, maxWidth: '160px', whiteSpace: 'normal' }}>
                            {row.fullName}
                          </div>
                        )}
                      </td>
                      {CATEGORY_KEYS.map(key => {
                        const score = row[key] || 0;
                        const colors = getHeatmapColor(score);
                        const isMax = score > 0 && score === maxPerCat[key];
                        return (
                          <td key={key} style={{
                            textAlign: 'center', padding: '0.45rem 0.4rem', borderRadius: '6px',
                            backgroundColor: colors.bg, color: colors.text,
                            fontWeight: 600, fontSize: '0.85rem', minWidth: '56px',
                            boxShadow: isMax ? '0 0 0 2.5px #fbbf24, 0 0 8px rgba(251,191,36,0.3)' : 'none',
                            position: 'relative'
                          }}>
                            {score.toFixed(0)}{isMax ? ' ★' : ''}
                          </td>
                        );
                      })}
                      <td style={{
                        textAlign: 'center', padding: '0.45rem 0.4rem', borderRadius: '6px',
                        backgroundColor: getHeatmapColor(row.total || 0).bg,
                        color: getHeatmapColor(row.total || 0).text,
                        fontWeight: 800, fontSize: '0.95rem', minWidth: '56px',
                        borderLeft: '3px solid #e2e8f0',
                        boxShadow: (row.total || 0) > 0 && (row.total || 0) === maxPerCat.total
                          ? '0 0 0 2.5px #fbbf24, 0 0 8px rgba(251,191,36,0.3)' : 'none',
                      }}>
                        {(row.total || 0).toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.72rem', color: '#94a3b8', flexWrap: 'wrap' }}>
              <span>★ = Category leader</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: '#059669' }} /> ≥80
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }} /> ≥65
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: '#84cc16' }} /> ≥50
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: '#eab308' }} /> ≥40
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: '#f97316' }} /> ≥25
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444' }} /> {'<25'}
              </span>
            </div>
          </div>
        )}

        {/* ═══════ Radar Chart — Top Companies ═══════ */}
        {top5.length > 1 && (
          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Strengths Profile — Top {top5.length}
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1rem' }}>
              Radar overlay of the highest-ranked companies
            </p>
            <ResponsiveContainer width="100%" height={420}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                {top5.map((company, i) => (
                  <Radar
                    key={company.name} name={company.name} dataKey={company.name}
                    stroke={COMPANY_COLORS[i]} fill={COMPANY_COLORS[i]} fillOpacity={0.08}
                    strokeWidth={2} dot={{ r: 3, fill: COMPANY_COLORS[i] }}
                  />
                ))}
                <Legend wrapperStyle={{ fontSize: '0.8rem', fontWeight: 600 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* ═══════ Investment Profile Classification ═══════ */}
      {companies.filter(c => c.success !== false).length > 0 && (
        <Card className="result-summary-card" style={{ border: '1px solid #e2e8f0' }}>
          <h3 className="result-section-title" style={{ marginBottom: 'var(--spacing-lg)' }}>Investment Profile Classification</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)', lineHeight: 1.6 }}>
            Each company is classified into an investment archetype based on its fundamental scores.
            This helps identify which investment style each stock suits best.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-md)' }}>
            {companies.filter(c => c.success !== false).map((company, idx) => {
              const s = company.scores;
              const total = s.total || 0;
              const profile = getProfileShort(s);

              const catEntries = [
                { name: 'Profit.', score: s.profitability || 0 },
                { name: 'Health', score: s.financial_health || 0 },
                { name: 'Growth', score: s.growth || 0 },
                { name: 'Effic.', score: s.efficiency || 0 },
                { name: 'Valuat.', score: s.valuation || 0 },
              ].sort((a, b) => b.score - a.score);

              return (
                <div key={idx} style={{
                  padding: 'var(--spacing-md)', borderRadius: '10px',
                  border: `2px solid ${profile.color}20`, backgroundColor: profile.color + '05',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.3rem', marginBottom: '2px' }}>{profile.icon}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{company.ticker}</div>
                  {company.company_name && company.company_name !== company.ticker && (
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '1px', lineHeight: 1.2 }}>{company.company_name}</div>
                  )}
                  <div style={{
                    margin: 'var(--spacing-sm) auto', padding: '3px 12px', borderRadius: '12px',
                    backgroundColor: profile.color + '15', color: profile.color,
                    fontSize: '0.78rem', fontWeight: 700, display: 'inline-block'
                  }}>
                    {profile.label}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: getScoreColor(total), marginBottom: '4px' }}>
                    {total.toFixed(0)}/100
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '0.7rem', marginTop: '4px' }}>
                    <span style={{ color: '#10b981' }}>⬆ {catEntries[0].name} ({catEntries[0].score.toFixed(0)})</span>
                    <span style={{ color: '#ef4444' }}>⬇ {catEntries[catEntries.length - 1].name} ({catEntries[catEntries.length - 1].score.toFixed(0)})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ═══════ Category-by-Category Grouped Bar Chart ═══════ */}
      {comparisonScoresData.length > 1 && (
        <Card className="result-chart-card" style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid #e2e8f0' }}>
            <h3 className="result-section-title">Score Comparison by Category</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 'var(--spacing-xs) 0 0' }}>
              Side-by-side comparison of each company across all five fundamental dimensions.
            </p>
          </div>
          <div style={{ padding: 'var(--spacing-md)' }}>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart
                data={CATEGORY_KEYS.map(key => {
                  const point = { category: CATEGORY_LABELS[key] };
                  comparisonScoresData.forEach(c => { point[c.name] = c[key] || 0; });
                  return point;
                })}
                margin={{ top: 20, right: 30, bottom: 10, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v) => `${Number(v).toFixed(1)}/100`}
                />
                <Legend wrapperStyle={{ fontSize: '0.8rem', fontWeight: 600 }} />
                <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Fair (50)', position: 'right', fill: '#f59e0b', fontSize: 10 }} />
                {comparisonScoresData.map((company, i) => (
                  <Bar key={company.name} dataKey={company.name} fill={COMPANY_COLORS[i % COMPANY_COLORS.length]} radius={[4, 4, 0, 0]} barSize={Math.max(12, Math.min(28, 120 / comparisonScoresData.length))} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* ═══════ Best Pick Summary ═══════ */}
      {rankedData.length > 1 && (
        <Card className="result-summary-card notebook-style" style={{ border: '1px solid #e2e8f0' }}>
          <h3 className="notebook-section-title">BEST PICK BY INVESTMENT STYLE</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)', lineHeight: 1.6 }}>
            Depending on your investment approach, different companies may be the optimal choice.
            Below are the best candidates per style based on the fundamental analysis.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-md)' }}>
            {(() => {
              const validCompanies = companies.filter(c => c.success !== false);
              if (validCompanies.length === 0) return null;

              const picks = [
                {
                  style: 'Overall Best',
                  icon: '🏆',
                  color: '#f59e0b',
                  pick: validCompanies.reduce((best, c) => (c.scores.total || 0) > (best.scores.total || 0) ? c : best),
                  metric: 'total',
                  reason: 'Highest total fundamental score across all dimensions.'
                },
                {
                  style: 'Best Profitability',
                  icon: '💰',
                  color: '#10b981',
                  pick: validCompanies.reduce((best, c) => (c.scores.profitability || 0) > (best.scores.profitability || 0) ? c : best),
                  metric: 'profitability',
                  reason: 'Strongest margins, ROE, and cash flow generation.'
                },
                {
                  style: 'Best Growth',
                  icon: '📈',
                  color: '#8b5cf6',
                  pick: validCompanies.reduce((best, c) => (c.scores.growth || 0) > (best.scores.growth || 0) ? c : best),
                  metric: 'growth',
                  reason: 'Highest revenue and earnings growth momentum.'
                },
                {
                  style: 'Best Value',
                  icon: '🏷️',
                  color: '#3b82f6',
                  pick: validCompanies.reduce((best, c) => (c.scores.valuation || 0) > (best.scores.valuation || 0) ? c : best),
                  metric: 'valuation',
                  reason: 'Most attractive valuation multiples relative to fundamentals.'
                },
                {
                  style: 'Safest Pick',
                  icon: '🛡️',
                  color: '#06b6d4',
                  pick: validCompanies.reduce((best, c) => (c.scores.financial_health || 0) > (best.scores.financial_health || 0) ? c : best),
                  metric: 'financial_health',
                  reason: 'Strongest balance sheet, lowest leverage, best liquidity.'
                },
                {
                  style: 'Most Efficient',
                  icon: '⚡',
                  color: '#f97316',
                  pick: validCompanies.reduce((best, c) => (c.scores.efficiency || 0) > (best.scores.efficiency || 0) ? c : best),
                  metric: 'efficiency',
                  reason: 'Best asset utilization, capital efficiency, and operational excellence.'
                },
              ];

              return picks.map((p, idx) => (
                <div key={idx} style={{
                  padding: 'var(--spacing-md)', borderRadius: '10px',
                  border: `1px solid ${p.color}30`, backgroundColor: p.color + '05'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-sm)' }}>
                    <span style={{ fontSize: '1.2rem' }}>{p.icon}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: p.color }}>{p.style}</span>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                    {p.pick.ticker}
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: getScoreColor(p.pick.scores[p.metric] || 0), marginLeft: '8px' }}>
                      {(p.pick.scores[p.metric] || 0).toFixed(0)}/100
                    </span>
                  </div>
                  {p.pick.company_name && p.pick.company_name !== p.pick.ticker && (
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{p.pick.company_name}</div>
                  )}
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 'var(--spacing-xs) 0 0', lineHeight: 1.5 }}>{p.reason}</p>
                </div>
              ));
            })()}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginTop: 'var(--spacing-md)', textAlign: 'center' }}>
            ⚠ Best picks are based on quantitative fundamental scoring only. Always validate with qualitative research and your own investment thesis.
          </p>
        </Card>
      )}

      {/* Detailed metrics by category - Comparison table */}
      {['profitability', 'financial_health', 'growth', 'efficiency', 'valuation'].map(categoryKey => {
        const allMetrics = new Set();
        companies.forEach(company => {
          const categoryData = company[categoryKey];
          if (categoryData && categoryData.metrics) {
            Object.keys(categoryData.metrics).forEach(key => allMetrics.add(key));
          }
        });

        if (allMetrics.size === 0) return null;

        return (
          <Card className="result-table-card" key={categoryKey}>
            <h3 className="result-section-title">{CATEGORY_NAMES[categoryKey]}</h3>
            {CATEGORY_DESCRIPTIONS[CATEGORY_NAMES[categoryKey]] && (
              <p className="notebook-description" style={{ marginBottom: 'var(--spacing-md)' }}>
                {CATEGORY_DESCRIPTIONS[CATEGORY_NAMES[categoryKey]]}
              </p>
            )}
            <div className="table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    {companies.map((company, idx) => (
                      <th key={idx} style={{ textAlign: 'center' }}>
                        <div>{company.ticker}</div>
                        {company.company_name && company.company_name !== company.ticker && (
                          <div style={{ fontSize: '0.65rem', fontWeight: 400, color: '#94a3b8', marginTop: '2px', lineHeight: 1.2 }}>
                            {company.company_name}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(allMetrics).map(metricKey => {
                    const label = metricKey
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase());

                    const allValues = companies.map(company => {
                      const categoryData = company[categoryKey];
                      return categoryData?.metrics?.[metricKey];
                    });
                    
                    const allNA = allValues.every(val => 
                      val === null || val === undefined || 
                      (typeof val === 'number' && (isNaN(val) || !isFinite(val)))
                    );

                    if (allNA) return null;
                    
                    return (
                      <tr key={metricKey}>
                        <td className="factor-name">{label}</td>
                        {companies.map((company, idx) => {
                          const categoryData = company[categoryKey];
                          const value = categoryData?.metrics?.[metricKey];
                          return (
                            <td key={idx} className="numeric">
                              {formatMetricValue(metricKey, value)}
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
        );
      })}
    </div>
  );
};

const SignalsView = ({ data }) => {
  const signals = Object.entries(data)
    .filter(([key, value]) => value && typeof value === 'object' && !value.error)
    .map(([key, value]) => ({
      ticker: value.ticker || key,
      signal: value.signal || 'N/A',
      confidence: value.confidence || 0,
      valuation_score: value.valuation_score || 0,
      fundamental_score: value.fundamental_score || 0,
      current_price: value.current_price || 0,
      price_target: value.price_target || 0,
      upside_potential: value.upside_potential || 0,
      reasons: value.reasons || [],
      technical_score: value.technical_score,
    }));

  const formatConfidence = (c) => c == null ? 'N/A' : `${normConf(c).toFixed(1)}%`;

  const formatPrice = (price) => {
    if (!price || price === 0) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  const formatPercentage = (v) => {
    if (v == null) return 'N/A';
    const p = normUpside(v);
    return `${p >= 0 ? '+' : ''}${p.toFixed(2)}%`;
  };

  const isBuy  = (s) => { const u = (s.signal || '').toUpperCase(); return u === 'BUY' || u === 'COMPRA'; };
  const isSell = (s) => { const u = (s.signal || '').toUpperCase(); return u === 'SELL' || u === 'VENTA'; };
  const isHold = (s) => { const u = (s.signal || '').toUpperCase(); return u === 'HOLD' || u === 'MANTENER'; };

  const buySignals  = signals.filter(isBuy);
  const sellSignals = signals.filter(isSell);
  const holdSignals = signals.filter(isHold);
  const avgConfidence = signals.length > 0 ? signals.reduce((s, sig) => s + normConf(sig.confidence), 0) / signals.length : 0;
  const avgUpside = signals.length > 0 ? signals.reduce((s, sig) => s + normUpside(sig.upside_potential), 0) / signals.length : 0;

  const sortedSignals = [...signals].sort((a, b) => normUpside(b.upside_potential) - normUpside(a.upside_potential));

  return (
    <div className="results-container">
      {/* Signal Summary */}
      <Card className="result-summary-card notebook-style">
        <h3 className="notebook-section-title">SIGNAL SUMMARY</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
          {[
            { label: 'Total Analyzed', value: signals.length, color: '#1e293b', icon: '📊' },
            { label: 'Buy Signals', value: buySignals.length, color: '#10b981', icon: '🟢' },
            { label: 'Hold Signals', value: holdSignals.length, color: '#f59e0b', icon: '🟡' },
            { label: 'Sell Signals', value: sellSignals.length, color: '#ef4444', icon: '🔴' },
            { label: 'Avg. Confidence', value: `${avgConfidence.toFixed(0)}%`, color: avgConfidence >= 60 ? '#10b981' : '#f59e0b', icon: '🎯' },
            { label: 'Avg. Upside', value: `${avgUpside >= 0 ? '+' : ''}${avgUpside.toFixed(1)}%`, color: avgUpside >= 0 ? '#10b981' : '#ef4444', icon: '📈' },
          ].map((item, idx) => (
            <div key={idx} style={{
              padding: 'var(--spacing-md)', borderRadius: '8px', textAlign: 'center',
              backgroundColor: '#f8fafc', border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '1.1rem', marginBottom: '2px' }}>{item.icon}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Dynamic insight */}
        {(() => {
          const parts = [];
          let calloutType = '';
          if (buySignals.length > sellSignals.length) {
            calloutType = 'callout-success';
            parts.push(`${buySignals.length} of ${signals.length} stocks generate BUY signals — the fundamental/valuation analysis favors an overall bullish stance.`);
          } else if (sellSignals.length > buySignals.length) {
            calloutType = 'callout-warning';
            parts.push(`${sellSignals.length} of ${signals.length} stocks generate SELL signals — the analysis suggests caution and potential overvaluation in this group.`);
          } else {
            parts.push(`The signal distribution is mixed (${buySignals.length} BUY, ${holdSignals.length} HOLD, ${sellSignals.length} SELL) — selective stock picking is key.`);
          }

          if (avgConfidence >= 70) {
            parts.push(`Average confidence of ${avgConfidence.toFixed(0)}% indicates strong conviction across the analyzed universe.`);
          } else if (avgConfidence < 50) {
            parts.push(`Average confidence of ${avgConfidence.toFixed(0)}% suggests mixed fundamentals — signals should be taken with caution.`);
          }

          const highConvictionBuys = buySignals.filter(s => normConf(s.confidence) >= 70);
          if (highConvictionBuys.length > 0) {
            parts.push(`High-conviction BUY: ${highConvictionBuys.map(s => s.ticker).join(', ')}.`);
          }

          return (
            <div className={`insight-callout ${calloutType}`}>
              {parts.map((p, i) => <span key={i}>{p}{i < parts.length - 1 ? ' ' : ''}</span>)}
            </div>
          );
        })()}
      </Card>

      {/* Main Recommendations Table */}
      <Card className="result-summary-card">
        <h3 className="result-section-title">DETAILED RECOMMENDATIONS</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 'var(--spacing-lg)' }}>
          Buy/sell recommendations based on fundamental and valuation analysis. Confidence reflects the
          combined strength of valuation discount/premium and fundamental quality.
        </p>

        <div className="table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Recommendation</th>
                <th>Confidence</th>
                <th>Current Price</th>
                <th>Target Price</th>
                <th>Upside Potential</th>
                <th>Valuation Score</th>
                <th>Fundamental Score</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((signal, idx) => (
                <tr key={idx}>
                  <td className="factor-name" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    {signal.ticker}
                  </td>
                  <td>
                    <span style={{
                      padding: 'var(--spacing-xs) var(--spacing-md)',
                      borderRadius: 'var(--border-radius)',
                      backgroundColor: getSignalColor(signal.signal) + '20',
                      color: getSignalColor(signal.signal),
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      display: 'inline-block'
                    }}>
                      {signal.signal}
                    </span>
                  </td>
                  <td className="numeric" style={{ 
                    color: getConfidenceColor(signal.confidence),
                    fontWeight: 600
                  }}>
                    {formatConfidence(signal.confidence)}
                  </td>
                  <td className="numeric">
                    {formatPrice(signal.current_price)}
                  </td>
                  <td className="numeric" style={{ fontWeight: 600 }}>
                    {formatPrice(signal.price_target)}
                  </td>
                  <td className={`numeric ${signal.upside_potential >= 0 ? 'positive' : 'negative'}`} style={{ fontWeight: 700 }}>
                    {formatPercentage(signal.upside_potential)}
                  </td>
                  <td className="numeric" style={{ 
                    color: signal.valuation_score >= 50 ? '#10b981' : '#ef4444',
                    fontWeight: 600
                  }}>
                    {signal.valuation_score.toFixed(1)}
                  </td>
                  <td className="numeric" style={{ 
                    color: signal.fundamental_score >= 50 ? '#10b981' : '#ef4444',
                    fontWeight: 600
                  }}>
                    {signal.fundamental_score.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top Actionable Picks */}
      {signals.length > 1 && (
        <Card className="result-summary-card notebook-style" style={{ border: '1px solid #e2e8f0' }}>
          <h3 className="notebook-section-title">TOP ACTIONABLE PICKS</h3>
          <p className="notebook-description">
            Ranked by combined conviction: signal direction × confidence × upside magnitude. These are the stocks where the model has the strongest opinion.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
            {/* Top BUY picks */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981', marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🟢 Strongest BUY Opportunities
              </h4>
              {(() => {
                const buyRanked = buySignals
                  .map(s => ({
                    ...s,
                    score: normConf(s.confidence) * normUpside(s.upside_potential) / 100,
                    confNorm: normConf(s.confidence),
                    upsideNorm: normUpside(s.upside_potential),
                  }))
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 3);

                if (buyRanked.length === 0) return <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>No BUY signals in this screening.</p>;

                return buyRanked.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    borderRadius: '8px', backgroundColor: '#10b98108',
                    border: '1px solid #10b98120', marginBottom: 'var(--spacing-xs)'
                  }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', width: '28px', textAlign: 'center' }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{s.ticker}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Confidence: {s.confNorm.toFixed(0)}% · Upside: +{s.upsideNorm.toFixed(1)}% · Target: ${(s.price_target || 0).toFixed(2)}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 10px', borderRadius: '6px',
                      backgroundColor: '#10b98120', color: '#10b981',
                      fontWeight: 700, fontSize: '0.85rem'
                    }}>
                      BUY
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Top SELL / Caution picks */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ef4444', marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🔴 Strongest SELL / Caution
              </h4>
              {(() => {
                const sellRanked = sellSignals
                  .map(s => ({
                    ...s,
                    score: normConf(s.confidence) * Math.abs(normUpside(s.upside_potential)) / 100,
                    confNorm: normConf(s.confidence),
                    upsideNorm: normUpside(s.upside_potential),
                  }))
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 3);

                if (sellRanked.length === 0) return <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>No SELL signals in this screening.</p>;

                return sellRanked.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    borderRadius: '8px', backgroundColor: '#ef444408',
                    border: '1px solid #ef444420', marginBottom: 'var(--spacing-xs)'
                  }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ef4444', width: '28px', textAlign: 'center' }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{s.ticker}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Confidence: {s.confNorm.toFixed(0)}% · Downside: {s.upsideNorm.toFixed(1)}% · Target: ${(s.price_target || 0).toFixed(2)}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 10px', borderRadius: '6px',
                      backgroundColor: '#ef444420', color: '#ef4444',
                      fontWeight: 700, fontSize: '0.85rem'
                    }}>
                      SELL
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </Card>
      )}

      {/* Upside Potential Chart */}
      {sortedSignals.length > 0 && (
        <Card className="result-chart-card" style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid #e2e8f0' }}>
            <h3 className="result-section-title">UPSIDE / DOWNSIDE POTENTIAL</h3>
            <p className="notebook-description">
              Estimated price gap between the current market price and the model's target price.
              Positive values indicate undervaluation (potential upside), negative values indicate overvaluation (potential downside).
              Larger bars represent stronger conviction in the price mismatch.
            </p>
          </div>
          <div style={{ padding: 'var(--spacing-md)' }}>
            <ResponsiveContainer width="100%" height={Math.max(250, sortedSignals.length * 45)}>
              <BarChart
                data={sortedSignals.map(s => ({
                  ticker: s.ticker,
                  upside: normUpside(s.upside_potential),
                  signal: s.signal,
                }))}
                layout="vertical"
                margin={{ top: 10, right: 40, bottom: 10, left: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis dataKey="ticker" type="category" width={55} tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }} />
                <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
                <Tooltip
                  formatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`}
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Bar dataKey="upside" name="Upside Potential" radius={[0, 4, 4, 0]} barSize={20}>
                  {sortedSignals.map((s, i) => (
                    <Cell key={i} fill={normUpside(s.upside_potential) >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Signal Distribution Donut */}
      {signals.length > 1 && (
        <Card className="result-chart-card" style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid #e2e8f0' }}>
            <h3 className="result-section-title">SIGNAL DISTRIBUTION</h3>
            <p className="notebook-description">
              Visual breakdown of recommendation types. A healthy diversified screening should show a mix of signals — 
              a heavily skewed distribution may indicate a sector-wide trend or systematic bias.
            </p>
          </div>
          <div style={{ padding: 'var(--spacing-md)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
            <ResponsiveContainer width={260} height={260}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'BUY', value: buySignals.length, fill: '#10b981' },
                    { name: 'HOLD', value: holdSignals.length, fill: '#f59e0b' },
                    { name: 'SELL', value: sellSignals.length, fill: '#ef4444' },
                  ].filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {[
                    { fill: '#10b981' },
                    { fill: '#f59e0b' },
                    { fill: '#ef4444' },
                  ].filter((_, i) => [buySignals.length, holdSignals.length, sellSignals.length][i] > 0)
                    .map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v} stocks`} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {[
                { label: 'BUY', count: buySignals.length, color: '#10b981', desc: 'Undervalued — fundamentals support accumulation' },
                { label: 'HOLD', count: holdSignals.length, color: '#f59e0b', desc: 'Fairly valued — maintain existing positions' },
                { label: 'SELL', count: sellSignals.length, color: '#ef4444', desc: 'Overvalued — consider reducing exposure' },
              ].filter(d => d.count > 0).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: item.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: item.color }}>
                      {item.label} — {item.count} ({((item.count / signals.length) * 100).toFixed(0)}%)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Confidence vs Upside Scatter Plot */}
      {signals.length > 1 && (
        <Card className="result-chart-card" style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid #e2e8f0' }}>
            <h3 className="result-section-title">CONFIDENCE vs UPSIDE — OPPORTUNITY MAP</h3>
            <p className="notebook-description">
              Each stock is plotted by its signal confidence (x-axis) and upside/downside potential (y-axis).
              <strong> Top-right quadrant</strong> contains the best opportunities: high confidence BUY signals with strong upside.
              <strong> Bottom-right quadrant</strong> shows high-conviction SELL signals to avoid.
            </p>
          </div>
          <div style={{ padding: 'var(--spacing-md)' }}>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="confidence"
                  name="Confidence"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  label={{ value: 'Confidence (%)', position: 'bottom', offset: 0, style: { fontSize: 12, fill: '#94a3b8' } }}
                />
                <YAxis
                  type="number"
                  dataKey="upside"
                  name="Upside"
                  tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  label={{ value: 'Upside Potential (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#94a3b8' } }}
                />
                <ZAxis range={[80, 80]} />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                <ReferenceLine x={60} stroke="#94a3b850" strokeDasharray="3 3" />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', fontSize: '0.82rem' }}>
                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>{d.ticker}</div>
                        <div>Signal: <span style={{ color: getSignalColor(d.signal), fontWeight: 600 }}>{d.signal}</span></div>
                        <div>Confidence: {d.confidence.toFixed(1)}%</div>
                        <div>Upside: {d.upside >= 0 ? '+' : ''}{d.upside.toFixed(2)}%</div>
                      </div>
                    );
                  }}
                />
                <Scatter
                  data={signals.map(s => ({
                    ticker: s.ticker,
                    signal: s.signal,
                    confidence: normConf(s.confidence),
                    upside: normUpside(s.upside_potential),
                  }))}
                  shape={(props) => {
                    const { cx, cy, payload } = props;
                    const color = getSignalColor(payload.signal);
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r={8} fill={color} fillOpacity={0.7} stroke={color} strokeWidth={2} />
                        <text x={cx} y={cy - 14} textAnchor="middle" fontSize={10} fontWeight={600} fill="#334155">
                          {payload.ticker}
                        </text>
                      </g>
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Valuation vs Fundamental Score Matrix */}
      {signals.length > 1 && signals.some(s => s.valuation_score > 0 && s.fundamental_score > 0) && (
        <Card className="result-chart-card" style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid #e2e8f0' }}>
            <h3 className="result-section-title">VALUATION vs FUNDAMENTAL QUALITY MATRIX</h3>
            <p className="notebook-description">
              Maps each stock on two key dimensions: valuation attractiveness (x-axis) and fundamental quality (y-axis).
              <strong> Top-right:</strong> Cheap + high quality — ideal candidates.
              <strong> Top-left:</strong> Expensive but strong fundamentals — quality at a premium.
              <strong> Bottom-right:</strong> Cheap but weak fundamentals — potential value traps.
              <strong> Bottom-left:</strong> Expensive + weak fundamentals — avoid.
            </p>
          </div>
          <div style={{ padding: 'var(--spacing-md)' }}>
            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="valuation"
                  name="Valuation Score"
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  label={{ value: 'Valuation Score', position: 'bottom', offset: 0, style: { fontSize: 12, fill: '#94a3b8' } }}
                />
                <YAxis
                  type="number"
                  dataKey="fundamental"
                  name="Fundamental Score"
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  label={{ value: 'Fundamental Score', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#94a3b8' } }}
                />
                <ZAxis range={[80, 80]} />
                <ReferenceLine x={50} stroke="#94a3b850" strokeDasharray="3 3" />
                <ReferenceLine y={50} stroke="#94a3b850" strokeDasharray="3 3" />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const d = payload[0].payload;
                    const quadrant =
                      d.valuation >= 50 && d.fundamental >= 50 ? '✅ Cheap + Quality'
                      : d.valuation < 50 && d.fundamental >= 50 ? '⚠️ Premium Quality'
                      : d.valuation >= 50 && d.fundamental < 50 ? '⚠️ Value Trap Risk'
                      : '❌ Expensive + Weak';
                    return (
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', fontSize: '0.82rem' }}>
                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>{d.ticker}</div>
                        <div>Valuation: {d.valuation.toFixed(1)}/100</div>
                        <div>Fundamental: {d.fundamental.toFixed(1)}/100</div>
                        <div style={{ marginTop: '4px', fontWeight: 600 }}>{quadrant}</div>
                      </div>
                    );
                  }}
                />
                <Scatter
                  data={signals.filter(s => s.valuation_score > 0 && s.fundamental_score > 0).map(s => ({
                    ticker: s.ticker,
                    signal: s.signal,
                    valuation: s.valuation_score,
                    fundamental: s.fundamental_score,
                  }))}
                  shape={(props) => {
                    const { cx, cy, payload } = props;
                    const color = getSignalColor(payload.signal);
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r={8} fill={color} fillOpacity={0.7} stroke={color} strokeWidth={2} />
                        <text x={cx} y={cy - 14} textAnchor="middle" fontSize={10} fontWeight={600} fill="#334155">
                          {payload.ticker}
                        </text>
                      </g>
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
            {/* Quadrant labels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
              {[
                { label: 'Premium Quality', desc: 'Strong fundamentals but expensive valuation', icon: '💎', color: '#8b5cf6', pos: 'Top-Left' },
                { label: 'Ideal Candidates', desc: 'Cheap + high quality — best risk/reward', icon: '✅', color: '#10b981', pos: 'Top-Right' },
                { label: 'Avoid Zone', desc: 'Expensive + weak fundamentals', icon: '❌', color: '#ef4444', pos: 'Bottom-Left' },
                { label: 'Value Trap Risk', desc: 'Cheap but weak fundamentals — needs due diligence', icon: '⚠️', color: '#f59e0b', pos: 'Bottom-Right' },
              ].map((q, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: 'var(--spacing-sm)', borderRadius: '6px', backgroundColor: q.color + '08', border: `1px solid ${q.color}20` }}>
                  <span style={{ fontSize: '1rem' }}>{q.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: q.color }}>{q.label} <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 400 }}>({q.pos})</span></div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{q.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Confidence Ranking Bar Chart */}
      {signals.length > 1 && (
        <Card className="result-chart-card" style={{ border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
          <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid #e2e8f0' }}>
            <h3 className="result-section-title">CONFIDENCE RANKING</h3>
            <p className="notebook-description">
              Stocks ordered by model confidence in the signal. Higher confidence indicates stronger alignment 
              between valuation discount/premium and fundamental quality. Signals with confidence below 50% should be 
              treated as weak indications rather than firm recommendations.
            </p>
          </div>
          <div style={{ padding: 'var(--spacing-md)' }}>
            <ResponsiveContainer width="100%" height={Math.max(250, signals.length * 45)}>
              <BarChart
                data={[...signals]
                  .sort((a, b) => normConf(b.confidence) - normConf(a.confidence))
                  .map(s => ({
                    ticker: s.ticker,
                    confidence: normConf(s.confidence),
                    signal: s.signal,
                  }))}
                layout="vertical"
                margin={{ top: 10, right: 40, bottom: 10, left: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis dataKey="ticker" type="category" width={55} tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }} />
                <ReferenceLine x={50} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: '50%', position: 'top', fontSize: 10, fill: '#94a3b8' }} />
                <ReferenceLine x={70} stroke="#10b98150" strokeDasharray="3 3" label={{ value: '70%', position: 'top', fontSize: 10, fill: '#10b981' }} />
                <Tooltip
                  formatter={(v) => `${v.toFixed(1)}%`}
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Bar dataKey="confidence" name="Confidence" radius={[0, 4, 4, 0]} barSize={20}>
                  {[...signals]
                    .sort((a, b) => normConf(b.confidence) - normConf(a.confidence))
                    .map((s, i) => (
                      <Cell key={i} fill={getConfidenceColor(normConf(s.confidence))} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Signal Interpretation */}
      <Card className="result-summary-card notebook-style" style={{ border: '1px solid #e2e8f0' }}>
        <h3 className="notebook-section-title">HOW TO INTERPRET SIGNALS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-lg)' }}>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#10b981', marginBottom: 'var(--spacing-xs)' }}>🟢 BUY Signal</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
              The stock's intrinsic value (based on fundamentals) exceeds its current market price.
              Higher confidence means stronger fundamental backing and larger valuation discount.
              Consider position sizing proportional to confidence.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f59e0b', marginBottom: 'var(--spacing-xs)' }}>🟡 HOLD Signal</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
              The stock is approximately fairly valued — neither clearly cheap nor expensive.
              Maintain existing positions but avoid adding. Monitor for changes in fundamentals
              or valuation that could shift the signal.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ef4444', marginBottom: 'var(--spacing-xs)' }}>🔴 SELL Signal</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
              The stock appears overvalued relative to its fundamentals. The current price implies
              growth or margins that are unlikely to materialize. Consider reducing exposure,
              especially for high-confidence SELL signals.
            </p>
          </div>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic', marginTop: 'var(--spacing-md)', textAlign: 'center' }}>
          ⚠ Signals are based on quantitative fundamental analysis only. Always combine with qualitative research,
          market conditions, and your own risk management framework before executing trades.
        </p>
      </Card>
    </div>
  );
};

export default ValuationResults;

