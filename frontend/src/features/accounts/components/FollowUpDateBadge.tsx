import React from 'react';
import { Calendar } from 'lucide-react';

interface FollowUpDateBadgeProps {
  dateStr: string | null;
  className?: string;
  showIcon?: boolean;
}

export const FollowUpDateBadge: React.FC<FollowUpDateBadgeProps> = ({
  dateStr,
  className = '',
  showIcon = false,
}) => {
  if (!dateStr) {
    return <span style={{ color: 'var(--text-secondary)' }} className="text-sm font-normal">—</span>;
  }

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  let bg = 'var(--status-info-bg)';
  let color = 'var(--status-info-text)';
  let label = dateStr;

  if (dateStr < todayStr) {
    bg = 'var(--status-overdue-bg)';
    color = 'var(--status-overdue-text)';
    label = `${dateStr} (Overdue)`;
  } else if (dateStr === todayStr) {
    bg = 'var(--status-warning-bg)';
    color = 'var(--status-warning-text)';
    label = `${dateStr} (Today)`;
  }

  return (
    <span
      style={{ backgroundColor: bg, color }}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${className}`}
    >
      {showIcon && <Calendar className="w-3.5 h-3.5 shrink-0" />}
      {label}
    </span>
  );
};
