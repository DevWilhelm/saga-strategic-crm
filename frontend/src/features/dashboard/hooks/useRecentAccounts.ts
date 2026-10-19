import { useQuery } from '@tanstack/react-query';
import { getRecentAccounts } from '../../../api/dashboardApi';
import { useDashboardFilters } from './useDashboardFilters';
import type { Account } from '../../../types/dashboard';

export const useRecentAccounts = () => {
  const { filters } = useDashboardFilters();

  return useQuery<Account[], Error>({
    queryKey: ['dashboard', 'recent-accounts', filters],
    queryFn: () => getRecentAccounts(filters),
    staleTime: 60 * 1000,
  });
};
