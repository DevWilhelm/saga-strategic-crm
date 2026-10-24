import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { CurrentUser } from '../types/user';
import type { UserRole, PermissionAction } from '../constants/users';
import { usersApi } from '../api/usersApi';
import { authApi } from '../api/authApi';
import { tokenStore } from '../api/tokenStore';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextType {
  user: CurrentUser | null;
  role: UserRole | null;
  permissions: PermissionAction[];
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<CurrentUser>;
  logout: () => void;
  switchDevUser: (userId: string) => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  permissions: [],
  status: 'loading',
  isAuthenticated: false,
  isLoading: true,
  login: async () => {
    throw new Error('AuthProvider is missing');
  },
  logout: () => {},
  switchDevUser: async () => {},
  refetchUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<CurrentUser | null>(null);
  // Without a token there is nothing to restore, so the app goes straight to sign-in.
  const [status, setStatus] = useState<AuthStatus>(() => (authApi.hasSession() ? 'loading' : 'anonymous'));

  const signOutLocally = useCallback(() => {
    authApi.logout();
    setUser(null);
    setStatus('anonymous');
    queryClient.clear();
  }, [queryClient]);

  const fetchMe = useCallback(async () => {
    try {
      const data = await usersApi.getMe();
      setUser(data);
      setStatus('authenticated');
    } catch (error) {
      console.error('Failed to load authenticated user profile from /api/me:', error);
      signOutLocally();
    }
  }, [signOutLocally]);

  // On first load, restore the session if this tab still has a token.
  useEffect(() => {
    let ignore = false;
    if (!authApi.hasSession()) return;
    usersApi
      .getMe()
      .then((data) => {
        if (ignore) return;
        setUser(data);
        setStatus('authenticated');
      })
      .catch((error) => {
        console.error('Failed to load authenticated user profile from /api/me:', error);
        if (!ignore) signOutLocally();
      });
    return () => {
      ignore = true;
    };
  }, [signOutLocally]);

  // The API client reports when the token is rejected mid-session.
  useEffect(() => tokenStore.onSessionExpired(signOutLocally), [signOutLocally]);

  const login = useCallback(async (identifier: string, password: string) => {
    await authApi.login({ identifier, password });
    const me = await usersApi.getMe();
    setUser(me);
    setStatus('authenticated');
    return me;
  }, []);

  // Dev mock only: switch persona without signing out (Topbar "Dev Role Switcher").
  const switchDevUser = useCallback(
    async (userId: string) => {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('dev_mock_user_id', userId);
      }
      await fetchMe();
    },
    [fetchMe]
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      role: user?.role || null,
      permissions: user?.permissions || [],
      status,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
      login,
      logout: signOutLocally,
      switchDevUser,
      refetchUser: fetchMe,
    }),
    [user, status, login, signOutLocally, switchDevUser, fetchMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};
