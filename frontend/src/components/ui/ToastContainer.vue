<script setup lang="ts">
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';
import { useUiStore } from '@/stores/ui';

const ui = useUiStore();

const icons = {
  success: { icon: CheckCircleIcon, class: 'text-emerald-500' },
  error: { icon: XCircleIcon, class: 'text-rose-500' },
  warning: { icon: ExclamationTriangleIcon, class: 'text-amber-500' },
  info: { icon: InformationCircleIcon, class: 'text-sky-500' },
};
</script>

<template>
  <div
    aria-live="assertive"
    class="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-4 sm:bottom-auto sm:top-0 sm:items-end sm:p-6"
  >
    <TransitionGroup
      enter-active-class="transition ease-out duration-200"
      enter-from-class="translate-y-2 opacity-0 sm:translate-x-4 sm:translate-y-0"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-for="toast in ui.toasts"
        :key="toast.id"
        class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-popover"
        role="status"
      >
        <div class="flex items-start gap-3 p-4">
          <component :is="icons[toast.type].icon" :class="['mt-0.5 h-5 w-5 shrink-0', icons[toast.type].class]" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-slate-900">{{ toast.title }}</p>
            <p v-if="toast.message" class="mt-0.5 text-sm text-slate-500">{{ toast.message }}</p>
          </div>
          <button
            class="-m-1 rounded-md p-1 text-slate-400 hover:text-slate-600"
            :aria-label="$t('common.close')"
            @click="ui.dismissToast(toast.id)"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>
