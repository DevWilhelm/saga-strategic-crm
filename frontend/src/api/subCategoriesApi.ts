import { apiClient } from './client';
import type { Option, PageResponse, RecordStatus } from '../types/common';
import type { SubCategoryInput, SubCategoryListParams, SubCategoryRecord } from '../types/subCategory';

export const subCategoriesApi = {
  // GET /api/sub-categories (paginated, for the Sub-categories settings page)
  getSubCategories: async ({
    q,
    categoryId,
    status,
    page,
    size,
    sort,
  }: SubCategoryListParams): Promise<PageResponse<SubCategoryRecord>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (q?.trim()) params.set('q', q.trim());
    if (categoryId) params.set('categoryId', categoryId);
    if (status) params.set('status', status);
    if (sort) params.set('sort', `${sort.field},${sort.direction}`);
    const response = await apiClient.get<PageResponse<SubCategoryRecord>>('/sub-categories', { params });
    return response.data;
  },

  // GET /api/sub-categories/options?categoryId= (active sub-categories of one category)
  getSubCategoryOptions: async (categoryId: string): Promise<Option[]> => {
    const response = await apiClient.get<Option[]>('/sub-categories/options', { params: { categoryId } });
    return response.data;
  },

  // POST /api/sub-categories (lookup.manage)
  createSubCategory: async (payload: SubCategoryInput): Promise<SubCategoryRecord> => {
    const response = await apiClient.post<SubCategoryRecord>('/sub-categories', payload);
    return response.data;
  },

  // PUT /api/sub-categories/:id (lookup.manage)
  updateSubCategory: async (id: string, payload: SubCategoryInput): Promise<SubCategoryRecord> => {
    const response = await apiClient.put<SubCategoryRecord>(`/sub-categories/${id}`, payload);
    return response.data;
  },

  // PATCH /api/sub-categories/:id/status (lookup.manage)
  updateSubCategoryStatus: async (id: string, status: RecordStatus): Promise<SubCategoryRecord> => {
    const response = await apiClient.patch<SubCategoryRecord>(`/sub-categories/${id}/status`, { status });
    return response.data;
  },
};
