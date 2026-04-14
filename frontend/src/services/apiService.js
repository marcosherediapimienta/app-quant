import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../utils/constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_TIMEOUT,
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'Unknown error';

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      message = 'The analysis is taking too long. Please try with fewer companies or a smaller index.';
    } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      message = 'Could not connect to the server. Make sure the backend is running.';
    } else if (error.response?.data?.error) {
      message = error.response.data.error;
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
