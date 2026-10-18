import React from 'react';
import type { UserRole } from '../../../constants/users';

interface UserRoleBadgeProps {
  role: UserRole;
  className?: string;
}

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ role, className = '' }) => {
  const getBadgeStyle = () => {
    switch (role) {
      case 'ADMIN':
        return {
          backgroundColor: 'var(--sidebar)',
          color: 'var(--sidebar-text)',
        };
      case 'MEMBER':
        return {
          backgroundColor: 'var(--status-info-bg)',
          color: 'var(--status-info-text)',
        };
      case 'VIEWER':
        return {
          backgroundColor: 'var(--relationship-cold-bg)',
          color: 'var(--relationship-cold-text)',
        };
      default:
        return {
          backgroundColor: 'var(--background)',
          color: 'var(--text-secondary)',
        };
    }
  };

  return (
    <span
      style={getBadgeStyle()}
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold tracking-wider uppercase ${className}`}
    >
      {role}
    </span>
  );
};
