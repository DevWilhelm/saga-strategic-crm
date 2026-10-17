import React from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';
import { useAccountDeals } from '../hooks/useAccounts';
import { LoadingSkeleton, EmptyState, ErrorState } from './WidgetState';

interface AccountDealsTabProps {
  accountId: string;
}

export const AccountDealsTab: React.FC<AccountDealsTabProps> = ({ accountId }) => {
  const { data: deals, isLoading, isError, error, refetch } = useAccountDeals(accountId);

  if (isLoading) {
    return <LoadingSkeleton rows={3} />;
  }

  if (isError) {
    return (
      <ErrorState
        message={error?.message || 'Failed to load transaction pipeline deals for this account.'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Pending Data Model Hint Banner */}
      <div
        style={{
          backgroundColor: 'var(--tag-bg)',
          borderColor: 'var(--border)',
          color: 'var(--tag-text)',
        }}
        className="p-3.5 rounded-lg border text-xs flex items-center gap-2.5 font-medium"
      >
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>
          <strong>Preliminary Pipeline View:</strong> Deal structure and valuation stages shown below are placeholder models pending official data model confirmation from the backend team.
        </span>
      </div>

      {!deals || deals.length === 0 ? (
        <EmptyState
          title="No active transactions"
          description="There are currently no transaction pipeline deals recorded for this account."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-left text-sm border-collapse min-w-[550px]">
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--table-header-bg)',
                  color: 'var(--table-header-text)',
                  borderColor: 'var(--border)',
                }}
                className="border-b text-xs font-semibold uppercase tracking-wider"
              >
                <th className="py-3 px-4">Deal Mandate Name</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4 text-right">Target Value</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="hover:bg-slate-50/75 transition-colors"
                  style={{ color: 'var(--text)' }}
                >
                  <td className="py-3 px-4 font-semibold text-sm">
                    {deal.name}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      style={{
                        backgroundColor: 'var(--status-info-bg)',
                        color: 'var(--status-info-text)',
                      }}
                      className="text-xs font-bold px-2.5 py-0.5 rounded-full inline-block"
                    >
                      {deal.stage.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium whitespace-nowrap">
                    <span className="inline-flex items-center gap-0.5">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      {deal.value.toLocaleString('en-US')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
