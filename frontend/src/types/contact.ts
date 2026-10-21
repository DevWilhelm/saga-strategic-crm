/**
 * Contact Status definition.
 * Marked as TBD in the ER diagram. Defined here as a single constant and union
 * so it can be updated in one place across the application.
 */
export const CONTACT_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_TIERS = ['TIER_1', 'TIER_2', 'TIER_3'] as const;
export type ContactTier = (typeof CONTACT_TIERS)[number];

export const RELATIONSHIP_STATUSES = ['HOT', 'WARM', 'COLD'] as const;
export type RelationshipStatus = (typeof RELATIONSHIP_STATUSES)[number];

export const FOLLOW_UP_SCHEDULE_FILTERS = [
  'ALL',
  'OVERDUE',
  'DUE_THIS_WEEK',
  'NONE_SCHEDULED',
] as const;
export type FollowUpScheduleFilter = (typeof FOLLOW_UP_SCHEDULE_FILTERS)[number];

export const CLOSED_STATE_FILTERS = ['ALL', 'OPEN', 'CLOSED'] as const;
export type ClosedStateFilter = (typeof CLOSED_STATE_FILTERS)[number];

/**
 * Core Contact Entity (table CONTACT in ER diagram)
 */
export interface Contact {
  id: string; // UUID
  name: string; // max 100
  companyId: string; // FK to Account, required
  companyName?: string; // Denormalized account name for displays
  targetRole: string | null;
  personaCategory: string | null;
  roleKeyword: string | null;
  tier: ContactTier;
  linkedinSearchName: string | null;
  linkedinProfileUrl: string | null;
  email: string | null;
  phoneNo: string | null;
  targetAngle: string | null; // max 1000
  status: ContactStatus;
  nextStep: string | null; // max 1000
  ownerId: string; // FK to User, required
  ownerName?: string;
  ownerCode?: string;
  ownerManagerId?: string | null;
  note: string | null; // max 1000
  relationshipStatus: RelationshipStatus;
  isClosed: boolean;
  remark: string | null; // max 1000
  createdBy: string;
  createdByName?: string;
  createdDate: string; // YYYY-MM-DD
  updatedBy: string;
  updatedByName?: string;
  updatedDate: string; // YYYY-MM-DD
  nextFollowUpDate: string | null; // Computed: earliest upcoming follow-up due date
  lastContactedDate?: string | null;
  followUpCount?: number;
}

/**
 * Contact List Item interface for paginated table
 */
export type ContactListItem = Contact;

/**
 * Contact Detail with related follow-up objects
 */
export interface ContactDetail extends Contact {
  followUps?: FollowUp[];
}

/**
 * Core FollowUp Entity (table FOLLOW_UP in ER diagram)
 */
export interface FollowUp {
  id: string; // UUID
  contactId: string; // FK to Contact, required
  lastContactedDate: string | null; // YYYY-MM-DD
  period: number | null; // in days
  dueDate: string; // YYYY-MM-DD, required
  descriptionRemark: string | null; // max 1000
  ownerId: string; // FK to User, required
  ownerName?: string;
  action: string; // required
  isDone: boolean;
  doneDate: string | null; // YYYY-MM-DD
  resultNote: string | null;
  createdDate?: string;
  updatedDate?: string;
}

/**
 * Request DTOs
 */
export interface CreateContactDTO {
  name: string;
  companyId: string;
  targetRole?: string | null;
  personaCategory?: string | null;
  roleKeyword?: string | null;
  tier: ContactTier;
  linkedinSearchName?: string | null;
  linkedinProfileUrl?: string | null;
  email?: string | null;
  phoneNo?: string | null;
  targetAngle?: string | null;
  status?: ContactStatus;
  nextStep?: string | null;
  ownerId: string;
  note?: string | null;
  relationshipStatus: RelationshipStatus;
  isClosed?: boolean;
  remark?: string | null;
}

export type UpdateContactDTO = Partial<CreateContactDTO>;

export interface UpdateContactClosedDTO {
  isClosed: boolean;
}

export interface CreateFollowUpDTO {
  contactId?: string;
  lastContactedDate?: string | null;
  period?: number | null;
  dueDate: string;
  descriptionRemark?: string | null;
  ownerId: string;
  action: string;
}

export type UpdateFollowUpDTO = Partial<CreateFollowUpDTO>;

export interface MarkFollowUpDoneDTO {
  resultNote: string;
  scheduleNext?: {
    dueDate: string;
    action: string;
    period?: number | null;
    descriptionRemark?: string | null;
    ownerId?: string;
  };
}

/**
 * Query Parameters for Contact List
 */
export interface ContactFilterParams {
  q?: string;
  companyId?: string;
  tier?: ContactTier;
  relationshipStatus?: RelationshipStatus;
  status?: ContactStatus;
  ownerId?: string;
  closed?: ClosedStateFilter;
  followUp?: FollowUpScheduleFilter;
  page?: number;
  size?: number;
  sort?: string; // field,asc or field,desc
}

export interface PaginatedContactsResponse {
  content: ContactListItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // 0-based page index
}

/**
 * Backward compatibility with existing AccountContactsTab
 */
export type AccountContact = Contact;
export type AccountFollowUp = FollowUp;
