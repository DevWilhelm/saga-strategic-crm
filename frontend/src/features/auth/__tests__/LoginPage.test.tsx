import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { apiClient } from '../../../api/client';
import { authHandlers } from '../../../mocks/handlers/auth';
import { userHandlers } from '../../../mocks/handlers/users';
import { createMswAdapter } from '../../../test/mswAdapter';

// Demo users and password come from the mock store (src/mocks/store.ts).
const DEMO_PASSWORD = 'Password123!';
const originalAdapter = apiClient.defaults.adapter;

const renderLogin = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<p>Dashboard home</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );

const signIn = async (identifier: string, password: string) => {
  const user = userEvent.setup();
  if (identifier) await user.type(screen.getByLabelText('Email or username'), identifier);
  if (password) await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
};

describe('LoginPage', () => {
  beforeEach(() => {
    apiClient.defaults.adapter = createMswAdapter([...authHandlers, ...userHandlers]);
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('asks for both fields when submitted empty', async () => {
    renderLogin();
    await signIn('', '');

    expect(screen.getByText('Enter your email or username.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email or username')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the server message and clears the password when sign-in fails', async () => {
    renderLogin();
    await signIn('ploy.s', 'wrong-password');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });

  it('signs in with a username and opens the dashboard', async () => {
    renderLogin();
    await signIn('  ploy.s ', DEMO_PASSWORD);

    expect(await screen.findByText('Dashboard home')).toBeInTheDocument();
    expect(sessionStorage.getItem('crm.accessToken')).toBe('mock-token.usr-ploy');
  });

  it('signs in with an email address', async () => {
    renderLogin();
    await signIn('danai.k@saga-consulting.com', DEMO_PASSWORD);

    expect(await screen.findByText('Dashboard home')).toBeInTheDocument();
  });

  it('does not let a deactivated user in', async () => {
    renderLogin();
    await signIn('alex.t', DEMO_PASSWORD);

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(sessionStorage.getItem('crm.accessToken')).toBeNull();
  });

  it('toggles password visibility', async () => {
    renderLogin();
    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
  });
});
