import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { apiClient } from '../client';
import { tokenStore } from '../tokenStore';
import { getApiErrorInfo } from '../errors';

type Reply = { status: number; data?: unknown };

// Replaces the network with a function of the request config.
const useFakeServer = (reply: (config: InternalAxiosRequestConfig) => Reply) => {
  const calls: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    calls.push(config);
    const { status, data } = reply(config);
    const response = { data, status, statusText: String(status), headers: new AxiosHeaders(), config };
    if (status >= 400) {
      throw Object.assign(new Error(`Request failed with status code ${status}`), {
        isAxiosError: true,
        config,
        response,
        toJSON: () => ({}),
      });
    }
    return response;
  };
  apiClient.defaults.adapter = adapter;
  return calls;
};

describe('apiClient', () => {
  const originalAdapter = apiClient.defaults.adapter;

  beforeEach(() => tokenStore.clear());
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('attaches the access token to requests', async () => {
    tokenStore.setAccessToken('token-1');
    const calls = useFakeServer(() => ({ status: 200, data: {} }));

    await apiClient.get('/accounts');

    expect(calls[0].headers.Authorization).toBe('Bearer token-1');
  });

  it('ends the session when the token is rejected', async () => {
    tokenStore.setAccessToken('expired');
    const onExpired = vi.fn();
    const unsubscribe = tokenStore.onSessionExpired(onExpired);
    useFakeServer(() => ({ status: 401, data: { status: 401, error: 'Unauthorized', message: 'Token expired' } }));

    await expect(apiClient.get('/accounts')).rejects.toThrow('Token expired');

    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(tokenStore.getAccessToken()).toBeNull();
    unsubscribe();
  });

  it('does not end the session when the login call itself returns 401', async () => {
    const onExpired = vi.fn();
    const unsubscribe = tokenStore.onSessionExpired(onExpired);
    useFakeServer(() => ({ status: 401, data: { message: 'Invalid email or password' } }));

    await expect(apiClient.post('/auth/login', {})).rejects.toThrow('Invalid email or password');
    expect(onExpired).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('exposes the Spring error message, status and field errors', async () => {
    useFakeServer(() => ({
      status: 400,
      data: {
        status: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        errors: [{ field: 'name', message: 'Name is required' }],
      },
    }));

    const error = await apiClient.post('/categories', {}).catch((e: unknown) => e);

    expect(getApiErrorInfo(error)).toEqual({
      message: 'Validation failed',
      status: 400,
      fieldErrors: [{ field: 'name', message: 'Name is required' }],
    });
  });

  it('explains when the server cannot be reached', () => {
    expect(getApiErrorInfo(new Error('Network Error')).message).toBe(
      "Can't reach the CRM server. Check your connection and try again."
    );
  });
});
