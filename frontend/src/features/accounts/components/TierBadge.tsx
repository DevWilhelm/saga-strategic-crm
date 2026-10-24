import React from 'react';
import type { Tier } from '../../../types/account';

interface TierBadgeProps {
  tier: Tier | string;
  className?: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, className = '' }) => {
  const normalizedTier = tier?.toUpperCase();

  if (normalizedTier === 'TIER_1' || normalizedTier === 'T1') {
    return (
      <span
        style={{
          backgroundColor: 'var(--tag-tier1-bg)',
          color: 'var(--tag-tier1-text)',
        }}
        className={`inline-flex items-center justify-center font-semibold text-xs px-2 py-0.5 rounded whitespace-nowrap shadow-xs ${className}`}
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
    >
      T3
    </span>
  );
};
