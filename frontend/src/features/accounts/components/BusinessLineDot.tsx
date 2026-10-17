import React from 'react';
import type { BusinessLine } from '../../../types/account';

interface BusinessLineDotProps {
  businessLine: BusinessLine | string;
  showLabel?: boolean;
  className?: string;
}

export const BusinessLineDot: React.FC<BusinessLineDotProps> = ({
  businessLine,
  showLabel = true,
  className = '',
}) => {
  let dotColor = 'var(--business-healthcare)';

  if (businessLine === 'Financial Advisory') {
    dotColor = 'var(--business-financial)';
  } else if (businessLine === 'Networking & Partnerships') {
    dotColor = 'var(--business-networking)';
  }

  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap ${className}`}>
      <span
        style={{ backgroundColor: dotColor }}
        className="w-2.5 h-2.5 rounded-full shrink-0"
        title={businessLine}
      />
      {showLabel && (
        <span style={{ color: 'var(--text)' }} className="text-sm font-normal">
          {businessLine}
        </span>
      )}
    </span>
  );
};
