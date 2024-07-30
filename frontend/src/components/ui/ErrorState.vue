<script setup lang="ts">
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline';
import AppButton from './AppButton.vue';

defineProps<{ message?: string }>();
const emit = defineEmits<{ retry: [] }>();
</script>

<template>
  <div class="flex flex-col items-center justify-center py-14 text-center">
    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
      <ExclamationCircleIcon class="h-6 w-6" />
    </div>
    <h3 class="mt-4 text-sm font-semibold text-slate-900">{{ $t('empty.errorTitle') }}</h3>
    <p class="mt-1 max-w-sm text-sm text-slate-500">{{ message || $t('errors.unknown') }}</p>
    <AppButton class="mt-5" variant="secondary" size="sm" @click="emit('retry')">{{ $t('common.retry') }}</AppButton>
  </div>
</template>
