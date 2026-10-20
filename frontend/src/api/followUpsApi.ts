import { apiClient } from './client';
import type { PageResponse } from '../types/common';
import type {
  ContactOption,
  FollowUpCounts,
  FollowUpInput,
  FollowUpListParams,
  FollowUpRecord,
  LogContactInput,
} from '../types/followUp';

export const followUpsApi = {
  // GET /api/follow-ups?q=&state=overdue|today|week|upcoming&ownerId=me|<id>&page=&size=&sort=dueDate,asc
  getFollowUps: async ({ q, state, ownerId, page, size, sort }: FollowUpListParams): Promise<PageResponse<FollowUpRecord>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (q?.trim()) params.set('q', q.trim());
    if (state) params.set('state', state);
    if (ownerId) params.set('ownerId', ownerId);
    if (sort) params.set('sort', `${sort.field},${sort.direction}`);
    const response = await apiClient.get<PageResponse<FollowUpRecord>>('/follow-ups', { params });
    return response.data;
  },

  // GET /api/follow-ups/counts?ownerId= (numbers for the Overdue / Today / This week tabs)
  getFollowUpCounts: async (ownerId?: string): Promise<FollowUpCounts> => {
    const response = await apiClient.get<FollowUpCounts>('/follow-ups/counts', {
      params: ownerId ? { ownerId } : undefined,
    });
    return response.data;
  },

  // POST /api/follow-ups
  createFollowUp: async (payload: FollowUpInput): Promise<FollowUpRecord> => {
    const response = await apiClient.post<FollowUpRecord>('/follow-ups', payload);
    return response.data;
  },

  // PUT /api/follow-ups/:id
  updateFollowUp: async (id: string, payload: FollowUpInput): Promise<FollowUpRecord> => {
    const response = await apiClient.put<FollowUpRecord>(`/follow-ups/${id}`, payload);
    return response.data;
  },

  // POST /api/follow-ups/:id/log-contact (DL-05: record the contact and move to the next due date)
  logContact: async (id: string, payload: LogContactInput): Promise<FollowUpRecord> => {
    const response = await apiClient.post<FollowUpRecord>(`/follow-ups/${id}/log-contact`, payload);
    return response.data;
  },

  // GET /api/contacts/options?q= (open contacts for the follow-up form)
  getContactOptions: async (): Promise<ContactOption[]> => {
    const response = await apiClient.get<ContactOption[]>('/contacts/options');
    return response.data;
  },
};
