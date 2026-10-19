import type { RecordStatus, SortState } from './common';

// A category as the Categories settings page sees it: every ERD field filled in.
export interface CategoryRecord {
  id: string;
  name: string;
  description: string | null;
  status: RecordStatus;
}

export interface CategoryInput {
  name: string;
  description: string | null;
  status: RecordStatus;
}

export interface CategoryListParams {
  q?: string;
  status?: RecordStatus;
  page: number; // 0-based
  size: number;
  sort?: SortState;
}

export const CATEGORY_NAME_MAX = 100;
export const CATEGORY_DESCRIPTION_MAX = 500;
