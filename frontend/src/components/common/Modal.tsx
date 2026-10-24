import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  // While true, Escape and backdrop clicks don't close the dialog (e.g. during save).
  busy?: boolean;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  size?: 'sm' | 'md';
}

export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  description,
  onClose,
  busy = false,
  footer,
  children,
  size = 'md',
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Focus the first form field, or the panel itself.
    const firstField = panelRef.current?.querySelector<HTMLElement>('input, textarea, select');
    (firstField ?? panelRef.current)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
    // Focus once per opening; `busy` changes must not move focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-[var(--sidebar)] opacity-40"
        aria-hidden="true"
        onClick={() => !busy && onClose()}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`relative w-full ${
          size === 'sm' ? 'max-w-md' : 'max-w-lg'
        } rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl focus:outline-none`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold tracking-tight text-[var(--text)]">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-0.5 text-xs text-[var(--text-secondary)]">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-md p-1 text-[var(--text-secondary)] transition hover:bg-[var(--background)] hover:text-[var(--text)] disabled:opacity-50 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children && <div className="px-5 py-4">{children}</div>}
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] px-5 py-3.5 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
