import { http, HttpResponse, delay } from 'msw';
import { mockStore } from '../store';
import type { LoginRequest, LoginResponse } from '../../types/auth';

// Mirrors POST /api/auth/login on feature/be-auth. Signing in makes that user
// the current mock user, so /api/me and every other mock answer as them.
// Demo passwords are in the MockStore password map (store.ts).
export const authHandlers = [
  http.post('*/api/auth/login', async ({ request }) => {
    await delay(400);
    const body = (await request.json().catch(() => ({}))) as Partial<LoginRequest>;
    const identifier = body.identifier?.trim().toLowerCase() ?? '';

    if (!identifier || !body.password) {
      return HttpResponse.json(
        {
          status: 400,
          error: 'Bad Request',
          message: 'Enter your email or username and password.',
          errors: [
            ...(!identifier ? [{ field: 'identifier', message: 'Name or email is required' }] : []),
            ...(!body.password ? [{ field: 'password', message: 'Password is required' }] : []),
          ],
        },
        { status: 400 }
      );
    }

    const user = mockStore.users.find(
      (u) => u.email?.toLowerCase() === identifier || u.username.toLowerCase() === identifier
    );
    // One message for unknown user, wrong password and inactive account,
    // so the response doesn't reveal which accounts exist.
    if (!user || user.status !== 'ACTIVE' || !mockStore.verifyPassword(user.id, body.password)) {
      return HttpResponse.json(
        { status: 401, error: 'Unauthorized', message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    mockStore.setCurrentMockUserId(user.id);
    const response: LoginResponse = {
      tokenType: 'Bearer',
      accessToken: `mock-token.${user.id}`,
      user: { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role },
    };
    return HttpResponse.json(response);
  }),
];
