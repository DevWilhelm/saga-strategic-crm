import { useQuery } from '@tanstack/react-query';
import { getAccountsByCategory } from '../../../api/dashboardApi';
import { useDashboardFilters } from './useDashboardFilters';
import type { CategoryDistributionMetric } from '../../../types/dashboard';

export const useAccountsByCategory = () => {
  const { filters } = useDashboardFilters();

  return useQuery<CategoryDistributionMetric[], Error>({
    queryKey: ['dashboard', 'accounts-by-category', filters],
    queryFn: () => getAccountsByCategory(filters),
    staleTime: 60 * 1000,
  });
};
