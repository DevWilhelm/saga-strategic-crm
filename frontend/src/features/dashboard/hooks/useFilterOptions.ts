import { useQuery } from '@tanstack/react-query';
import { getFilterOptions } from '../../../api/dashboardApi';
import type { DashboardFilterOptions } from '../../../types/dashboard';

export const useFilterOptions = () => {
  return useQuery<DashboardFilterOptions, Error>({
    queryKey: ['dashboard', 'filter-options'],
    queryFn: getFilterOptions,
    staleTime: 5 * 60 * 1000,
  });
};
