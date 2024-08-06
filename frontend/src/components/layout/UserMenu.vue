<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { ArrowRightOnRectangleIcon, ChevronDownIcon, UserCircleIcon } from '@heroicons/vue/20/solid';
import { useRouter } from 'vue-router';
import AppAvatar from '@/components/ui/AppAvatar.vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';

const auth = useAuthStore();
const notifications = useNotificationsStore();
const router = useRouter();

async function logout() {
  notifications.stopPolling();
  await auth.logout();
  router.replace({ name: 'login' });
}
</script>

<template>
  <Menu as="div" class="relative">
    <MenuButton
      class="flex items-center gap-2 rounded-lg p-1 pr-2 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <AppAvatar :name="`${auth.user?.firstName} ${auth.user?.lastName}`" size="sm" />
      <span class="hidden text-left leading-tight md:block">
        <span class="block text-sm font-medium text-slate-900">{{ auth.user?.firstName }}</span>
        <span class="block text-[11px] text-slate-500">{{ $t(`roles.${auth.role}`) }}</span>
      </span>
      <ChevronDownIcon class="hidden h-4 w-4 text-slate-400 md:block" />
    </MenuButton>
    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <MenuItems
        class="absolute right-0 z-40 mt-2 w-56 origin-top-right rounded-xl border border-slate-100 bg-white p-1 shadow-popover focus:outline-none"
      >
        <div class="border-b border-slate-100 px-3 py-2.5">
          <p class="truncate text-sm font-medium text-slate-900">{{ auth.user?.firstName }} {{ auth.user?.lastName }}</p>
          <p class="truncate text-xs text-slate-500">{{ auth.user?.email }}</p>
        </div>
        <div class="pt-1">
          <MenuItem v-slot="{ active }">
            <RouterLink
              :to="{ name: 'profile' }"
              :class="['flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700', active ? 'bg-slate-50' : '']"
            >
              <UserCircleIcon class="h-4 w-4 text-slate-400" />
              {{ $t('nav.profile') }}
            </RouterLink>
          </MenuItem>
          <MenuItem v-slot="{ active }">
            <button
              :class="['flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-600', active ? 'bg-rose-50' : '']"
              @click="logout"
            >
              <ArrowRightOnRectangleIcon class="h-4 w-4" />
              {{ $t('auth.logout') }}
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>
