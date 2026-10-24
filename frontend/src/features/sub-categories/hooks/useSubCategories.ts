import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subCategoriesApi } from '../../../api/subCategoriesApi';
import { accountKeys } from '../../accounts/hooks/useAccounts';
import type { PageResponse, RecordStatus } from '../../../types/common';
import type { SubCategoryInput, SubCategoryListParams, SubCategoryRecord } from '../../../types/subCategory';

export const subCategoryKeys = {
  all: ['sub-categories'] as const,
  list: (params: SubCategoryListParams) => ['sub-categories', 'list', params] as const,
};

export const useSubCategories = (params: SubCategoryListParams) =>
  useQuery<PageResponse<SubCategoryRecord>, Error>({
    queryKey: subCategoryKeys.list(params),
    queryFn: () => subCategoriesApi.getSubCategories(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

// After any change: refresh sub-category lists and the Accounts lookups
// (the account form's dependent sub-category dropdown).
const useInvalidateSubCategoryData = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: subCategoryKeys.all }),
      queryClient.invalidateQueries({ queryKey: accountKeys.lookups() }),
    ]);
};

export const useSaveSubCategory = () => {
  const invalidate = useInvalidateSubCategoryData();
  return useMutation<SubCategoryRecord, Error, { id?: string; input: SubCategoryInput }>({
    mutationFn: ({ id, input }) =>
      id ? subCategoriesApi.updateSubCategory(id, input) : subCategoriesApi.createSubCategory(input),
    onSuccess: invalidate,
  });
};

export const useSetSubCategoryStatus = () => {
  const invalidate = useInvalidateSubCategoryData();
  return useMutation<SubCategoryRecord, Error, { id: string; status: RecordStatus }>({
    mutationFn: ({ id, status }) => subCategoriesApi.updateSubCategoryStatus(id, status),
    onSuccess: invalidate,
  });
};
