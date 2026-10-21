import React from 'react';
import { Calendar } from 'lucide-react';
import { getTodayDateString } from '../utils/followUpHelpers';

interface ContactFollowUpBadgeProps {
  dateStr: string | null;
  className?: string;
  showIcon?: boolean;
}

export const ContactFollowUpBadge: React.FC<ContactFollowUpBadgeProps> = ({
  dateStr,
  className = '',
  showIcon = false,
}) => {
  if (!dateStr) {
    return (
      <span style={{ color: 'var(--text-secondary)' }} className="text-xs font-normal">
        —
      </span>
    );
  }

  const todayStr = getTodayDateString();

  if (dateStr < todayStr) {
    // Overdue: Show red chip with explicit text "Overdue"
    return (
      <div className={`inline-flex items-center gap-1.5 whitespace-nowrap ${className}`}>
        {showIcon && <Calendar className="w-3.5 h-3.5 shrink-0 text-red-500" />}
        <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{dateStr}</span>
        <span
          style={{
            backgroundColor: 'var(--status-overdue-bg)',
            color: 'var(--status-overdue-text)',
          }}
          className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block"
          title={`Overdue follow-up since ${dateStr}`}
          aria-label={`Overdue follow-up: ${dateStr}`}
        >
          Overdue
        </span>
      </div>
    );
  }

  if (dateStr === todayStr) {
    // Due today: Show warning chip with text "Today"
    return (
      <div className={`inline-flex items-center gap-1.5 whitespace-nowrap ${className}`}>
        {showIcon && <Calendar className="w-3.5 h-3.5 shrink-0 text-amber-500" />}
        <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{dateStr}</span>
        <span
          style={{
            backgroundColor: 'var(--status-warning-bg)',
            color: 'var(--status-warning-text)',
          }}
          className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block"
          title="Follow-up due today"
          aria-label={`Follow-up due today: ${dateStr}`}
        >
          Today
        </span>
      </div>
    );
  }

  // Future scheduled date
  return (
    <div className={`inline-flex items-center gap-1.5 whitespace-nowrap ${className}`}>
      {showIcon && (
        <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-secondary)' }} />
      )}
      <span style={{ color: 'var(--text)' }} className="text-xs font-medium">
        {dateStr}
      </span>
    </div>
  );
};
