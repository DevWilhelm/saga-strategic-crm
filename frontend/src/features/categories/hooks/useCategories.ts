import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../../../api/categoriesApi';
import { accountKeys } from '../../accounts/hooks/useAccounts';
import type { Option, PageResponse, RecordStatus } from '../../../types/common';
import type { CategoryInput, CategoryListParams, CategoryRecord } from '../../../types/category';

export const categoryKeys = {
  all: ['categories'] as const,
  list: (params: CategoryListParams) => ['categories', 'list', params] as const,
  options: ['categories', 'options'] as const,
};

export const useCategories = (params: CategoryListParams) =>
  useQuery<PageResponse<CategoryRecord>, Error>({
    queryKey: categoryKeys.list(params),
    queryFn: () => categoriesApi.getCategories(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

// Active categories for dropdowns.
export const useCategoryOptions = () =>
  useQuery<Option[], Error>({
    queryKey: categoryKeys.options,
    queryFn: categoriesApi.getCategoryOptions,
    staleTime: 60 * 1000,
  });

// After any change: refresh category lists and options, sub-category lists
// (they show the parent's name) and the Accounts lookups (category dropdowns).
const useInvalidateCategoryData = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['sub-categories'] }),
      queryClient.invalidateQueries({ queryKey: accountKeys.lookups() }),
    ]);
};

export const useSaveCategory = () => {
  const invalidate = useInvalidateCategoryData();
  return useMutation<CategoryRecord, Error, { id?: string; input: CategoryInput }>({
    mutationFn: ({ id, input }) => (id ? categoriesApi.updateCategory(id, input) : categoriesApi.createCategory(input)),
    onSuccess: invalidate,
  });
};

export const useSetCategoryStatus = () => {
  const invalidate = useInvalidateCategoryData();
  return useMutation<CategoryRecord, Error, { id: string; status: RecordStatus }>({
    mutationFn: ({ id, status }) => categoriesApi.updateCategoryStatus(id, status),
    onSuccess: invalidate,
  });
};
