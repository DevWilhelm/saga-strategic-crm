export type AccountTier = 'TIER_1' | 'TIER_2' | 'TIER_3' | string;
export type DealSide = 'BUY_SIDE' | 'SELL_SIDE' | string;
export type RelationshipStatus = 'HOT' | 'WARM' | 'COLD' | string;
export type FollowUpCategory = 'OVERDUE' | 'TODAY' | 'THIS_WEEK';

export interface Account {
  id: string;
  name: string;
  country: string;
  tier: AccountTier;
  deal_side: DealSide;
  owner_id: string;
  owner_name?: string;
  category: string;
  updated_at?: string;
}

export interface Contact {
  id: string;
  name: string;
  company_id: string;
  tier: AccountTier;
  relationship_status: RelationshipStatus;
  next_step: string;
  is_closed: boolean;
  title?: string;
  email?: string;
  company_name?: string;
}

export interface FollowUp {
  id: string;
  contact_id: string;
  last_contacted_date: string;
  due_date: string;
  action: string;
  owner_id: string;
}

export interface FollowUpDTO {
  id: string;
  contact_id: string;
  contact_name: string;
  company_id: string;
  company_name: string;
  action: string;
  due_date: string;
  last_contacted_date: string;
  owner_id: string;
  status_category: FollowUpCategory;
}

export interface DashboardFilters {
  businessLine?: string;
  ownerId?: string;
  tier?: string;
  dealSide?: string;
  country?: string;
}

export interface DashboardKpis {
  totalAccounts: number;
  peopleNamed: number;
  meetings: number;
  overdueCount: number;
}

export interface FunnelStage {
  stage: 'TO_CONTACT' | 'CONNECTED' | 'MESSAGED' | 'MEETINGS' | string;
  label: string;
  count: number;
  percentage: number;
}

export interface RelationshipTemperatureMetric {
  status: 'HOT' | 'WARM' | 'COLD' | string;
  count: number;
}

export interface TierDistributionMetric {
  tier: string;
  count: number;
}

export interface DealSideDistributionMetric {
  dealSide: string;
  count: number;
}

export interface DashboardChartsData {
  relationshipTemperature: RelationshipTemperatureMetric[];
  accountsByTier: TierDistributionMetric[];
  dealSideDistribution: DealSideDistributionMetric[];
}

export interface OwnerOption {
  id: string;
  name: string;
}

export interface DashboardFilterOptions {
  businessLines: string[];
  owners: OwnerOption[];
  tiers: string[];
  dealSides: string[];
  countries: string[];
}

export interface StaleContactDTO {
  id: string;
  name: string;
  company_id: string;
  company_name: string;
  last_contacted_date: string | null;
  days_since_contact: number;
  reason: 'NO_FOLLOW_UP' | 'OVER_30_DAYS';
}

export interface CategoryDistributionMetric {
  category: string;
  count: number;
}

export interface OwnerWorkloadMetric {
  owner_id: string;
  owner_name: string;
  account_count: number;
  overdue_count: number;
}
