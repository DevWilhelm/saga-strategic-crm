import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { WidgetContainer } from '../../../components/common/WidgetContainer';
import { useAccountsPerOwner } from '../hooks/useAccountsPerOwner';

export const AccountsPerOwnerWidget: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useAccountsPerOwner();

  const totalAccounts = data?.reduce((acc, curr) => acc + curr.account_count, 0) || 0;
  const totalOverdue = data?.reduce((acc, curr) => acc + curr.overdue_count, 0) || 0;
  const isEmpty = !isLoading && !isError && (!data || data.length === 0);

  const maxAccounts = Math.max(...(data?.map((d) => d.account_count) || [1]), 1);

  return (
    <WidgetContainer
      title="Accounts per Owner"
      subtitle="Team account distribution and overdue follow-up volume"
      headerAction={
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--text-secondary)]">{totalAccounts} Accounts</span>
          {totalOverdue > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--status-overdue-text)]/30 bg-[var(--status-overdue-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--status-overdue-text)]">
              <AlertTriangle className="h-2.5 w-2.5" />
              {totalOverdue} Overdue
            </span>
          )}
        </div>
      }
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No owner distribution data available."
      onRetry={() => refetch()}
      className="h-[360px] flex flex-col"
    >
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3.5 pr-1 py-1">
        {data?.map((owner) => {
          const pct = Math.round((owner.account_count / maxAccounts) * 100);

          return (
            <div key={owner.owner_id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--table-header-bg)] text-[var(--link)] text-[10px] font-bold">
                    {owner.owner_name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <span className="font-semibold text-[var(--text)] truncate">
                    {owner.owner_name}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-[var(--text)]">
                    {owner.account_count} <span className="font-normal text-[var(--text-secondary)]">accs</span>
                  </span>
                  {owner.overdue_count > 0 ? (
                    <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold bg-[var(--status-overdue-bg)] text-[var(--status-overdue-text)] border border-[var(--status-overdue-text)]/30">
                      {owner.overdue_count} overdue
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-[var(--status-success-bg)] text-[var(--status-success-text)]">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      clear
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--table-header-bg)]">
                <div
                  className="h-full rounded-full bg-[var(--link)] transition-all duration-300"
                  style={{ width: `${Math.max(pct, 5)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </WidgetContainer>
  );
};
