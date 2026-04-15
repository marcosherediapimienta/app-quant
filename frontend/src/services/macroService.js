import apiClient from './apiService';

export const macroService = {
  analyzeFactors: async (portfolioReturns, macroFactors, useHac = true) => {
    return apiClient.post('/macro/factors/', {
      portfolio_returns: portfolioReturns,
      macro_factors: macroFactors,
      use_hac: useHac,
    });
  },

  analyzeCorrelation: async (portfolioReturns, macroFactors) => {
    return apiClient.post('/macro/correlation/', {
      portfolio_returns: portfolioReturns,
      macro_factors: macroFactors,
    });
  },

  /**
   * All-to-all correlation matrix on log-returns of downloaded price series.
   * @param {Record<string, Record<string, number>>} macroFactors - same shape as factor download payload
   * @param {{ minObservations?: number, correlationMethod?: 'pearson' | 'spearman' }} [opts]
   */
  analyzeCorrelationMatrix: async (macroFactors, opts = {}) => {
    const body = { macro_factors: macroFactors };
    if (opts.minObservations != null) {
      body.min_observations = opts.minObservations;
    }
    if (opts.correlationMethod === 'spearman' || opts.correlationMethod === 'pearson') {
      body.correlation_method = opts.correlationMethod;
    }
    return apiClient.post('/macro/correlation-matrix/', body);
  },

  analyzeSituation: async (factorsData) => {
    return apiClient.post('/macro/situation/', {
      factors_data: factorsData,
    });
  },
};
