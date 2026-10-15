import React, { createContext, useContext, useMemo } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useMemo<AuthContextType>(
    () => ({
      user: {
        id: 'usr-exec-1',
        name: 'Managing Partner',
        email: 'executive@sagasia-strategic.com',
        role: 'Executive',
      },
      isAuthenticated: true,
    }),
    []
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};
