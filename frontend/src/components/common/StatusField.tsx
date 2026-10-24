import React from 'react';
import type { RecordStatus } from '../../types/common';

interface StatusFieldProps {
  name: string;
  value: RecordStatus;
  onChange: (status: RecordStatus) => void;
  activeHint?: string;
  inactiveHint?: string;
}

// Active / Inactive choice for configuration records.
export const StatusField: React.FC<StatusFieldProps> = ({
  name,
  value,
  onChange,
  activeHint = 'Shown in dropdowns',
  inactiveHint = 'Hidden from dropdowns',
}) => {
  const options: { value: RecordStatus; label: string; hint: string }[] = [
    { value: 'ACTIVE', label: 'Active', hint: activeHint },
    { value: 'INACTIVE', label: 'Inactive', hint: inactiveHint },
  ];

  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-semibold text-[var(--text)]">Status</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer flex-col rounded-lg border px-3 py-2 text-sm transition ${
              value === option.value
                ? 'border-[var(--btn-primary)] bg-[var(--tag-bg)]'
                : 'border-[var(--border)] hover:bg-[var(--background)]'
            }`}
          >
            <span className="flex items-center gap-2 font-semibold text-[var(--text)]">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="accent-[var(--btn-primary)]"
              />
              {option.label}
            </span>
            <span className="pl-5 text-xs text-[var(--text-secondary)]">{option.hint}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};
