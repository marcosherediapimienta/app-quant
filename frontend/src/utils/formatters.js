export const parseTickers = (tickerString) => {
  if (!tickerString || typeof tickerString !== 'string') {
    return [];
  }
  return tickerString
    .split(',')
    .map(t => t.trim().toUpperCase())
    .filter(t => t.length > 0);
};


const extractPayload = (raw) => {
  if (!raw || typeof raw !== 'object') return {};
  if (raw.data && typeof raw.data === 'object') return raw.data;
  return raw;
};

export const formatReturnsForAPI = extractPayload;
export const formatMacroFactorsForAPI = extractPayload;

export const formatPercent = (val) => {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return (Number(val) * 100).toFixed(2) + '%';
};

export const formatNumber = (val, decimals = 2) => {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return Number(val).toFixed(decimals);
};

export const formatPct = (v, decimals = 2) => {
  if (v === null || v === undefined || isNaN(v)) return 'N/A';
  return `${v >= 0 ? '+' : ''}${Number(v).toFixed(decimals)}%`;
};

export const formatPp = (v) => {
  if (v === null || v === undefined || isNaN(v)) return 'N/A';
  return `${v >= 0 ? '+' : ''}${Number(v).toFixed(2)} pp`;
};

export const getChangeColor = (v) => {
  if (v === null || v === undefined) return '#94a3b8';
  if (v > 0) return '#10b981';
  if (v < 0) return '#ef4444';
  return '#94a3b8';
};

export const formatLargeNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1e12) {
    return `${sign}${(absValue / 1e12).toFixed(decimals)}T`;
  }

  if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(decimals)}B`;
  }

  if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(decimals)}M`;
  }

  if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(decimals)}K`;
  }

  return value.toFixed(decimals);
};
