import apiClient from './apiService';

export const valuationService = {
  analyzeCompany: async (ticker) => {
    return apiClient.post('/valuation/company/', {
      ticker: ticker,
    });
  },

  compare: async (tickers) => {
    return apiClient.post('/valuation/compare/', {
      tickers: tickers,
    });
  },

  analyzeSector: async (ticker, peers = null, fetchPeers = true) => {
    return apiClient.post('/valuation/sector/', {
      ticker: ticker,
      peers: peers,
      fetch_peers: fetchPeers,
    });
  },

  generateSignals: async (tickers) => {
    return apiClient.post('/valuation/signals/', {
      tickers: tickers,
    });
  },
};
