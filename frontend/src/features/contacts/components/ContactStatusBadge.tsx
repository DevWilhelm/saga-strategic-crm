import React from 'react';
import type { ContactStatus } from '../../../types/contact';

interface ContactStatusBadgeProps {
  status: ContactStatus | string;
  className?: string;
}

export const ContactStatusBadge: React.FC<ContactStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const isActive = status?.toUpperCase() === 'ACTIVE';

  if (isActive) {
    return (
      <span
        style={{
          backgroundColor: 'var(--status-success-bg)',
          color: 'var(--status-success-text)',
        }}
        className={`inline-flex items-center gap-1.5 font-medium text-xs px-2.5 py-0.5 rounded-full whitespace-nowrap ${className}`}
        title="Status: Active"
        aria-label="Active Status"
      >
        <span
          style={{ backgroundColor: 'var(--status-success-text)' }}
          className="w-1.5 h-1.5 rounded-full shrink-0"
        />
        <span>Active</span>
      </span>
    );
  }

  return (
    <span
      style={{
        backgroundColor: 'var(--relationship-cold-bg)',
        color: 'var(--relationship-cold-text)',
      }}
      className={`inline-flex items-center gap-1.5 font-medium text-xs px-2.5 py-0.5 rounded-full whitespace-nowrap ${className}`}
      title="Status: Inactive"
      aria-label="Inactive Status"
    >
      <span
        style={{ backgroundColor: 'var(--relationship-cold-text)' }}
        className="w-1.5 h-1.5 rounded-full shrink-0"
      />
      <span>Inactive</span>
    </span>
  );
};
