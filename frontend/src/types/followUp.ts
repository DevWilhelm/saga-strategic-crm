import type { SortState } from './common';

// Where a follow-up's due date falls, relative to today.
export type FollowUpState = 'overdue' | 'today' | 'week' | 'upcoming';

// A follow-up as the Follow-ups page sees it: ERD fields plus names for display.
export interface FollowUpRecord {
  id: string;
  contactId: string;
  contactName: string;
  companyId: string | null;
  companyName: string | null;
  ownerId: string;
  ownerName: string;
  action: string;
  dueDate: string; // YYYY-MM-DD
  lastContactedDate: string | null;
  period: number | null;
  descriptionRemark: string | null;
  state: FollowUpState;
}

export interface FollowUpInput {
  contactId: string;
  ownerId: string;
  action: string;
  dueDate: string;
  lastContactedDate: string | null;
  period: number | null;
  descriptionRemark: string | null;
}

// DL-05: a follow-up is "done" by logging the contact, which moves it to the
// next due date instead of closing it (the ERD has no status column).
export interface LogContactInput {
  contactedDate: string;
  nextDueDate: string;
}

export interface FollowUpListParams {
  q?: string;
  state?: FollowUpState;
  ownerId?: string; // 'me' or a user id; omitted for everyone
  page: number; // 0-based
  size: number;
  sort?: SortState;
}

export type FollowUpCounts = Record<FollowUpState | 'all', number>;

export interface ContactOption {
  id: string;
  name: string;
  companyName: string | null;
}

export const FOLLOW_UP_ACTION_MAX = 200;
export const FOLLOW_UP_REMARK_MAX = 1000;
export const FOLLOW_UP_PERIOD_MAX = 365;
