<script setup lang="ts">
import { BanknotesIcon, BellIcon, CheckIcon, ExclamationCircleIcon, FunnelIcon, MegaphoneIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AnnouncementModal from '@/components/notifications/AnnouncementModal.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import AppTabs from '@/components/ui/AppTabs.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { useNotificationText } from '@/composables/useNotificationText';
import { useTable } from '@/composables/useTable';
import { useToast } from '@/composables/useToast';
import { notificationsService } from '@/services/notifications.service';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import type { AppNotification, NotificationType } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatDateTime, formatRelative } from '@/utils/format';

const { t } = useI18n();
const toast = useToast();
const auth = useAuthStore();
const store = useNotificationsStore();
const text = useNotificationText();

const table = useTable<AppNotification, { unread: boolean | null }>(notificationsService.list, {
  sortBy: 'createdAt',
  limit: 15,
  filters: { unread: null },
});
const filter = computed({
  get: () => (table.filters.unread ? 'unread' : 'all'),
  set: (value: string) => (table.filters.unread = value === 'unread' ? true : null),
});
const tabs = computed(() => [
  { value: 'all', label: t('common.all') },
  { value: 'unread', label: t('notifications.unread'), count: store.unreadCount },
]);

const ICONS: Record<NotificationType, { icon: unknown; class: string }> = {
  announcement: { icon: MegaphoneIcon, class: 'bg-brand-50 text-brand-600' },
  payment_received: { icon: BanknotesIcon, class: 'bg-emerald-50 text-emerald-600' },
  absence: { icon: ExclamationCircleIcon, class: 'bg-rose-50 text-rose-600' },
  lead_assigned: { icon: FunnelIcon, class: 'bg-amber-50 text-amber-600' },
};

const announcementOpen = ref(false);

async function markRead(item: AppNotification) {
  try {
    await store.markRead(item);
  } catch (error) {
    toast.error(getErrorMessage(error));
  }
}
async function markAll() {
  await store.markAllRead();
  table.load();
}
async function remove(item: AppNotification) {
  try {
    await notificationsService.remove(item.id);
    if (!item.isRead) store.refreshCount();
    table.load();
  } catch (error) {
    toast.error(getErrorMessage(error));
  }
}
</script>

<template>
  <div>
    <PageHeader :title="$t('notifications.title')" :subtitle="$t('notifications.subtitle')">
      <template #actions>
        <AppButton variant="secondary" :icon="CheckIcon" :disabled="!store.unreadCount" @click="markAll">{{ $t('notifications.markAllRead') }}</AppButton>
        <AppButton v-if="auth.isStaff" :icon="MegaphoneIcon" @click="announcementOpen = true">{{ $t('notifications.newAnnouncement') }}</AppButton>
      </template>
    </PageHeader>

    <AppTabs v-model="filter" :tabs="tabs" />

    <div class="card mt-6 overflow-hidden">
      <ErrorState v-if="table.error.value" :message="table.error.value" @retry="table.load" />
      <div v-else-if="table.loading.value && !table.rows.value.length" class="space-y-4 p-5"><AppSkeleton v-for="i in 5" :key="i" class="h-14" /></div>
      <EmptyState v-else-if="!table.rows.value.length" :icon="BellIcon" :title="$t('notifications.empty')" :description="$t('notifications.emptyHint')" />
      <ul v-else class="divide-y divide-slate-100">
        <li
          v-for="item in table.rows.value"
          :key="item.id"
          :class="['group flex gap-4 px-5 py-4 transition', item.isRead ? 'bg-white' : 'bg-brand-50/40']"
        >
          <span :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-full', ICONS[item.type].class]">
            <component :is="ICONS[item.type].icon" class="h-5 w-5" />
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-3">
              <p :class="['text-sm', item.isRead ? 'font-medium text-slate-800' : 'font-semibold text-slate-900']">{{ text.title(item) }}</p>
              <span class="shrink-0 text-xs text-slate-400" :title="formatDateTime(item.createdAt)">{{ formatRelative(item.createdAt) }}</span>
            </div>
            <p class="mt-1 whitespace-pre-line text-sm text-slate-600">{{ text.message(item) }}</p>
            <div class="mt-2 flex gap-3 text-xs">
              <button v-if="!item.isRead" class="link" @click="markRead(item)">{{ $t('notifications.markRead') }}</button>
              <button class="inline-flex items-center gap-1 text-slate-400 hover:text-rose-600" @click="remove(item)">
                <TrashIcon class="h-3.5 w-3.5" />{{ $t('common.delete') }}
              </button>
            </div>
          </div>
        </li>
      </ul>
      <AppPagination :meta="table.meta.value" @page="table.setPage" />
    </div>

    <AnnouncementModal v-if="auth.isStaff" :open="announcementOpen" @close="announcementOpen = false" @sent="table.load(); store.refreshCount()" />
  </div>
</template>
