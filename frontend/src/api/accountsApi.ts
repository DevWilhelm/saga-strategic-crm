import { apiClient } from './client';
import type {
  Account,
  AccountDetail,
  AccountFilters,
  PaginatedAccountsResponse,
  CreateAccountDTO,
  UpdateAccountDTO,
  AccountNote,
  AccountDeal,
  AccountImportPayload,
  AccountImportResponse,
} from '../types/account';
import type { AccountLookups } from '../types/lookup';
import type { AccountContact } from '../types/contact';

export const accountsApi = {
  // 1. GET /api/accounts
  getAccounts: async (filters: AccountFilters = {}): Promise<PaginatedAccountsResponse> => {
    const params = new URLSearchParams();

    if (filters.q) params.set('q', filters.q);
    if (filters.businessLine) params.set('businessLine', filters.businessLine);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.subCategoryId) params.set('subCategoryId', filters.subCategoryId);
    if (filters.serviceId) params.set('serviceId', filters.serviceId);
    if (filters.tier) params.set('tier', filters.tier);
    if (filters.dealSide) params.set('dealSide', filters.dealSide);
    if (filters.ownerId) params.set('ownerId', filters.ownerId);
    if (filters.country) params.set('country', filters.country);
    if (filters.status) params.set('status', filters.status);
    if (filters.page !== undefined) params.set('page', String(filters.page));
    if (filters.size !== undefined) params.set('size', String(filters.size));
    if (filters.sort) params.set('sort', filters.sort);

    const response = await apiClient.get<PaginatedAccountsResponse>('/accounts', { params });
    return response.data;
  },

  // 2. GET /api/accounts/:id
  getAccountById: async (id: string): Promise<AccountDetail> => {
    const response = await apiClient.get<AccountDetail>(`/accounts/${id}`);
    return response.data;
  },

  // 3. POST /api/accounts
  createAccount: async (payload: CreateAccountDTO): Promise<Account> => {
    const response = await apiClient.post<Account>('/accounts', payload);
    return response.data;
  },

  // 3. PUT /api/accounts/:id
  updateAccount: async (id: string, payload: UpdateAccountDTO): Promise<Account> => {
    const response = await apiClient.put<Account>(`/accounts/${id}`, payload);
    return response.data;
  },

  // 4. GET /api/accounts/:id/contacts
  getAccountContacts: async (id: string): Promise<AccountContact[]> => {
    const response = await apiClient.get<AccountContact[]>(`/accounts/${id}/contacts`);
    return response.data;
  },

  // 5. GET /api/accounts/:id/notes
  getAccountNotes: async (id: string): Promise<AccountNote[]> => {
    const response = await apiClient.get<AccountNote[]>(`/accounts/${id}/notes`);
    return response.data;
  },

  // 5. POST /api/accounts/:id/notes
  addAccountNote: async (id: string, text: string): Promise<AccountNote> => {
    const response = await apiClient.post<AccountNote>(`/accounts/${id}/notes`, { text });
    return response.data;
  },

  // 6. GET /api/accounts/:id/deals
  getAccountDeals: async (id: string): Promise<AccountDeal[]> => {
    const response = await apiClient.get<AccountDeal[]>(`/accounts/${id}/deals`);
    return response.data;
  },

  // 7. GET /api/accounts/lookups
  getAccountLookups: async (): Promise<AccountLookups> => {
    const response = await apiClient.get<AccountLookups>('/accounts/lookups');
    return response.data;
  },

  // 8. GET /api/accounts/export (All rows matching active filters & sort)
  exportAccounts: async (
    filters: AccountFilters = {},
    format: 'xlsx' | 'csv' = 'xlsx'
  ): Promise<{ blob: Blob; filename: string }> => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.businessLine) params.set('businessLine', filters.businessLine);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.subCategoryId) params.set('subCategoryId', filters.subCategoryId);
    if (filters.serviceId) params.set('serviceId', filters.serviceId);
    if (filters.tier) params.set('tier', filters.tier);
    if (filters.dealSide) params.set('dealSide', filters.dealSide);
    if (filters.ownerId) params.set('ownerId', filters.ownerId);
    if (filters.country) params.set('country', filters.country);
    if (filters.status) params.set('status', filters.status);
    if (filters.sort) params.set('sort', filters.sort);
    params.set('format', format);

    const response = await apiClient.get('/accounts/export', {
      params,
      responseType: 'blob',
    });

    const contentDisposition = (response.headers['content-disposition'] as string) || '';
    const match = /filename=["']?([^"';]+)["']?/.exec(contentDisposition);
    const filename = match
      ? match[1]
      : `accounts-${new Date().toISOString().slice(0, 10)}.${format}`;

    return { blob: response.data as Blob, filename };
  },

  // 9. POST /api/accounts/import (Validate or Commit spreadsheet rows)
  importAccounts: async (
    payload: AccountImportPayload
  ): Promise<AccountImportResponse> => {
    const response = await apiClient.post<AccountImportResponse>('/accounts/import', payload);
    return response.data;
  },
};
