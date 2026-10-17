import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;
    const message = data?.message || error.message || 'Request failed';
    const enhancedError = new Error(message) as Error & {
      response?: typeof error.response;
      errors?: Array<{ field: string; message: string }>;
    };
    enhancedError.response = error.response;
    if (data?.errors) {
      enhancedError.errors = data.errors;
    }
    return Promise.reject(enhancedError);
  }
);
