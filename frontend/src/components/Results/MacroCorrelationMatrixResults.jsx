import Card from '../Card/Card';
import { getFactorMetadata } from '../../utils/options';
import './Results.css';

const labelForTicker = (ticker) => {
  const meta = getFactorMetadata(ticker);
  if (meta?.label) return meta.label;
  return ticker;
};

const cellColor = (v) => {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '#f1f5f9';
  const x = Number(v);
  const a = Math.min(0.55, Math.abs(x) * 0.45 + 0.08);
  if (x >= 0) return `rgba(16, 185, 129, ${a})`;
  return `rgba(239, 68, 68, ${a})`;
};

const MacroCorrelationMatrixResults = ({ data }) => {
  if (!data || data.analysis_mode !== 'correlation_matrix_log_returns') {
    return (
      <Card className="result-summary-card">
        <p>No matrix data available.</p>
      </Card>
    );
  }

  const matrix = data.correlation_matrix || {};
  const columns = Object.keys(matrix).sort();
  const nObs = data.n_observations;
  const nSeries = data.n_series;
  const minPeriods = data.min_periods;
  const topPos = data.top_positive_pairs || [];
  const topNeg = data.top_negative_pairs || [];
  const corrMethod = (data.correlation_method || 'pearson').toLowerCase();
  const methodLabel =
    corrMethod === 'spearman' ? 'Spearman (rank)' : corrMethod === 'pearson' ? 'Pearson (linear)' : corrMethod;

  return (
    <div className="results-container">
      <div className="notebook-header">
        <h2>CORRELATION MATRIX (ALL VS ALL)</h2>
      </div>

      <Card className="result-summary-card notebook-style">
        <h3 className="notebook-section-title">SUMMARY</h3>
        <div className="notebook-table">
          <div className="notebook-row">
            <span className="notebook-label">Return type:</span>
            <span className="notebook-value">{data.return_type === 'log' ? 'Log returns' : data.return_type}</span>
          </div>
          <div className="notebook-row">
            <span className="notebook-label">Correlation:</span>
            <span className="notebook-value">{methodLabel}</span>
          </div>
          <div className="notebook-row">
            <span className="notebook-label">Observations (aligned):</span>
            <span className="notebook-value">{nObs != null ? nObs : '—'}</span>
          </div>
          <div className="notebook-row">
            <span className="notebook-label">Series count:</span>
            <span className="notebook-value">{nSeries != null ? nSeries : columns.length}</span>
          </div>
          {minPeriods != null && (
            <div className="notebook-row">
              <span className="notebook-label">Corr min_periods:</span>
              <span className="notebook-value">{minPeriods}</span>
            </div>
          )}
        </div>
        <p className="notebook-description" style={{ marginTop: '0.75rem' }}>
          {corrMethod === 'spearman' ? (
            <>
              Spearman rank correlation on daily log-returns: ln(P<sub>t</sub>) − ln(P<sub>t−1</sub>). Captures
              monotonic co-movement and is less sensitive to extreme days than Pearson.
            </>
          ) : (
            <>
              Pearson correlation on daily log-returns: ln(P<sub>t</sub>) − ln(P<sub>t−1</sub>). Rows/columns use
              Yahoo tickers; labels from your factor registry when available.
            </>
          )}
        </p>
      </Card>

      {(topPos.length > 0 || topNeg.length > 0) && (
        <Card className="result-table-card notebook-style">
          <h3 className="notebook-section-title">TOP PAIRS</h3>
          <div className="table-container" style={{ marginBottom: '1rem' }}>
            <h4 className="notebook-section-title" style={{ fontSize: '0.85rem' }}>
              Most positive
            </h4>
            <table className="notebook-table-styled">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Series A</th>
                  <th style={{ textAlign: 'left' }}>Series B</th>
                  <th style={{ textAlign: 'right' }}>ρ</th>
                </tr>
              </thead>
              <tbody>
                {topPos.map((row, idx) => (
                  <tr key={`p-${idx}`}>
                    <td>{labelForTicker(row.series_a)}</td>
                    <td>{labelForTicker(row.series_b)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                      {typeof row.correlation === 'number' ? row.correlation.toFixed(4) : row.correlation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-container">
            <h4 className="notebook-section-title" style={{ fontSize: '0.85rem' }}>
              Most negative
            </h4>
            <table className="notebook-table-styled">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Series A</th>
                  <th style={{ textAlign: 'left' }}>Series B</th>
                  <th style={{ textAlign: 'right' }}>ρ</th>
                </tr>
              </thead>
              <tbody>
                {topNeg.map((row, idx) => (
                  <tr key={`n-${idx}`}>
                    <td>{labelForTicker(row.series_a)}</td>
                    <td>{labelForTicker(row.series_b)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                      {typeof row.correlation === 'number' ? row.correlation.toFixed(4) : row.correlation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {columns.length > 0 && (
        <Card className="result-table-card notebook-style">
          <h3 className="notebook-section-title">FULL MATRIX</h3>
          <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
            <table className="notebook-table-styled" style={{ fontSize: '0.75rem' }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 1 }} />
                  {columns.map((c) => (
                    <th
                      key={c}
                      style={{
                        textAlign: 'center',
                        minWidth: 72,
                        maxWidth: 120,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={labelForTicker(c)}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {columns.map((rowKey) => (
                  <tr key={rowKey}>
                    <th
                      style={{
                        textAlign: 'left',
                        position: 'sticky',
                        left: 0,
                        background: 'var(--bg-card)',
                        zIndex: 1,
                        maxWidth: 140,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={labelForTicker(rowKey)}
                    >
                      {rowKey}
                    </th>
                    {columns.map((colKey) => {
                      const v = matrix[rowKey]?.[colKey];
                      const isDiag = rowKey === colKey;
                      return (
                        <td
                          key={`${rowKey}-${colKey}`}
                          style={{
                            textAlign: 'center',
                            fontFamily: 'monospace',
                            background: isDiag ? '#e2e8f0' : cellColor(v),
                            color: '#0f172a',
                            fontWeight: isDiag ? 700 : 500,
                          }}
                        >
                          {v === null || v === undefined || Number.isNaN(Number(v))
                            ? '—'
                            : Number(v).toFixed(2)}
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
};

export default MacroCorrelationMatrixResults;
