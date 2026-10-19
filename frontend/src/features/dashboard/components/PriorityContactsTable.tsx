import React from 'react';
import { Star, Building, ArrowRight, User } from 'lucide-react';
import { WidgetContainer } from '../../../components/common/WidgetContainer';
import { usePriorityContacts } from '../hooks/usePriorityContacts';

interface PriorityContactsTableProps {
  className?: string;
}

export const PriorityContactsTable: React.FC<PriorityContactsTableProps> = ({ className }) => {
  const { data, isLoading, isError, error, refetch } = usePriorityContacts();

  const isEmpty = !isLoading && !isError && (!data || data.length === 0);

  return (
    <WidgetContainer
      title="Top Priority Contacts"
      subtitle="Tier 1 leads requiring senior executive engagement"
      className={className}
      headerAction={
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <Star className="h-3.5 w-3.5 text-[var(--tag-text)]" />
          <span>{data ? `${data.length} Leads` : ''}</span>
        </div>
      }
      isLoading={isLoading}
      isError={isError}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No top priority contacts match the current criteria."
      onRetry={() => refetch()}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--table-header-bg)] text-[var(--table-header-text)]">
              <th className="py-2.5 px-3 font-semibold">Contact</th>
              <th className="py-2.5 pr-4 font-semibold">Company</th>
              <th className="py-2.5 pr-4 font-semibold">Relationship</th>
              <th className="py-2.5 px-3 font-semibold">Next Step</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {data?.slice(0, 8).map((contact) => {
              const relClass =
                contact.relationship_status === 'HOT'
                  ? 'bg-[var(--relationship-hot-bg)] text-[var(--relationship-hot-text)] border border-[var(--relationship-hot-text)]/20'
                  : contact.relationship_status === 'WARM'
                  ? 'bg-[var(--relationship-warm-bg)] text-[var(--relationship-warm-text)] border border-[var(--relationship-warm-text)]/20'
                  : 'bg-[var(--relationship-cold-bg)] text-[var(--relationship-cold-text)] border border-[var(--relationship-cold-text)]/20';

              return (
                <tr
                  key={contact.id}
                  className="transition-colors hover:bg-[var(--background)]/60"
                >
                  {/* Name & Title */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--tag-bg)] text-[var(--tag-text)] font-semibold text-[11px]">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--text)]">{contact.name}</p>
                        {contact.title && (
                          <p className="truncate text-[11px] text-[var(--text-secondary)]">
                            {contact.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5 text-[var(--link)]">
                      <Building className="h-3 w-3 shrink-0 opacity-70" />
                      <span className="truncate font-medium hover:underline cursor-pointer">{contact.company_name || 'Independent'}</span>
                    </div>
                  </td>

                  {/* Relationship Status Badge */}
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${relClass}`}
                    >
                      {contact.relationship_status}
                    </span>
                  </td>

                  {/* Next Step */}
                  <td className="py-3 px-3 max-w-xs">
                    <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                      <ArrowRight className="h-3 w-3 shrink-0 text-[var(--link)]" />
                      <span
                        className="truncate block"
                        title={contact.next_step || 'Awaiting initial outreach'}
                      >
                        {contact.next_step || 'Awaiting initial outreach'}
                      </span>
                    </div>
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
