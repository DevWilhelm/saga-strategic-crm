// Shared list and status shapes for configuration screens.

export type RecordStatus = 'ACTIVE' | 'INACTIVE';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: string;
  direction: SortDirection;
}

// What DataTable shows in its footer (1-based page for display).
export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
}

// Spring Data page, as returned by the backend and the users mock
// (same shape as PaginatedUsersResponse). `page` is 0-based.
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const toPageMeta = (page: PageResponse<unknown>): PageMeta => ({
  page: page.page + 1,
  pageSize: page.size,
  total: page.totalElements,
});

export interface Option {
  id: string;
  name: string;
}
