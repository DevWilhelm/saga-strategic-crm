import { getResponse, type RequestHandler } from 'msw';
import axios, { AxiosError, AxiosHeaders, type AxiosAdapter } from 'axios';

// Sends axios requests straight to MSW handlers, without intercepting the
// network. (In jsdom, MSW's network interception trips over jsdom's own
// AbortSignal, so tests use this instead of setupServer.)
export const createMswAdapter = (handlers: RequestHandler[]): AxiosAdapter => async (config) => {
  const url = new URL(axios.getUri(config), 'http://localhost');
  const headers = new Headers();
  Object.entries(AxiosHeaders.from(config.headers).toJSON()).forEach(([name, value]) => {
    if (value != null) headers.set(name, String(value));
  });
  const method = (config.method ?? 'get').toUpperCase();
  const request = new Request(url, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : (config.data as BodyInit | undefined),
  });

  const response = await getResponse(handlers, request);
  if (!response) throw new Error(`No mock handler for ${method} ${url.pathname}`);

  const text = await response.text();
  const axiosResponse = {
    data: text ? JSON.parse(text) : undefined,
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers),
    config,
    request: {},
  };
  if (response.status >= 400) {
    throw new AxiosError(
      `Request failed with status code ${response.status}`,
      response.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      {},
      axiosResponse
    );
  }
  return axiosResponse;
};
