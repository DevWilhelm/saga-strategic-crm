import type { RecordStatus, SortState } from './common';

// A service as the Services settings page sees it: every ERD field filled in.
export interface ServiceRecord {
  id: string;
  name: string;
  description: string | null;
  status: RecordStatus;
}

export interface ServiceInput {
  name: string;
  description: string | null;
  status: RecordStatus;
}

export interface ServiceListParams {
  q?: string;
  status?: RecordStatus;
  page: number; // 0-based
  size: number;
  sort?: SortState;
}

export const SERVICE_NAME_MAX = 100;
export const SERVICE_DESCRIPTION_MAX = 500;
