export type BusinessLine = 'Healthcare' | 'Financial Advisory' | 'Networking & Partnerships';

export type Tier = 'TIER_1' | 'TIER_2' | 'TIER_3';

export type DealSide = 'BUY_SIDE' | 'SELL_SIDE';

// TODO: Status values are TBD pending backend confirmation
export const ACCOUNT_STATUS_OPTIONS = ['ACTIVE', 'INACTIVE'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUS_OPTIONS)[number];

export interface Account {
  id: string;
  name: string;
  businessLine: BusinessLine;
  country: string;
  websiteUrl?: string | null;
  categoryId: string;
  subCategoryId?: string | null;
  tier: Tier;
  ownerId: string;
  status: AccountStatus;
  dealSide?: DealSide | null;
  serviceId: string;
  sourceRef?: string | null;
  note?: string | null;
  createdBy: string;
  createdDate: string; // YYYY-MM-DD
  updatedBy: string;
  updatedDate: string; // YYYY-MM-DD
}

export interface AccountListItem {
  id: string;
  name: string;
  businessLine: BusinessLine;
  categoryName: string;
  subCategoryName?: string | null;
  tier: Tier;
  dealSide?: DealSide | null;
  ownerId: string;
  ownerName: string;
  country: string;
  status: AccountStatus;
  nextFollowUpDate: string | null; // earliest upcoming follow-up of its contacts, may be null
  updatedDate: string; // YYYY-MM-DD
}

export interface NextActionInfo {
  action: string;
  dueDate: string;
  contactName: string;
}

export interface AccountDetail extends Account {
  categoryName: string;
  subCategoryName?: string | null;
  serviceName: string;
  ownerName: string;
  createdByName: string;
  updatedByName: string;
  contactCount: number;
  noteCount: number;
  dealCount: number;
  nextAction: NextActionInfo | null;
}

export interface AccountFilters {
  q?: string;
  businessLine?: string;
  categoryId?: string;
  subCategoryId?: string;
  serviceId?: string;
  tier?: string;
  dealSide?: string;
  ownerId?: string;
  country?: string;
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface PaginatedAccountsResponse {
  content: AccountListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CreateAccountDTO {
  name: string;
  businessLine: BusinessLine;
  country?: string | null;
  websiteUrl?: string | null;
  categoryId: string;
  subCategoryId?: string | null;
  tier: Tier;
  ownerId: string;
  status?: AccountStatus;
  dealSide?: DealSide | null;
  serviceId: string;
  sourceRef?: string | null;
  note?: string | null;
}

export type UpdateAccountDTO = Partial<CreateAccountDTO>;

// TODO: AccountNote pending data model
export interface AccountNote {
  id: string;
  accountId: string;
  authorName: string;
  createdDate: string; // YYYY-MM-DD
  text: string;
}

// TODO: AccountDeal pending data model
export interface AccountDeal {
  id: string;
  accountId: string;
  name: string;
  stage: string;
  value: number;
}

export interface FieldValidationError {
  field: string;
  message: string;
}

export interface ApiValidationError {
  status: number;
  error: string;
  message: string;
  errors: FieldValidationError[];
}

// ---------------------------------------------------------------------------
// Account Import Types
// ---------------------------------------------------------------------------
export type ImportMode = 'VALIDATE' | 'COMMIT';
export type DuplicatePolicy = 'SKIP' | 'ALLOW';
export type ImportRowResultStatus = 'VALID' | 'CREATED' | 'SKIPPED' | 'ERROR';

export interface AccountImportRowPayload {
  rowNumber: number;
  name: string;
  businessLine: BusinessLine;
  categoryId: string;
  subCategoryId?: string | null;
  serviceId: string;
  tier: Tier;
  ownerId: string;
  dealSide?: DealSide | null;
  country?: string | null;
  websiteUrl?: string | null;
  sourceRef?: string | null;
  note?: string | null;
  status?: AccountStatus;
}

export interface AccountImportPayload {
  mode: ImportMode;
  duplicatePolicy: DuplicatePolicy;
  rows: AccountImportRowPayload[];
}

export interface AccountImportRowResult {
  rowNumber: number;
  status: ImportRowResultStatus;
  accountId?: string;
  errors?: FieldValidationError[];
}

export interface AccountImportResponse {
  total: number;
  created: number;
  skipped: number;
  failed: number;
  results: AccountImportRowResult[];
}

