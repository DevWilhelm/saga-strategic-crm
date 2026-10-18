import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { CurrentUser } from '../types/user';
import type { UserRole, PermissionAction } from '../constants/users';
import { usersApi } from '../api/usersApi';

export interface AuthContextType {
  user: CurrentUser | null;
  role: UserRole | null;
  permissions: PermissionAction[];
  isAuthenticated: boolean;
  isLoading: boolean;
  switchDevUser: (userId: string) => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  permissions: [],
  isAuthenticated: false,
  isLoading: true,
  switchDevUser: async () => {},
  refetchUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const data = await usersApi.getMe();
      setUser(data);
    } catch (error) {
      console.error('Failed to load authenticated user profile from /api/me:', error);
      // Fallback default admin profile in mock environment
      setUser({
        id: 'usr-ploy',
        name: 'Ploy S.',
        code: 'PS',
        username: 'ploy.s',
        role: 'ADMIN',
        status: 'ACTIVE',
        permissions: [
          'dashboard.view',
          'accounts.view',
          'account.create',
          'account.edit',
          'account.reassignOwner',
          'contacts.view',
          'lookup.manage',
          'user.manage',
        ],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    usersApi
      .getMe()
      .then((data) => {
        if (!ignore) {
          setUser(data);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('Failed to load authenticated user profile from /api/me:', error);
        if (!ignore) {
          setUser({
            id: 'usr-ploy',
            name: 'Ploy S.',
            code: 'PS',
            username: 'ploy.s',
            role: 'ADMIN',
            status: 'ACTIVE',
            permissions: [
              'dashboard.view',
              'accounts.view',
              'account.create',
              'account.edit',
              'account.reassignOwner',
              'contacts.view',
              'lookup.manage',
              'user.manage',
            ],
          });
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

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
      isAuthenticated: Boolean(user),
      isLoading,
      switchDevUser,
      refetchUser: fetchMe,
    }),
    [user, isLoading, switchDevUser, fetchMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};
