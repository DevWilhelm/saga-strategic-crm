import { useQuery } from '@tanstack/react-query';
import { getDashboardKpis } from '../../../api/dashboardApi';
import { useDashboardFilters } from './useDashboardFilters';
import type { DashboardKpis } from '../../../types/dashboard';

export const useDashboardKpis = () => {
  const { filters } = useDashboardFilters();

  return useQuery<DashboardKpis, Error>({
    queryKey: ['dashboard', 'kpis', filters],
    queryFn: () => getDashboardKpis(filters),
    staleTime: 60 * 1000,
  });
};
