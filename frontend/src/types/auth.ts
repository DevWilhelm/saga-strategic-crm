// POST /api/auth/login as implemented on feature/be-auth (LoginRequest / LoginResponse).

export interface LoginRequest {
  // Username or email address.
  identifier: string;
  password: string;
}

export interface LoginResponse {
  tokenType: string;
  accessToken: string;
  // Profile summary; the app loads the full profile and permissions from /me.
  user: { id: string; name: string; email?: string; username?: string; role?: string };
}
