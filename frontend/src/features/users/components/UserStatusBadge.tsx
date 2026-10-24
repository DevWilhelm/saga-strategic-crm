import React from 'react';
import type { UserStatus } from '../../../constants/users';

interface UserStatusBadgeProps {
  status: UserStatus;
  className?: string;
}

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status, className = '' }) => {
  const isActive = status === 'ACTIVE';

  return (
    <span
      style={{
        backgroundColor: isActive ? 'var(--status-success-bg)' : 'var(--relationship-cold-bg)',
        color: isActive ? 'var(--status-success-text)' : 'var(--text-secondary)',
      }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}
    >
      <span
        style={{
          backgroundColor: isActive ? 'var(--status-success-text)' : 'var(--text-secondary)',
        }}
        className="w-1.5 h-1.5 rounded-full"
      />
      {status}
    </span>
  );
};
