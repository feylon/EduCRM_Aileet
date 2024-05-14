/** Small date helpers. Dates are handled as ISO strings (YYYY-MM-DD) for DATE columns. */

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function monthKey(date: Date): string {
  return toDateString(date).slice(0, 7);
}

export function startOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/** ISO weekday: 1 = Monday ... 7 = Sunday */
export function isoWeekday(date = new Date()): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

/** Returns the list of month keys (YYYY-MM) for the last `count` months, oldest first. */
export function lastMonths(count: number, from = new Date()): string[] {
  const result: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    result.push(monthKey(new Date(from.getFullYear(), from.getMonth() - i, 1)));
  }
  return result;
}

/** Number of billable months between two dates, both months inclusive. */
export function monthsBetween(start: Date, end: Date): number {
  const diff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  return Math.max(diff, 0);
}
