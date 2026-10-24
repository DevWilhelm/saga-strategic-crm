import axios from 'axios';
import { tokenStore } from './tokenStore';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Every request carries the signed-in user's token.
apiClient.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const isAuthEndpoint = (url?: string) => !!url && url.includes('/auth/');

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // An expired or rejected token ends the session (there is no refresh token).
    if (error.response?.status === 401 && !isAuthEndpoint(error.config?.url) && tokenStore.getAccessToken()) {
      tokenStore.clear();
      tokenStore.notifySessionExpired();
    }

    const data = error.response?.data;
    const message = data?.message || error.message || 'Request failed';
    const enhancedError = new Error(message) as Error & {
      code?: string;
      response?: typeof error.response;
      errors?: Array<{ field: string; message: string }>;
    };
    enhancedError.code = error.code;
    enhancedError.response = error.response;
    if (data?.errors) {
      enhancedError.errors = data.errors;
    }
    return Promise.reject(enhancedError);
  }
);
