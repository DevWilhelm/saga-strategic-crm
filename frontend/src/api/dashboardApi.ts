import { apiClient } from './client';
import type {
  Account,
  CategoryDistributionMetric,
  Contact,
  DashboardChartsData,
  DashboardFilterOptions,
  DashboardFilters,
  DashboardKpis,
  FollowUpDTO,
  FunnelStage,
  OwnerWorkloadMetric,
  StaleContactDTO,
} from '../types/dashboard';

const cleanParams = (filters?: DashboardFilters): Record<string, string> => {
  if (!filters) return {};
  const params: Record<string, string> = {};
  if (filters.businessLine && filters.businessLine !== 'ALL' && filters.businessLine !== 'All lines') {
    params.businessLine = filters.businessLine;
  }
  if (filters.ownerId && filters.ownerId !== 'ALL') {
    params.ownerId = filters.ownerId;
  }
  if (filters.tier && filters.tier !== 'ALL') {
    params.tier = filters.tier;
  }
  if (filters.dealSide && filters.dealSide !== 'ALL') {
    params.dealSide = filters.dealSide;
  }
  if (filters.country && filters.country !== 'ALL') {
    params.country = filters.country;
  }
  return params;
};

export const getDashboardKpis = async (filters?: DashboardFilters): Promise<DashboardKpis> => {
  const response = await apiClient.get<DashboardKpis>('/dashboard/kpis', {
    params: cleanParams(filters),
  });
  return response.data;
};

export const getOutreachFunnel = async (filters?: DashboardFilters): Promise<FunnelStage[]> => {
  const response = await apiClient.get<FunnelStage[]>('/dashboard/funnel', {
    params: cleanParams(filters),
  });
  return response.data;
};

export const getFollowUps = async (filters?: DashboardFilters): Promise<FollowUpDTO[]> => {
  const response = await apiClient.get<FollowUpDTO[]>('/dashboard/follow-ups', {
    params: cleanParams(filters),
  });
  return response.data;
};

export const getDashboardCharts = async (filters?: DashboardFilters): Promise<DashboardChartsData> => {
  const response = await apiClient.get<DashboardChartsData>('/dashboard/charts', {
    params: cleanParams(filters),
  });
  return response.data;
};

export const getPriorityContacts = async (filters?: DashboardFilters): Promise<Contact[]> => {
  const response = await apiClient.get<Contact[]>('/dashboard/priority-contacts', {
    params: cleanParams(filters),
  });
  return response.data;
};

export const getRecentAccounts = async (filters?: DashboardFilters): Promise<Account[]> => {
  const response = await apiClient.get<Account[]>('/dashboard/recent-accounts', {
    params: cleanParams(filters),
  });
  return response.data;
};

export const getFilterOptions = async (): Promise<DashboardFilterOptions> => {
  const response = await apiClient.get<DashboardFilterOptions>('/dashboard/filter-options');
  return response.data;
};

export const getStaleContacts = async (filters?: DashboardFilters): Promise<StaleContactDTO[]> => {
  const response = await apiClient.get<StaleContactDTO[]>('/dashboard/stale-contacts', {
    params: cleanParams(filters),
  });
  return response.data;
};

export const getAccountsByCategory = async (
  filters?: DashboardFilters
): Promise<CategoryDistributionMetric[]> => {
  const response = await apiClient.get<CategoryDistributionMetric[]>('/dashboard/accounts-by-category', {
    params: cleanParams(filters),
  });
  return response.data;
};

export const getAccountsPerOwner = async (
  filters?: DashboardFilters
): Promise<OwnerWorkloadMetric[]> => {
  const response = await apiClient.get<OwnerWorkloadMetric[]>('/dashboard/accounts-per-owner', {
    params: cleanParams(filters),
  });
  return response.data;
};
