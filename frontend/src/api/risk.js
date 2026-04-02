import apiClient from './client';

export const riskAPI = {
  calculateRatios: async (returns, weights, riskFreeRate, ddof = 0) => {
    return apiClient.post('/risk/ratios/', {
      returns: returns,
      weights: weights,
      risk_free_rate: riskFreeRate,
      ddof: ddof,
    });
  },

  calculateVarEs: async (returns, weights, confidenceLevel = 0.95, method = 'historical') => {
    return apiClient.post('/risk/var-es/', {
      returns: returns,
      weights: weights,
      confidence_level: confidenceLevel,
      method: method,
    });
  },

  calculateDrawdown: async (returns, weights, riskFreeRate = 0.0) => {
    return apiClient.post('/risk/drawdown/', {
      returns: returns,
      weights: weights,
      risk_free_rate: riskFreeRate,
    });
  },

  analyzeBenchmark: async (returns, weights, benchmarkReturns, riskFreeRate, ddof = 1) => {
    return apiClient.post('/risk/benchmark/', {
      returns: returns,
      weights: weights,
      benchmark_returns: benchmarkReturns,
      risk_free_rate: riskFreeRate,
      ddof: ddof,
    });
  },

  analyzeDistribution: async (returns, weights) => {
    return apiClient.post('/risk/distribution/', {
      returns: returns,
      weights: weights,
    });
  },

  analyzeCorrelation: async (returns) => {
    return apiClient.post('/risk/correlation/', {
      returns: returns,
    });
  },

  analyzeComplete: async (tickers, benchmarkName = 'SP500', startDate = '', endDate = '', weights = null, riskFreeRate = 0.03, confidenceLevel = 0.95, varMethods = null) => {
    const body = {
      tickers: tickers,
      benchmark_name: benchmarkName,
      risk_free_rate: riskFreeRate,
      confidence_level: confidenceLevel,
    };
    
    if (startDate) body.start_date = startDate;
    if (endDate) body.end_date = endDate;
    if (weights) body.weights = weights;
    if (varMethods) body.var_methods = varMethods;
    
    return apiClient.post('/risk/complete/', body);
  },
};

