import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { followUpsApi } from '../../../api/followUpsApi';
import { accountKeys } from '../../accounts/hooks/useAccounts';
import type { PageResponse } from '../../../types/common';
import type {
  ContactOption,
  FollowUpCounts,
  FollowUpInput,
  FollowUpListParams,
  FollowUpRecord,
  LogContactInput,
} from '../../../types/followUp';

export const followUpKeys = {
  all: ['follow-ups'] as const,
  list: (params: FollowUpListParams) => ['follow-ups', 'list', params] as const,
  counts: (ownerId?: string) => ['follow-ups', 'counts', ownerId ?? 'everyone'] as const,
  contactOptions: ['follow-ups', 'contact-options'] as const,
};

export const useFollowUps = (params: FollowUpListParams) =>
  useQuery<PageResponse<FollowUpRecord>, Error>({
    queryKey: followUpKeys.list(params),
    queryFn: () => followUpsApi.getFollowUps(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

export const useFollowUpCounts = (ownerId?: string) =>
  useQuery<FollowUpCounts, Error>({
    queryKey: followUpKeys.counts(ownerId),
    queryFn: () => followUpsApi.getFollowUpCounts(ownerId),
    staleTime: 30 * 1000,
  });

export const useContactOptions = () =>
  useQuery<ContactOption[], Error>({
    queryKey: followUpKeys.contactOptions,
    queryFn: followUpsApi.getContactOptions,
    staleTime: 60 * 1000,
  });

// After any change: refresh follow-up lists and counts, and the Accounts pages
// (next follow-up date in the list, "Next action" on the detail page).
const useInvalidateFollowUpData = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: followUpKeys.all }),
      queryClient.invalidateQueries({ queryKey: accountKeys.all }),
    ]);
};

export const useSaveFollowUp = () => {
  const invalidate = useInvalidateFollowUpData();
  return useMutation<FollowUpRecord, Error, { id?: string; input: FollowUpInput }>({
    mutationFn: ({ id, input }) => (id ? followUpsApi.updateFollowUp(id, input) : followUpsApi.createFollowUp(input)),
    onSuccess: invalidate,
  });
};

export const useLogContact = () => {
  const invalidate = useInvalidateFollowUpData();
  return useMutation<FollowUpRecord, Error, { id: string; input: LogContactInput }>({
    mutationFn: ({ id, input }) => followUpsApi.logContact(id, input),
    onSuccess: invalidate,
  });
};
