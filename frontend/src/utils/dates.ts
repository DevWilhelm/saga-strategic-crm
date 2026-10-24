// Calendar dates as 'YYYY-MM-DD' strings in the user's local time zone
// (the same format the API and the mock store use).

export const toISODate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const todayISO = (): string => toISODate(new Date());

export const addDaysISO = (isoDate: string, days: number): string => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return toISODate(new Date(y, m - 1, d + days));
};

export const isISODate = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());

// Friendly form for tables, e.g. "21 Oct 2026".
export const formatISODate = (isoDate: string | null | undefined): string => {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
