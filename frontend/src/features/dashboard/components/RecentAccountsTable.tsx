import React from 'react';
import { Building2, Globe, Clock, UserCheck } from 'lucide-react';
import { WidgetContainer } from '../../../components/common/WidgetContainer';
import { useRecentAccounts } from '../hooks/useRecentAccounts';

interface RecentAccountsTableProps {
  className?: string;
}

export const RecentAccountsTable: React.FC<RecentAccountsTableProps> = ({ className }) => {
  const { data, isLoading, isError, error, refetch } = useRecentAccounts();

  const isEmpty = !isLoading && !isError && (!data || data.length === 0);

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTierLabel = (tier: string): string => {
    if (tier === 'TIER_1') return 'Tier 1';
    if (tier === 'TIER_2') return 'Tier 2';
    if (tier === 'TIER_3') return 'Tier 3';
    return tier;
  };

  const BUSINESS_LINE_COLORS: Record<string, string> = {
    'Healthcare': 'var(--business-healthcare)',
    'Financial Advisory': 'var(--business-financial)',
    'Networking & Partnerships': 'var(--business-networking)',
  };

  return (
    <WidgetContainer
      title="Recently Updated Accounts"
      subtitle="Corporate profiles with recent deal or registry activity"
      className={className}
      headerAction={
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <Clock className="h-3.5 w-3.5 text-[var(--link)]" />
          <span>Latest Updates</span>
        </div>
      }
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No recently updated accounts match the current criteria."
      onRetry={() => refetch()}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--table-header-bg)] text-[var(--table-header-text)]">
              <th className="py-2.5 px-3 font-semibold">Company</th>
              <th className="py-2.5 pr-4 font-semibold">Country</th>
              <th className="py-2.5 pr-4 font-semibold">Tier</th>
              <th className="py-2.5 pr-4 font-semibold">Owner</th>
              <th className="py-2.5 px-3 font-semibold text-right">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {data?.slice(0, 8).map((account) => {
              const isTier1 = account.tier === 'TIER_1';
              const dotColor = BUSINESS_LINE_COLORS[account.category] || 'var(--business-financial)';

              return (
                <tr
                  key={account.id}
                  className="transition-colors hover:bg-[var(--background)]/60"
                >
                  {/* Account Name & Category */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--table-header-bg)] text-[var(--link)]">
                        <Building2 className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--link)] hover:underline cursor-pointer">
                          {account.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full inline-block"
                            style={{ backgroundColor: dotColor }}
                          />
                          <span className="truncate">
                            {account.category} &bull; {account.deal_side === 'BUY_SIDE' ? 'Buy-Side' : 'Sell-Side'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Country */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1 text-[var(--text)]">
                      <Globe className="h-3 w-3 shrink-0 opacity-50" />
                      <span className="truncate">{account.country}</span>
                    </div>
                  </td>

                  {/* Tier */}
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${
                        isTier1
                          ? 'bg-[var(--tag-tier1-bg)] text-[var(--tag-tier1-text)]'
                          : 'bg-[var(--tag-bg)] text-[var(--tag-text)] font-semibold'
                      }`}
                    >
                      {formatTierLabel(account.tier)}
                    </span>
                  </td>

                  {/* Owner */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5 text-[var(--text)]">
                      <UserCheck className="h-3 w-3 shrink-0 text-[var(--tag-text)]" />
                      <span className="truncate">{account.owner_name || 'Assigned'}</span>
                    </div>
                  </td>

                  {/* Updated Date */}
                  <td className="py-3 px-3 text-right">
                    <span className="text-[11px] font-medium text-[var(--text-secondary)] whitespace-nowrap">
                      {formatDate(account.updated_at)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </WidgetContainer>
  );
};
