import { useI18n } from 'vue-i18n';
import type { AppNotification } from '@/types/models';
import { formatDate, formatMoney, formatMonth } from '@/utils/format';

/** System notifications are stored as type + data and rendered in the current language. */
export function useNotificationText() {
  const { t } = useI18n();

  function title(notification: AppNotification): string {
    if (notification.type === 'announcement') return notification.title || t('notifications.types.announcement');
    return t(`notifications.types.${notification.type}`);
  }

  function message(notification: AppNotification): string {
    const data = notification.data || {};
    switch (notification.type) {
      case 'payment_received':
        return t('notifications.messages.payment_received', {
          amount: formatMoney(data.amount),
          month: formatMonth(data.forMonth),
          group: data.groupName || '—',
        });
      case 'absence':
        return t('notifications.messages.absence', { group: data.groupName, date: formatDate(data.date) });
      case 'lead_assigned':
        return t('notifications.messages.lead_assigned', { name: data.leadName });
      default:
        return notification.message || '';
    }
  }

  return { title, message };
}
