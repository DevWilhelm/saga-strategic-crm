import React from 'react';
import type { ContactTier } from '../../../types/contact';

interface ContactTierBadgeProps {
  tier: ContactTier | string;
  className?: string;
}

export const ContactTierBadge: React.FC<ContactTierBadgeProps> = ({ tier, className = '' }) => {
  const normalizedTier = tier?.toUpperCase();

  if (normalizedTier === 'TIER_1' || normalizedTier === 'T1') {
    return (
      <span
        style={{
          backgroundColor: 'var(--tag-tier1-bg)',
          color: 'var(--tag-tier1-text)',
        }}
        className={`inline-flex items-center justify-center font-semibold text-xs px-2 py-0.5 rounded whitespace-nowrap shadow-xs ${className}`}
        title="Tier 1"
        aria-label="Tier 1"
      >
        T1
      </span>
    );
  }

  if (normalizedTier === 'TIER_2' || normalizedTier === 'T2') {
    return (
      <span
        style={{
          backgroundColor: 'var(--tag-bg)',
          color: 'var(--tag-text)',
          border: '1px solid var(--border)',
        }}
        className={`inline-flex items-center justify-center font-medium text-xs px-2 py-0.5 rounded whitespace-nowrap ${className}`}
        title="Tier 2"
        aria-label="Tier 2"
      >
        T2
      </span>
    );
  }

  // T3 or fallback: neutral
  return (
    <span
      style={{
        backgroundColor: 'var(--table-header-bg)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border)',
      }}
      className={`inline-flex items-center justify-center font-medium text-xs px-2 py-0.5 rounded whitespace-nowrap ${className}`}
      title="Tier 3"
      aria-label="Tier 3"
    >
      T3
    </span>
  );
};
