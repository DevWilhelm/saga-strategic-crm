import type { BusinessLine, Tier, DealSide, AccountStatus } from './account';

export interface Category {
  id: string;
  name: string;
}

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
}

export interface Service {
  id: string;
  name: string;
}

/**
 * Frontend User model:
 * The backend USER table in the database contains sensitive authentication credentials
 * (username and password hash). However, they are NEVER part of any frontend type, mock,
 * form or response.
 *
 * This frontend module strictly requires users in the context of account ownership
 * and audit logging attribution (id, display name, and initials code).
 */
export interface User {
  id: string;
  name: string;
  code: string;
}

export interface AccountLookups {
  businessLines: BusinessLine[];
  categories: Category[];
  subCategories: SubCategory[];
  services: Service[];
  owners: User[];
  tiers: Tier[];
  dealSides: DealSide[];
  countries: string[];
  statuses: AccountStatus[];
}
