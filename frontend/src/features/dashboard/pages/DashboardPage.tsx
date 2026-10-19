import React from 'react';
import { DashboardFilters } from '../components/DashboardFilters';
import { KpiGrid } from '../components/KpiGrid';
import { OutreachFunnel } from '../components/OutreachFunnel';
import { FollowUpsPanel } from '../components/FollowUpsPanel';
import { RelationshipChart } from '../components/RelationshipChart';
import { AccountsByTierChart } from '../components/AccountsByTierChart';
import { DealSideChart } from '../components/DealSideChart';
import { PriorityContactsTable } from '../components/PriorityContactsTable';
import { RecentAccountsTable } from '../components/RecentAccountsTable';
import { StaleContactsWidget } from '../components/StaleContactsWidget';
import { AccountsByCategoryChart } from '../components/AccountsByCategoryChart';
import { AccountsPerOwnerWidget } from '../components/AccountsPerOwnerWidget';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import { Activity } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { filters } = useDashboardFilters();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
            Executive Dashboard
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--text-secondary)]">
            High-level SAGASIA Strategic metrics, outreach velocity, and immediate action items
          </p>
        </div>

        {/* Status / Active Business Line Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--link)] shadow-xs">
            <Activity className="h-3.5 w-3.5" />
            <span>Scope: {filters.businessLine || 'All lines'}</span>
          </div>
        </div>
      </div>

      {/* Global Filter Bar */}
      <DashboardFilters />

      {/* 1. KPI Cards Grid */}
      <KpiGrid />

      {/* 2 & 3. Outreach Funnel & Follow-ups Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OutreachFunnel />
        <FollowUpsPanel />
      </div>

      {/* 4. Charts: Relationship Temperature, Accounts by Tier, Buy-Side vs Sell-Side */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <RelationshipChart />
        <AccountsByTierChart />
        <DealSideChart />
      </div>

      {/* 5. Tables: Recently Updated Accounts on LEFT, Top Priority Contacts on RIGHT on desktop; Top Priority Contacts first on mobile */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RecentAccountsTable className="order-2 xl:order-1" />
        <PriorityContactsTable className="order-1 xl:order-2" />
      </div>

      {/* 6. Extra Widgets: Practice Line Breakdown & Owner Portfolio / Overdue Workload */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AccountsByCategoryChart />
        <AccountsPerOwnerWidget />
      </div>

      {/* 7. Action Alert: Inactive & Stale Contacts */}
      <div>
        <StaleContactsWidget />
      </div>
    </div>
  );
};
