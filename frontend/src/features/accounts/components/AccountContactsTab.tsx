import React from 'react';
import { Mail, UserCheck } from 'lucide-react';
import { useAccountContacts } from '../hooks/useAccounts';
import { TierBadge } from './TierBadge';
import { FollowUpDateBadge } from './FollowUpDateBadge';
import { LoadingSkeleton, EmptyState, ErrorState } from '../../../components/common/WidgetState';

interface AccountContactsTabProps {
  accountId: string;
}

export const AccountContactsTab: React.FC<AccountContactsTabProps> = ({ accountId }) => {
  const { data: contacts, isLoading, isError, error, refetch } = useAccountContacts(accountId);

  if (isLoading) {
    return <LoadingSkeleton rows={4} />;
  }

  if (isError) {
    return (
      <ErrorState
        message={error?.message || 'Failed to load contacts for this account.'}
        onRetry={() => refetch()}
      />
    );
  }

  if (!contacts || contacts.length === 0) {
    return (
      <EmptyState
        title="No contacts recorded"
        description="There are currently no decision-makers or contacts linked to this account."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
      <table className="w-full text-left text-sm border-collapse min-w-[700px]">
        <thead>
          <tr
            style={{
              backgroundColor: 'var(--table-header-bg)',
              color: 'var(--table-header-text)',
              borderColor: 'var(--border)',
            }}
            className="border-b text-xs font-semibold uppercase tracking-wider"
          >
            <th className="py-3 px-4">Contact Name & Title</th>
            <th className="py-3 px-3 text-center">Tier</th>
            <th className="py-3 px-3">Relationship</th>
            <th className="py-3 px-4">Next Step</th>
            <th className="py-3 px-4">Follow-Up</th>
            <th className="py-3 px-4">Email</th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {contacts.map((contact) => (
            <tr
              key={contact.id}
              className="hover:bg-slate-50/75 transition-colors"
              style={{ color: 'var(--text)' }}
            >
              {/* Name & Title */}
              <td className="py-3 px-4">
                <div className="flex items-center gap-2.5">
                  <div
                    style={{
                      backgroundColor: 'var(--tag-bg)',
                      color: 'var(--tag-text)',
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                  >
                    {contact.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-semibold text-sm block">{contact.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }} className="text-xs">
                      {contact.targetRole}
                    </span>
                  </div>
                </div>
              </td>

              {/* Tier */}
              <td className="py-3 px-3 text-center">
                <TierBadge tier={contact.tier} />
              </td>

              {/* Relationship */}
              <td className="py-3 px-3">
                <span
                  style={{
                    backgroundColor:
                      contact.relationshipStatus === 'HOT'
                        ? 'var(--relationship-hot-bg)'
                        : contact.relationshipStatus === 'WARM'
                        ? 'var(--relationship-warm-bg)'
                        : 'var(--relationship-cold-bg)',
                    color:
                      contact.relationshipStatus === 'HOT'
                        ? 'var(--relationship-hot-text)'
                        : contact.relationshipStatus === 'WARM'
                        ? 'var(--relationship-warm-text)'
                        : 'var(--relationship-cold-text)',
                  }}
                  className="text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                >
                  <UserCheck className="w-3 h-3" />
                  {contact.relationshipStatus}
                </span>
              </td>

              {/* Next Step */}
              <td className="py-3 px-4 max-w-xs">
                <p style={{ color: 'var(--text)' }} className="text-xs line-clamp-2">
                  {contact.nextStep || '—'}
                </p>
              </td>

              {/* Next Follow-Up Date */}
              <td className="py-3 px-4 whitespace-nowrap">
                <FollowUpDateBadge dateStr={contact.nextFollowUpDate} />
              </td>

              {/* Email */}
              <td className="py-3 px-4 whitespace-nowrap">
                {contact.email ? (
                  <a
                    href={`mailto:${contact.email}`}
                    style={{ color: 'var(--link)' }}
                    className="hover:underline text-xs inline-flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    {contact.email}
                  </a>
                ) : (
                  <span style={{ color: 'var(--text-secondary)' }} className="text-xs">
                    —
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
