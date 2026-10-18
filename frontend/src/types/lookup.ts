import type { BusinessLine, Tier, DealSide, AccountStatus } from './account';
import type { UserOption } from './user';

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

// Re-export UserOption as User for backward compatibility with account lookups
export type User = UserOption;

export interface AccountLookups {
  businessLines: BusinessLine[];
  categories: Category[];
  subCategories: SubCategory[];
  services: Service[];
  owners: UserOption[];
  tiers: Tier[];
  dealSides: DealSide[];
  countries: string[];
  statuses: AccountStatus[];
}
