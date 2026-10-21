import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi } from '../../../api/contactsApi';
import type {
  ContactFilterParams,
  PaginatedContactsResponse,
  ContactDetail,
  Contact,
  CreateContactDTO,
  UpdateContactDTO,
  FollowUp,
  CreateFollowUpDTO,
  UpdateFollowUpDTO,
  MarkFollowUpDoneDTO,
} from '../../../types/contact';

export const useContacts = (params: ContactFilterParams = {}) => {
  return useQuery<PaginatedContactsResponse, Error>({
    queryKey: ['contacts', params],
    queryFn: () => contactsApi.getContacts(params),
  });
};

export const useContact = (id?: string) => {
  return useQuery<ContactDetail, Error>({
    queryKey: ['contacts', 'detail', id],
    queryFn: () => contactsApi.getContactById(id!),
    enabled: Boolean(id),
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();
  return useMutation<Contact, Error, CreateContactDTO>({
    mutationFn: (dto) => contactsApi.createContact(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  return useMutation<Contact, Error, { id: string; data: UpdateContactDTO }>({
    mutationFn: ({ id, data }) => contactsApi.updateContact(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', 'detail', updated.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useToggleContactClosed = () => {
  const queryClient = useQueryClient();
  return useMutation<Contact, Error, { id: string; isClosed: boolean }>({
    mutationFn: ({ id, isClosed }) => contactsApi.toggleContactClosed(id, isClosed),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', 'detail', updated.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => contactsApi.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useContactFollowUps = (contactId?: string) => {
  return useQuery<FollowUp[], Error>({
    queryKey: ['follow-ups', contactId],
    queryFn: () => contactsApi.getContactFollowUps(contactId!),
    enabled: Boolean(contactId),
  });
};

export const useCreateFollowUp = (contactId?: string) => {
  const queryClient = useQueryClient();
  return useMutation<FollowUp, Error, CreateFollowUpDTO>({
    mutationFn: (dto) => contactsApi.createFollowUp(contactId!, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', 'detail', contactId] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useUpdateFollowUp = (contactId?: string) => {
  const queryClient = useQueryClient();
  return useMutation<FollowUp, Error, { id: string; data: UpdateFollowUpDTO }>({
    mutationFn: ({ id, data }) => contactsApi.updateFollowUp(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', 'detail', contactId] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useDeleteFollowUp = (contactId?: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => contactsApi.deleteFollowUp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', 'detail', contactId] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useMarkFollowUpDone = (contactId?: string) => {
  const queryClient = useQueryClient();
  return useMutation<FollowUp, Error, { id: string; data: MarkFollowUpDoneDTO }>({
    mutationFn: ({ id, data }) => contactsApi.markFollowUpDone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', 'detail', contactId] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};
