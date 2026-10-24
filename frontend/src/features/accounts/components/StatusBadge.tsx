import React from 'react';
import type { AccountStatus } from '../../../types/account';

interface StatusBadgeProps {
  status: AccountStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const isActive = status?.toUpperCase() === 'ACTIVE';

  if (isActive) {
    return (
      <span
        style={{
          backgroundColor: 'var(--status-success-bg)',
          color: 'var(--status-success-text)',
        }}
        className={`inline-flex items-center gap-1 font-medium text-xs px-2.5 py-0.5 rounded-full whitespace-nowrap ${className}`}
      >
        <span
          style={{ backgroundColor: 'var(--status-success-text)' }}
          className="w-1.5 h-1.5 rounded-full"
        />
        Active
      </span>
    );
  }

  return (
    <span
      style={{
        backgroundColor: 'var(--relationship-cold-bg)',
        color: 'var(--relationship-cold-text)',
      }}
      className={`inline-flex items-center gap-1 font-medium text-xs px-2.5 py-0.5 rounded-full whitespace-nowrap ${className}`}
    >
      <span
        style={{ backgroundColor: 'var(--relationship-cold-text)' }}
        className="w-1.5 h-1.5 rounded-full"
      />
      Inactive
    </span>
  );
};
