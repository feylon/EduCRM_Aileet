import type { BadgeColor } from '@/components/ui/AppBadge.vue';

/** Badge colors for every status-like enum used in the UI. */
export const STATUS_COLORS: Record<string, Record<string, BadgeColor>> = {
  student: { active: 'green', frozen: 'blue', graduated: 'purple', left: 'gray' },
  group: { planned: 'blue', active: 'green', completed: 'gray', cancelled: 'red' },
  attendance: { present: 'green', late: 'amber', absent: 'red', excused: 'blue' },
  payment: { paid: 'green', refunded: 'red' },
  lead: { new: 'blue', contacted: 'indigo', trial: 'amber', converted: 'green', lost: 'gray' },
  level: { beginner: 'green', elementary: 'teal', intermediate: 'blue', advanced: 'purple' },
};

export function statusColor(kind: keyof typeof STATUS_COLORS, value?: string | null): BadgeColor {
  return (value && STATUS_COLORS[kind][value]) || 'gray';
}
