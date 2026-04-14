import apiClient from './apiService';

export const capmService = {
  analyze: async (assetReturns, marketReturns, riskFreeRate, marketTicker = null) => {
    return apiClient.post('/capm/analyze/', {
      asset_returns: assetReturns,
      market_returns: marketReturns,
      risk_free_rate: riskFreeRate,
      market_ticker: marketTicker,
    });
  },

  multiAsset: async (returns, marketReturns, riskFreeRate, marketTicker = null) => {
    return apiClient.post('/capm/multi-asset/', {
      returns: returns,
      market_returns: marketReturns,
      risk_free_rate: riskFreeRate,
      market_ticker: marketTicker,
    });
  },

  optimize: async (returns, riskFreeRate, nPoints = 50, allowShort = false) => {
    return apiClient.post('/capm/optimize/', {
      returns: returns,
      risk_free_rate: riskFreeRate,
      n_points: nPoints,
      allow_short: allowShort,
    });
  },

  expectedReturn: async (beta, riskFreeRate, marketReturn) => {
    return apiClient.post('/capm/expected-return/', {
      beta: beta,
      risk_free_rate: riskFreeRate,
      market_return: marketReturn,
    });
  },
};
