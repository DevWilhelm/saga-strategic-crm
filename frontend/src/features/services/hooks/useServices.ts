import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../../../api/servicesApi';
import { accountKeys } from '../../accounts/hooks/useAccounts';
import type { Option, PageResponse, RecordStatus } from '../../../types/common';
import type { ServiceInput, ServiceListParams, ServiceRecord } from '../../../types/service';

export const serviceKeys = {
  all: ['services'] as const,
  list: (params: ServiceListParams) => ['services', 'list', params] as const,
  options: ['services', 'options'] as const,
};

export const useServices = (params: ServiceListParams) =>
  useQuery<PageResponse<ServiceRecord>, Error>({
    queryKey: serviceKeys.list(params),
    queryFn: () => servicesApi.getServices(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

// Active services for dropdowns.
export const useServiceOptions = () =>
  useQuery<Option[], Error>({
    queryKey: serviceKeys.options,
    queryFn: servicesApi.getServiceOptions,
    staleTime: 60 * 1000,
  });

// After any change: refresh service lists and options, and the Accounts
// lookups (the account form's Service dropdown).
const useInvalidateServiceData = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: serviceKeys.all }),
      queryClient.invalidateQueries({ queryKey: accountKeys.lookups() }),
    ]);
};

export const useSaveService = () => {
  const invalidate = useInvalidateServiceData();
  return useMutation<ServiceRecord, Error, { id?: string; input: ServiceInput }>({
    mutationFn: ({ id, input }) => (id ? servicesApi.updateService(id, input) : servicesApi.createService(input)),
    onSuccess: invalidate,
  });
};

export const useSetServiceStatus = () => {
  const invalidate = useInvalidateServiceData();
  return useMutation<ServiceRecord, Error, { id: string; status: RecordStatus }>({
    mutationFn: ({ id, status }) => servicesApi.updateServiceStatus(id, status),
    onSuccess: invalidate,
  });
};
