<script setup lang="ts">
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue';
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline';
import { onBeforeUnmount, onMounted } from 'vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue';
import NotificationBell from '@/components/layout/NotificationBell.vue';
import UserMenu from '@/components/layout/UserMenu.vue';
import { useNotificationsStore } from '@/stores/notifications';
import { useUiStore } from '@/stores/ui';

const ui = useUiStore();
const notifications = useNotificationsStore();

onMounted(() => notifications.startPolling());
onBeforeUnmount(() => notifications.stopPolling());
</script>

<template>
  <div class="min-h-screen">
    <!-- Mobile sidebar -->
    <TransitionRoot :show="ui.sidebarOpen" as="template">
      <Dialog class="relative z-50 lg:hidden" @close="ui.sidebarOpen = false">
        <TransitionChild
          as="template"
          enter="transition-opacity ease-linear duration-200"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="transition-opacity ease-linear duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-slate-900/60" />
        </TransitionChild>
        <div class="fixed inset-0 flex">
          <TransitionChild
            as="template"
            enter="transition ease-in-out duration-200 transform"
            enter-from="-translate-x-full"
            enter-to="translate-x-0"
            leave="transition ease-in-out duration-200 transform"
            leave-from="translate-x-0"
            leave-to="-translate-x-full"
          >
            <DialogPanel class="relative mr-16 flex w-full max-w-[17rem] flex-1">
              <button
                type="button"
                class="absolute -right-12 top-4 rounded-lg p-1.5 text-white"
                :aria-label="$t('common.close')"
                @click="ui.sidebarOpen = false"
              >
                <XMarkIcon class="h-6 w-6" />
              </button>
              <AppSidebar class="w-full" @navigate="ui.sidebarOpen = false" />
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Desktop sidebar -->
    <div class="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
      <AppSidebar />
    </div>

    <div class="lg:pl-64">
      <header
        class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur sm:px-6 lg:px-8"
      >
        <button
          type="button"
          class="-ml-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          :aria-label="$t('nav.openMenu')"
          @click="ui.sidebarOpen = true"
        >
          <Bars3Icon class="h-5 w-5" />
        </button>
        <p class="truncate text-sm font-medium text-slate-500">
          <span v-if="$route.meta.title">{{ $t($route.meta.title) }}</span>
        </p>
        <div class="ml-auto flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher compact />
          <NotificationBell />
          <div class="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
          <UserMenu />
        </div>
      </header>

      <main class="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <RouterView v-slot="{ Component }">
          <transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            mode="out-in"
          >
            <component :is="Component" />
          </transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>
