import { useQuery } from '@tanstack/react-query';
import { getStaleContacts } from '../../../api/dashboardApi';
import { useDashboardFilters } from './useDashboardFilters';
import type { StaleContactDTO } from '../../../types/dashboard';

export const useStaleContacts = () => {
  const { filters } = useDashboardFilters();

  return useQuery<StaleContactDTO[], Error>({
    queryKey: ['dashboard', 'stale-contacts', filters],
    queryFn: () => getStaleContacts(filters),
    staleTime: 60 * 1000,
  });
};
