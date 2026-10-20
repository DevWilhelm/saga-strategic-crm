import { apiClient } from './client';
import type { Option, PageResponse, RecordStatus } from '../types/common';
import type { ServiceInput, ServiceListParams, ServiceRecord } from '../types/service';

export const servicesApi = {
  // GET /api/services (paginated, for the Services settings page)
  getServices: async ({ q, status, page, size, sort }: ServiceListParams): Promise<PageResponse<ServiceRecord>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (q?.trim()) params.set('q', q.trim());
    if (status) params.set('status', status);
    if (sort) params.set('sort', `${sort.field},${sort.direction}`);
    const response = await apiClient.get<PageResponse<ServiceRecord>>('/services', { params });
    return response.data;
  },

  // GET /api/services/options (active services for dropdowns)
  getServiceOptions: async (): Promise<Option[]> => {
    const response = await apiClient.get<Option[]>('/services/options');
    return response.data;
  },

  // POST /api/services (lookup.manage)
  createService: async (payload: ServiceInput): Promise<ServiceRecord> => {
    const response = await apiClient.post<ServiceRecord>('/services', payload);
    return response.data;
  },

  // PUT /api/services/:id (lookup.manage)
  updateService: async (id: string, payload: ServiceInput): Promise<ServiceRecord> => {
    const response = await apiClient.put<ServiceRecord>(`/services/${id}`, payload);
    return response.data;
  },

  // PATCH /api/services/:id/status (lookup.manage)
  updateServiceStatus: async (id: string, status: RecordStatus): Promise<ServiceRecord> => {
    const response = await apiClient.patch<ServiceRecord>(`/services/${id}/status`, { status });
    return response.data;
  },
};
