import { apiClient } from './client';
import type { Option, PageResponse } from '../types/common';
import type { CategoryInput, CategoryListParams, CategoryRecord } from '../types/category';

export const categoriesApi = {
  // GET /api/categories (paginated, for the Categories settings page)
  getCategories: async ({ q, status, page, size, sort }: CategoryListParams): Promise<PageResponse<CategoryRecord>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (q?.trim()) params.set('q', q.trim());
    if (status) params.set('status', status);
    if (sort) params.set('sort', `${sort.field},${sort.direction}`);
    const response = await apiClient.get<PageResponse<CategoryRecord>>('/categories', { params });
    return response.data;
  },

  // GET /api/categories/options (active categories for dropdowns)
  getCategoryOptions: async (): Promise<Option[]> => {
    const response = await apiClient.get<Option[]>('/categories/options');
    return response.data;
  },

  // POST /api/categories (lookup.manage)
  createCategory: async (payload: CategoryInput): Promise<CategoryRecord> => {
    const response = await apiClient.post<CategoryRecord>('/categories', payload);
    return response.data;
  },

  // PUT /api/categories/:id (lookup.manage)
  updateCategory: async (id: string, payload: CategoryInput): Promise<CategoryRecord> => {
    const response = await apiClient.put<CategoryRecord>(`/categories/${id}`, payload);
    return response.data;
  },

  // PATCH /api/categories/:id/status (lookup.manage)
  updateCategoryStatus: async (id: string, status: CategoryInput['status']): Promise<CategoryRecord> => {
    const response = await apiClient.patch<CategoryRecord>(`/categories/${id}/status`, { status });
    return response.data;
  },
};
