import { useI18n } from 'vue-i18n';
import type { Schedule } from '@/types/models';
import { formatTime } from '@/utils/format';

/** Weekday helpers (ISO numbering: 1 = Monday ... 7 = Sunday). */
export function useDays() {
  const { t } = useI18n();
  const dayName = (day: number, short = false) => t(`days.${short ? 'short' : 'long'}.${day}`);
  const dayOptions = () => [1, 2, 3, 4, 5, 6, 7].map((day) => ({ value: day, label: dayName(day) }));

  /** "Mon, Wed, Fri · 09:00–10:30" (several time slots are joined with " / "). */
  function scheduleSummary(schedules?: Schedule[]): string {
    if (!schedules?.length) return '—';
    const byTime = new Map<string, number[]>();
    for (const slot of [...schedules].sort((a, b) => a.dayOfWeek - b.dayOfWeek)) {
      const key = `${formatTime(slot.startTime)}–${formatTime(slot.endTime)}`;
      byTime.set(key, [...(byTime.get(key) || []), slot.dayOfWeek]);
    }
    return [...byTime.entries()]
      .map(([time, days]) => `${days.map((day) => dayName(day, true)).join(', ')} · ${time}`)
      .join(' / ');
  }

  return { dayName, dayOptions, scheduleSummary };
}
