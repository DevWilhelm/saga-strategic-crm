import type { BusinessLine, Tier, DealSide, AccountStatus } from './account';
import type { UserOption } from './user';
import type { RecordStatus } from './common';

// ERD: CATEGORY (id, name, description, status). description and status are
// optional here because account lookups only need id and name; records without
// a status are treated as ACTIVE.
export interface Category {
  id: string;
  name: string;
  description?: string | null;
  status?: RecordStatus;
}

// ERD: SUB_CATEGORY (id, name, category_id, description, status)
export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  status?: RecordStatus;
}

// ERD: SERVICE (id, name, description, status); optional here for the same
// reason as Category.
export interface Service {
  id: string;
  name: string;
  description?: string | null;
  status?: RecordStatus;
}

export interface OwnerOption extends UserOption {
  username?: string;
}

// Re-export UserOption as User for backward compatibility with account lookups
export type User = OwnerOption;

export interface AccountLookups {
  businessLines: BusinessLine[];
  categories: Category[];
  subCategories: SubCategory[];
  services: Service[];
  owners: OwnerOption[];
  tiers: Tier[];
  dealSides: DealSide[];
  countries: string[];
  statuses: AccountStatus[];
}
