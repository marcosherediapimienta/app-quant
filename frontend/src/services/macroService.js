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

  analyzeSituation: async (factorsData) => {
    return apiClient.post('/macro/situation/', {
      factors_data: factorsData,
    });
  },
};
