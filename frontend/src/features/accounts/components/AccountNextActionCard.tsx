import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import type { NextActionInfo } from '../../../types/account';

interface AccountNextActionCardProps {
  nextAction: NextActionInfo | null;
}

export const AccountNextActionCard: React.FC<AccountNextActionCardProps> = ({ nextAction }) => {
  if (!nextAction) {
    return (
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
        className="p-5 rounded-xl border shadow-xs flex items-center gap-3"
      >
        <div
          style={{
            backgroundColor: 'var(--table-header-bg)',
            color: 'var(--text-secondary)',
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        >
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h4 style={{ color: 'var(--text)' }} className="text-sm font-semibold">
            No Pending Follow-Up Action
          </h4>
          <p style={{ color: 'var(--text-secondary)' }} className="text-xs mt-0.5">
            All immediate action items and client follow-ups for this account are up to date.
          </p>
        </div>
      </div>
    );
  }

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  // Within 7 days calculation
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;

  let badgeBg = 'var(--status-info-bg)';
  let badgeText = 'var(--status-info-text)';
  let urgencyLabel = 'Upcoming';

  if (nextAction.dueDate < todayStr) {
    badgeBg = 'var(--status-overdue-bg)';
    badgeText = 'var(--status-overdue-text)';
    urgencyLabel = 'Overdue';
  } else if (nextAction.dueDate === todayStr) {
    badgeBg = 'var(--status-warning-bg)';
    badgeText = 'var(--status-warning-text)';
    urgencyLabel = 'Due Today';
  } else if (nextAction.dueDate <= nextWeekStr) {
    badgeBg = 'var(--status-info-bg)';
    badgeText = 'var(--status-info-text)';
    urgencyLabel = 'Within 7 Days';
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--tag-bg)',
        borderColor: 'var(--border)',
      }}
      className="p-5 rounded-xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-3.5">
        <div
          style={{
            backgroundColor: 'var(--surface)',
            color: 'var(--tag-text)',
          }}
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
        >
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              style={{ color: 'var(--tag-text)' }}
              className="text-xs font-semibold uppercase tracking-wider"
            >
              Next Action Priority
            </span>
            <span
              style={{ backgroundColor: badgeBg, color: badgeText }}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            >
              {urgencyLabel}
            </span>
          </div>
          <p style={{ color: 'var(--text)' }} className="text-base font-semibold mt-1">
            {nextAction.action}
          </p>
          <p style={{ color: 'var(--text-secondary)' }} className="text-xs mt-0.5">
            Assigned Contact: <span className="font-medium text-slate-800">{nextAction.contactName}</span>
          </p>
        </div>
      </div>

      <div className="shrink-0 sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-teal-200/50">
        <span style={{ color: 'var(--text-secondary)' }} className="text-xs block">
          Follow-up date:
        </span>
        <span
          style={{ color: badgeText }}
          className="text-sm font-bold inline-flex items-center gap-1.5 mt-0.5"
        >
          <Clock className="w-3.5 h-3.5" />
          {nextAction.dueDate}
        </span>
      </div>
    </div>
  );
};
