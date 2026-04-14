import apiClient from './apiService';

export const chatService = {
  getWelcome: async () => {
    return apiClient.get('/chat/welcome/');
  },

  sendMessage: async (message, sessionId = null, context = null) => {
    return apiClient.post('/chat/send/', {
      message,
      session_id: sessionId,
      context,
    });
  },

  clearMemory: async (sessionId = null) => {
    return apiClient.post('/chat/clear/', {
      session_id: sessionId,
    });
  },

  getHistory: async (sessionId = null, lastN = 10) => {
    return apiClient.get('/chat/history/', {
      params: { session_id: sessionId, last_n: lastN },
    });
  },
};
