import { useQuery } from '@tanstack/react-query';
import { getOutreachFunnel } from '../../../api/dashboardApi';
import { useDashboardFilters } from './useDashboardFilters';
import type { FunnelStage } from '../../../types/dashboard';

export const useOutreachFunnel = () => {
  const { filters } = useDashboardFilters();

  return useQuery<FunnelStage[], Error>({
    queryKey: ['dashboard', 'funnel', filters],
    queryFn: () => getOutreachFunnel(filters),
    staleTime: 60 * 1000,
  });
};
