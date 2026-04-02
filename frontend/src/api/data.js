import apiClient from './client';

export const dataAPI = {
  downloadTickers: async (tickers, startDate = null, endDate = null, type = 'returns') => {
    return apiClient.post('/data/download/', {
      tickers: tickers,
      start_date: startDate,
      end_date: endDate,
      type: type,
    });
  },

  downloadMacroFactors: async (factors = null, startDate = null, endDate = null) => {
    return apiClient.post('/data/macro-factors/', {
      factors: factors,
      start_date: startDate,
      end_date: endDate,
    });
  },
};

