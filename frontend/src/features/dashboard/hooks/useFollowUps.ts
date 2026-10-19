import { useQuery } from '@tanstack/react-query';
import { getFollowUps } from '../../../api/dashboardApi';
import { useDashboardFilters } from './useDashboardFilters';
import type { FollowUpDTO } from '../../../types/dashboard';

export const useFollowUps = () => {
  const { filters } = useDashboardFilters();

  return useQuery<FollowUpDTO[], Error>({
    queryKey: ['dashboard', 'follow-ups', filters],
    queryFn: () => getFollowUps(filters),
    staleTime: 60 * 1000,
  });
};
