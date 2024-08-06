import { defineStore } from 'pinia';
import { ref } from 'vue';
import { notificationsService } from '@/services/notifications.service';
import type { AppNotification } from '@/types/models';

const POLL_INTERVAL = 60_000;

/** Unread counter + latest notifications for the topbar bell (polled every minute). */
export const useNotificationsStore = defineStore('notifications', () => {
  const unreadCount = ref(0);
  const latest = ref<AppNotification[]>([]);
  const loading = ref(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  async function refreshCount() {
    try {
      unreadCount.value = (await notificationsService.unreadCount()).count;
    } catch {
      // ignore polling errors
    }
  }

  async function loadLatest() {
    loading.value = true;
    try {
      latest.value = (await notificationsService.list({ limit: 6 })).items;
    } finally {
      loading.value = false;
    }
  }

  async function markRead(notification: AppNotification) {
    if (notification.isRead) return;
    await notificationsService.markRead(notification.id);
    notification.isRead = true;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  }

  async function markAllRead() {
    await notificationsService.markAllRead();
    latest.value.forEach((item) => (item.isRead = true));
    unreadCount.value = 0;
  }

  function startPolling() {
    stopPolling();
    refreshCount();
    timer = setInterval(refreshCount, POLL_INTERVAL);
  }

  function stopPolling() {
    if (timer) clearInterval(timer);
    timer = undefined;
  }

  return { unreadCount, latest, loading, refreshCount, loadLatest, markRead, markAllRead, startPolling, stopPolling };
});
