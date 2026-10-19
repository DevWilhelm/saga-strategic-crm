import React from 'react';
import { UserX, Building, Calendar, AlertCircle } from 'lucide-react';
import { WidgetContainer } from '../../../components/common/WidgetContainer';
import { useStaleContacts } from '../hooks/useStaleContacts';

export const StaleContactsWidget: React.FC = () => {
  const { data, isLoading, isError, error, refetch } = useStaleContacts();

  const isEmpty = !isLoading && !isError && (!data || data.length === 0);

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <WidgetContainer
      title="Stale Contacts"
      subtitle="Contacts with no follow-up scheduled or >30 days inactive"
      headerAction={
        <div className="flex items-center gap-1.5 text-xs text-[var(--status-warning-text)] font-semibold">
          <UserX className="h-3.5 w-3.5" />
          <span>{data ? `${data.length} Inactive` : ''}</span>
        </div>
      }
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No stale contacts found for the current criteria."
      onRetry={() => refetch()}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--table-header-bg)] text-[var(--table-header-text)]">
              <th className="py-2.5 px-3 font-semibold">Contact</th>
              <th className="py-2.5 pr-4 font-semibold">Company</th>
              <th className="py-2.5 pr-4 font-semibold">Last Contact</th>
              <th className="py-2.5 px-3 font-semibold text-right">Inactivity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {data?.slice(0, 6).map((contact) => (
              <tr
                key={contact.id}
                className="transition-colors hover:bg-[var(--background)]/60"
              >
                {/* Contact Name */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] font-bold text-xs">
                      !
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--text)]">{contact.name}</p>
                      <span className="text-[10px] font-medium text-[var(--status-warning-text)]">
                        {contact.reason === 'NO_FOLLOW_UP' ? 'No follow-up' : '>30 days inactive'}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Company */}
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-1 text-[var(--link)]">
                    <Building className="h-3 w-3 shrink-0 opacity-70" />
                    <span className="truncate hover:underline cursor-pointer">{contact.company_name}</span>
                  </div>
                </td>

                {/* Last Contacted Date */}
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                    <Calendar className="h-3 w-3 opacity-60" />
                    <span>{formatDate(contact.last_contacted_date)}</span>
                  </div>
                </td>

                {/* Days Since Contact */}
                <td className="py-3 px-3 text-right">
                  <span className="inline-flex items-center gap-1 rounded-md border border-[var(--status-warning-text)]/30 bg-[var(--status-warning-bg)] px-2 py-0.5 text-[11px] font-bold text-[var(--status-warning-text)] whitespace-nowrap">
                    <AlertCircle className="h-3 w-3" />
                    {contact.days_since_contact}d ago
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetContainer>
  );
};
