import React from 'react';
import { Flame, Sparkles, Snowflake } from 'lucide-react';
import type { RelationshipStatus } from '../../../types/contact';

interface RelationshipBadgeProps {
  status: RelationshipStatus;
  className?: string;
  showIcon?: boolean;
}

export const RelationshipBadge: React.FC<RelationshipBadgeProps> = ({
  status,
  className = '',
  showIcon = true,
}) => {
  let bg = 'var(--relationship-cold-bg)';
  let color = 'var(--relationship-cold-text)';
  let Icon = Snowflake;
  let label = 'Cold';

  if (status === 'HOT') {
    bg = 'var(--relationship-hot-bg)';
    color = 'var(--relationship-hot-text)';
    Icon = Flame;
    label = 'Hot';
  } else if (status === 'WARM') {
    bg = 'var(--relationship-warm-bg)';
    color = 'var(--relationship-warm-text)';
    Icon = Sparkles;
    label = 'Warm';
  }

  return (
    <span
      style={{ backgroundColor: bg, color }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap shadow-2xs ${className}`}
      title={`Relationship Status: ${label}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{label}</span>
    </span>
  );
};
