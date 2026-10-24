import React from 'react';
import type { RecordStatus } from '../../types/common';

const STYLES: Record<RecordStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Active',
    className: 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]',
  },
  INACTIVE: {
    label: 'Inactive',
    className: 'bg-[var(--table-header-bg)] text-[var(--text-secondary)]',
  },
};

export const RecordStatusBadge: React.FC<{ status: RecordStatus }> = ({ status }) => {
  const style = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${style.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {style.label}
    </span>
  );
};
