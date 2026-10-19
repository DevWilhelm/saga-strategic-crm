// The backend issues one access token at sign-in and no refresh token
// (POST /api/auth/login on feature/be-auth). It is kept in sessionStorage so a
// reload in the same tab stays signed in; closing the tab signs the user out.
const ACCESS_TOKEN_KEY = 'crm.accessToken';

const sessionExpiredListeners = new Set<() => void>();

export const tokenStore = {
  getAccessToken: (): string | null => {
    try {
      return sessionStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setAccessToken: (token: string) => {
    try {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch {
      // Storage blocked (private mode, policy): the session just won't survive a reload.
    }
  },

  clear: () => {
    try {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch {
      // Nothing stored.
    }
  },

  onSessionExpired: (listener: () => void): (() => void) => {
    sessionExpiredListeners.add(listener);
    return () => {
      sessionExpiredListeners.delete(listener);
    };
  },

  notifySessionExpired: () => {
    sessionExpiredListeners.forEach((listener) => listener());
  },
};
