import { useQuery } from '@tanstack/react-query';
import { getAccountsPerOwner } from '../../../api/dashboardApi';
import { useDashboardFilters } from './useDashboardFilters';
import type { OwnerWorkloadMetric } from '../../../types/dashboard';

export const useAccountsPerOwner = () => {
  const { filters } = useDashboardFilters();

  return useQuery<OwnerWorkloadMetric[], Error>({
    queryKey: ['dashboard', 'accounts-per-owner', filters],
    queryFn: () => getAccountsPerOwner(filters),
    staleTime: 60 * 1000,
  });
};
