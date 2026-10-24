import { apiClient } from './client';
import { tokenStore } from './tokenStore';
import type { LoginRequest, LoginResponse } from '../types/auth';

export const authApi = {
  // POST /api/auth/login: stores the access token for this tab.
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    tokenStore.setAccessToken(response.data.accessToken);
    return response.data;
  },

  // The backend has no logout endpoint (tokens are stateless), so signing out
  // just forgets the token in this tab.
  logout: () => {
    tokenStore.clear();
  },

  hasSession: (): boolean => tokenStore.getAccessToken() !== null,
};
