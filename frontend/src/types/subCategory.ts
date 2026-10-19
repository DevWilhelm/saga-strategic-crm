import type { RecordStatus, SortState } from './common';

// A sub-category as the Sub-categories settings page sees it: every ERD field
// filled in, plus the parent's name for lists.
export interface SubCategoryRecord {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  description: string | null;
  status: RecordStatus;
}

export interface SubCategoryInput {
  name: string;
  categoryId: string;
  description: string | null;
  status: RecordStatus;
}

export interface SubCategoryListParams {
  q?: string;
  categoryId?: string;
  status?: RecordStatus;
  page: number; // 0-based
  size: number;
  sort?: SortState;
}

export const SUB_CATEGORY_NAME_MAX = 100;
export const SUB_CATEGORY_DESCRIPTION_MAX = 500;
