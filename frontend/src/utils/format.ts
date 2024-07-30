import { currentLocale } from '@/i18n';

const INTL_LOCALES: Record<string, string> = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-GB' };

const MONTHS: Record<string, string[]> = {
  uz: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

const CURRENCY: Record<string, string> = { uz: 'so‘m', ru: 'сум', en: 'UZS' };

/** 1 250 000 */
export function formatNumber(value: number | string | null | undefined): string {
  const number = Number(value || 0);
  return Math.round(number)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** 1 250 000 so‘m */
export function formatMoney(value: number | string | null | undefined): string {
  return `${formatNumber(value)} ${CURRENCY[currentLocale()] || 'UZS'}`;
}

/** Compact money for charts and stat cards: 12.5M, 950K */
export function formatCompactMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function parseDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  // Plain dates (YYYY-MM-DD) are treated as local dates, not UTC.
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
}

/** 21.06.2024 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = parseDate(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/** 21.06.2024 14:05 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = parseDate(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "2024-06" -> "Iyun 2024" */
export function formatMonth(value: string | null | undefined, short = false): string {
  if (!value) return '—';
  const [year, month] = value.split('-').map(Number);
  const name = (MONTHS[currentLocale()] || MONTHS.en)[month - 1] || '';
  return short ? `${name.slice(0, 3)} ${String(year).slice(2)}` : `${name} ${year}`;
}

/** "14:00:00" -> "14:00" */
export function formatTime(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : '—';
}

/** Relative time for notifications: "5 min ago" in the current locale. */
export function formatRelative(value: string | Date): string {
  const date = parseDate(value);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(INTL_LOCALES[currentLocale()] || 'en', { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(seconds, 'second');
}

export function todayString(): string {
  const date = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function currentMonthString(): string {
  return todayString().slice(0, 7);
}

export function fullName(person?: { firstName?: string; lastName?: string } | null): string {
  if (!person) return '—';
  return `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim() || '—';
}
