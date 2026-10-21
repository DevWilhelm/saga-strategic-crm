import { apiClient } from './client';
import type {
  Contact,
  ContactDetail,
  ContactFilterParams,
  PaginatedContactsResponse,
  CreateContactDTO,
  UpdateContactDTO,
  FollowUp,
  CreateFollowUpDTO,
  UpdateFollowUpDTO,
  MarkFollowUpDoneDTO,
} from '../types/contact';

export interface ContactImportPayload {
  mode: 'VALIDATE_ONLY' | 'COMMIT';
  contacts: CreateContactDTO[];
  duplicatePolicy?: 'SKIP' | 'ALLOW';
}

export interface ContactImportResponse {
  mode: 'VALIDATE_ONLY' | 'COMMIT';
  totalProcessed: number;
  createdCount: number;
  skippedCount: number;
  failedCount: number;
  errors: Array<{ row: number; column?: string; message: string; data?: Record<string, unknown> }>;
}

export const contactsApi = {
  // 1. GET /api/contacts (Paginated, filtered, sorted)
  getContacts: async (filters: ContactFilterParams = {}): Promise<PaginatedContactsResponse> => {
    const params = new URLSearchParams();

    if (filters.q) params.set('q', filters.q);
    if (filters.companyId) params.set('companyId', filters.companyId);
    if (filters.tier) params.set('tier', filters.tier);
    if (filters.relationshipStatus) params.set('relationshipStatus', filters.relationshipStatus);
    if (filters.status) params.set('status', filters.status);
    if (filters.ownerId) params.set('ownerId', filters.ownerId);
    if (filters.closed && filters.closed !== 'ALL') params.set('closed', filters.closed);
    if (filters.followUp && filters.followUp !== 'ALL') params.set('followUp', filters.followUp);
    if (filters.page !== undefined) params.set('page', String(filters.page));
    if (filters.size !== undefined) params.set('size', String(filters.size));
    if (filters.sort) params.set('sort', filters.sort);

    const response = await apiClient.get<PaginatedContactsResponse>('/contacts', { params });
    return response.data;
  },

  // 2. GET /api/contacts/:id
  getContactById: async (id: string): Promise<ContactDetail> => {
    const response = await apiClient.get<ContactDetail>(`/contacts/${id}`);
    return response.data;
  },

  // 3. POST /api/contacts
  createContact: async (payload: CreateContactDTO): Promise<Contact> => {
    const response = await apiClient.post<Contact>('/contacts', payload);
    return response.data;
  },

  // 4. PUT /api/contacts/:id
  updateContact: async (id: string, payload: UpdateContactDTO): Promise<Contact> => {
    const response = await apiClient.put<Contact>(`/contacts/${id}`, payload);
    return response.data;
  },

  // 5. PATCH /api/contacts/:id/closed
  toggleContactClosed: async (id: string, isClosed: boolean): Promise<Contact> => {
    const response = await apiClient.patch<Contact>(`/contacts/${id}/closed`, { isClosed });
    return response.data;
  },

  // 6. DELETE /api/contacts/:id
  deleteContact: async (id: string): Promise<void> => {
    await apiClient.delete(`/contacts/${id}`);
  },

  // 7. GET /api/contacts/:id/follow-ups
  getContactFollowUps: async (contactId: string): Promise<FollowUp[]> => {
    const response = await apiClient.get<FollowUp[]>(`/contacts/${contactId}/follow-ups`);
    return response.data;
  },

  // 8. POST /api/contacts/:id/follow-ups
  createFollowUp: async (contactId: string, payload: CreateFollowUpDTO): Promise<FollowUp> => {
    const response = await apiClient.post<FollowUp>(`/contacts/${contactId}/follow-ups`, payload);
    return response.data;
  },

  // 9. PUT /api/follow-ups/:id
  updateFollowUp: async (id: string, payload: UpdateFollowUpDTO): Promise<FollowUp> => {
    const response = await apiClient.put<FollowUp>(`/follow-ups/${id}`, payload);
    return response.data;
  },

  // 10. DELETE /api/follow-ups/:id
  deleteFollowUp: async (id: string): Promise<void> => {
    await apiClient.delete(`/follow-ups/${id}`);
  },

  // 11. PATCH /api/follow-ups/:id/done
  markFollowUpDone: async (id: string, payload: MarkFollowUpDoneDTO): Promise<FollowUp> => {
    const response = await apiClient.patch<FollowUp>(`/follow-ups/${id}/done`, payload);
    return response.data;
  },

  // 12. POST /api/contacts/import
  importContacts: async (payload: ContactImportPayload): Promise<ContactImportResponse> => {
    const response = await apiClient.post<ContactImportResponse>('/contacts/import', payload);
    return response.data;
  },
};
