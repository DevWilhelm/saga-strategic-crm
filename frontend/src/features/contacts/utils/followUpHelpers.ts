/**
 * Returns the current date in YYYY-MM-DD format based on local time
 */
export function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type FollowUpUrgency = 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING';

/**
 * Evaluates the status / urgency of a follow-up due date relative to today
 */
export function getFollowUpUrgency(dueDate: string | null): FollowUpUrgency | null {
  if (!dueDate) return null;
  const today = getTodayDateString();
  if (dueDate < today) return 'OVERDUE';
  if (dueDate === today) return 'DUE_TODAY';
  return 'UPCOMING';
}

/**
 * Calculates due date string (YYYY-MM-DD) from last contacted date plus period in days
 */
export function calculateDueDateFromPeriod(lastContactedDateStr: string, periodDays: number): string {
  if (!lastContactedDateStr || !periodDays || periodDays <= 0) return '';
  const date = new Date(lastContactedDateStr);
  if (isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + periodDays);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Shared helper to find the earliest pending follow-up date for a list of follow-ups.
 * Used for both Contact items and Account items.
 */
export function calculateNextFollowUpDate(
  followUps: Array<{ dueDate: string; isDone?: boolean }>
): string | null {
  if (!followUps || followUps.length === 0) return null;

  // Filter for pending (not done) follow-ups with valid due dates
  const pending = followUps.filter((f) => !f.isDone && f.dueDate);
  if (pending.length === 0) return null;

  // Sort ascending by dueDate (soonest / most urgent first)
  const sorted = [...pending].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return sorted[0].dueDate;
}

/**
 * Helper to check whether a due date is in the past (non-blocking warning check)
 */
export function isDueDateInPast(dueDateStr: string): boolean {
  if (!dueDateStr) return false;
  const today = getTodayDateString();
  return dueDateStr < today;
}
