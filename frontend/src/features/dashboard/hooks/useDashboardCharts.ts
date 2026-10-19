import { useQuery } from '@tanstack/react-query';
import { getDashboardCharts } from '../../../api/dashboardApi';
import { useDashboardFilters } from './useDashboardFilters';
import type { DashboardChartsData } from '../../../types/dashboard';

export const useDashboardCharts = () => {
  const { filters } = useDashboardFilters();

  return useQuery<DashboardChartsData, Error>({
    queryKey: ['dashboard', 'charts', filters],
    queryFn: () => getDashboardCharts(filters),
    staleTime: 60 * 1000,
  });
};
