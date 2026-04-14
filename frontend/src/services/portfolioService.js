import apiClient from './apiService';

export const portfolioService = {
  getIndices: async () => {
    return apiClient.get('/portfolio/indices/');
  },

  analyze: async (candidateTickers, startDate = '', endDate = '', config = null) => {
    return apiClient.post('/portfolio/analyze/', {
      candidate_tickers: candidateTickers,
      start_date: startDate,
      end_date: endDate,
      config: config,
    });
  },

  analyzeFromIndex: async (indexName, startDate = '', endDate = '', config = null) => {
    return apiClient.post('/portfolio/analyze/', {
      index_name: indexName,
      start_date: startDate,
      end_date: endDate,
      config: config,
    });
  },
};
