import React from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--btn-primary)] text-[var(--btn-primary-text)] shadow hover:bg-[var(--btn-primary-hover)] focus-visible:ring-[var(--btn-primary)]',
  secondary:
    'border border-[var(--btn-secondary-border)] bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] shadow-xs hover:bg-[var(--background)] focus-visible:ring-[var(--btn-primary)]',
  danger:
    'bg-[var(--status-overdue-text)] text-white shadow hover:opacity-90 focus-visible:ring-[var(--status-overdue-text)]',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  icon: Icon,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${VARIANTS[variant]} ${className}`}
    {...rest}
  >
    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
    {children}
  </button>
);
