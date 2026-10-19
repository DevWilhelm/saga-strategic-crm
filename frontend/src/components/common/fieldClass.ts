// Tailwind classes for text inputs, selects and textareas in forms.
export const fieldClass = (invalid: boolean) =>
  `w-full rounded-lg border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] shadow-xs transition placeholder:text-[var(--text-secondary)] placeholder:opacity-60 focus:outline-none focus:ring-2 ${
    invalid
      ? 'border-[var(--status-overdue-text)] focus:ring-[var(--status-overdue-bg)]'
      : 'border-[var(--border)] focus:border-[var(--btn-primary)] focus:ring-[var(--tag-bg)]'
  }`;
