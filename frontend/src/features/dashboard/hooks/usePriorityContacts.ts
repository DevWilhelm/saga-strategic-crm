import { useQuery } from '@tanstack/react-query';
import { getPriorityContacts } from '../../../api/dashboardApi';
import { useDashboardFilters } from './useDashboardFilters';
import type { Contact } from '../../../types/dashboard';

export const usePriorityContacts = () => {
  const { filters } = useDashboardFilters();

  return useQuery<Contact[], Error>({
    queryKey: ['dashboard', 'priority-contacts', filters],
    queryFn: () => getPriorityContacts(filters),
    staleTime: 60 * 1000,
  });
};
