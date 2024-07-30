<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
import { ExclamationTriangleIcon, QuestionMarkCircleIcon } from '@heroicons/vue/24/outline';
import { computed } from 'vue';
import { useUiStore } from '@/stores/ui';
import AppButton from './AppButton.vue';

const ui = useUiStore();
const state = computed(() => ui.confirmState);
</script>

<template>
  <TransitionRoot :show="state.open" as="template">
    <Dialog class="relative z-[60]" @close="ui.resolveConfirm(false)">
      <TransitionChild
        as="template"
        enter="ease-out duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
      </TransitionChild>
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="ease-out duration-200"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-150"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-popover">
              <div class="flex gap-4">
                <div
                  :class="[
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    state.variant === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-600',
                  ]"
                >
                  <ExclamationTriangleIcon v-if="state.variant === 'danger'" class="h-5 w-5" />
                  <QuestionMarkCircleIcon v-else class="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle class="text-base font-semibold text-slate-900">{{ state.title }}</DialogTitle>
                  <p v-if="state.message" class="mt-1.5 text-sm text-slate-500">{{ state.message }}</p>
                </div>
              </div>
              <div class="mt-6 flex justify-end gap-2">
                <AppButton variant="secondary" @click="ui.resolveConfirm(false)">
                  {{ state.cancelText || $t('common.cancel') }}
                </AppButton>
                <AppButton :variant="state.variant === 'danger' ? 'danger' : 'primary'" @click="ui.resolveConfirm(true)">
                  {{ state.confirmText || $t('common.confirm') }}
                </AppButton>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
