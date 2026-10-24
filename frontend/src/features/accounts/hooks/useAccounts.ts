import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '../../../api/accountsApi';
import type {
  Account,
  AccountDetail,
  AccountFilters,
  PaginatedAccountsResponse,
  CreateAccountDTO,
  UpdateAccountDTO,
  AccountNote,
  AccountDeal,
} from '../../../types/account';
import type { AccountLookups } from '../../../types/lookup';
import type { AccountContact } from '../../../types/contact';

export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  // ALL filters are explicitly embedded in the query key
  list: (filters: AccountFilters) => [...accountKeys.lists(), filters] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
  contacts: (id: string) => [...accountKeys.detail(id), 'contacts'] as const,
  notes: (id: string) => [...accountKeys.detail(id), 'notes'] as const,
  deals: (id: string) => [...accountKeys.detail(id), 'deals'] as const,
  lookups: () => [...accountKeys.all, 'lookups'] as const,
};

export const useAccounts = (filters: AccountFilters) => {
  return useQuery<PaginatedAccountsResponse, Error>({
    queryKey: accountKeys.list(filters),
    queryFn: () => accountsApi.getAccounts(filters),
  });
};

export const useAccountDetail = (id: string) => {
  return useQuery<AccountDetail, Error>({
    queryKey: accountKeys.detail(id),
    queryFn: () => accountsApi.getAccountById(id),
    enabled: Boolean(id),
  });
};

export const useAccountLookups = () => {
  return useQuery<AccountLookups, Error>({
    queryKey: accountKeys.lookups(),
    queryFn: () => accountsApi.getAccountLookups(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useAccountContacts = (accountId: string) => {
  return useQuery<AccountContact[], Error>({
    queryKey: accountKeys.contacts(accountId),
    queryFn: () => accountsApi.getAccountContacts(accountId),
    enabled: Boolean(accountId),
  });
};

export const useAccountNotes = (accountId: string) => {
  return useQuery<AccountNote[], Error>({
    queryKey: accountKeys.notes(accountId),
    queryFn: () => accountsApi.getAccountNotes(accountId),
    enabled: Boolean(accountId),
  });
};

export const useAddAccountNote = (accountId: string) => {
  const queryClient = useQueryClient();
  return useMutation<AccountNote, Error, { text: string }>({
    mutationFn: ({ text }) => accountsApi.addAccountNote(accountId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.notes(accountId) });
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(accountId) });
    },
  });
};

export const useAccountDeals = (accountId: string) => {
  return useQuery<AccountDeal[], Error>({
    queryKey: accountKeys.deals(accountId),
    queryFn: () => accountsApi.getAccountDeals(accountId),
    enabled: Boolean(accountId),
  });
};

export const useSaveAccount = () => {
  const queryClient = useQueryClient();
  return useMutation<Account, Error, { id?: string; data: CreateAccountDTO | UpdateAccountDTO }>({
    mutationFn: ({ id, data }) => {
      if (id) {
        return accountsApi.updateAccount(id, data as UpdateAccountDTO);
      }
      return accountsApi.createAccount(data as CreateAccountDTO);
    },
    onSuccess: (savedAccount, { id }) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      if (id) {
        queryClient.invalidateQueries({ queryKey: accountKeys.detail(id) });
      }
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(savedAccount.id) });
    },
  });
};
