<script setup lang="ts">
import { InboxIcon } from '@heroicons/vue/24/outline';
import type { Component } from 'vue';

withDefaults(defineProps<{ title?: string; description?: string; icon?: Component; compact?: boolean }>(), {
  icon: () => InboxIcon,
});
</script>

<template>
  <div :class="['flex flex-col items-center justify-center text-center', compact ? 'py-8' : 'py-14']">
    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      <component :is="icon" class="h-6 w-6" />
    </div>
    <h3 class="mt-4 text-sm font-semibold text-slate-900">{{ title || $t('empty.title') }}</h3>
    <p class="mt-1 max-w-sm text-sm text-slate-500">{{ description || $t('empty.description') }}</p>
    <div v-if="$slots.default" class="mt-5">
      <slot />
    </div>
  </div>
</template>
