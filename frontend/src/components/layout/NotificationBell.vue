<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue';
import { BellIcon } from '@heroicons/vue/24/outline';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import { useNotificationText } from '@/composables/useNotificationText';
import { useNotificationsStore } from '@/stores/notifications';
import type { AppNotification } from '@/types/models';
import { formatRelative } from '@/utils/format';

const store = useNotificationsStore();
const text = useNotificationText();

function open(notification: AppNotification) {
  store.markRead(notification).catch(() => undefined);
}
</script>

<template>
  <Popover class="relative">
    <PopoverButton
      class="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      :aria-label="$t('notifications.title')"
      @click="store.loadLatest()"
    >
      <BellIcon class="h-5 w-5" />
      <span
        v-if="store.unreadCount"
        class="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white"
      >
        {{ store.unreadCount > 9 ? '9+' : store.unreadCount }}
      </span>
    </PopoverButton>
    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <PopoverPanel
        v-slot="{ close }"
        class="fixed inset-x-3 top-16 z-40 rounded-2xl border border-slate-100 bg-white shadow-popover sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96"
      >
        <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p class="text-sm font-semibold text-slate-900">{{ $t('notifications.title') }}</p>
          <button
            v-if="store.unreadCount"
            class="text-xs font-medium text-brand-600 hover:text-brand-700"
            @click="store.markAllRead()"
          >
            {{ $t('notifications.markAllRead') }}
          </button>
        </div>
        <div class="max-h-96 overflow-y-auto">
          <div v-if="store.loading && !store.latest.length" class="space-y-3 p-4">
            <AppSkeleton v-for="i in 3" :key="i" class="h-10" />
          </div>
          <p v-else-if="!store.latest.length" class="px-4 py-10 text-center text-sm text-slate-500">
            {{ $t('notifications.empty') }}
          </p>
          <button
            v-for="item in store.latest"
            v-else
            :key="item.id"
            class="flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition last:border-0 hover:bg-slate-50"
            @click="open(item)"
          >
            <span :class="['mt-1.5 h-2 w-2 shrink-0 rounded-full', item.isRead ? 'bg-transparent' : 'bg-brand-500']" />
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-medium text-slate-900">{{ text.title(item) }}</span>
              <span class="mt-0.5 line-clamp-2 block text-xs text-slate-500">{{ text.message(item) }}</span>
              <span class="mt-1 block text-[11px] text-slate-400">{{ formatRelative(item.createdAt) }}</span>
            </span>
          </button>
        </div>
        <RouterLink
          :to="{ name: 'notifications' }"
          class="block rounded-b-2xl border-t border-slate-100 px-4 py-2.5 text-center text-sm font-medium text-brand-600 hover:bg-slate-50"
          @click="close()"
        >
          {{ $t('notifications.viewAll') }}
        </RouterLink>
      </PopoverPanel>
    </transition>
  </Popover>
</template>
