import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for enhanced error handling and logging
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError | Error) => {
    // Log detailed error information for debugging
    if (error instanceof AxiosError) {
      console.error('API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        code: error.code,
        url: error.config?.url,
        method: error.config?.method,
        timestamp: new Date().toISOString(),
        data: error.response?.data,
      });
    } else {
      console.error('API Error:', {
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
