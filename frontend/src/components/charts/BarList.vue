<script setup lang="ts">
import { computed } from 'vue';

/** Ranked horizontal bars in plain HTML — readable labels, one hue, no legend needed. */
const props = withDefaults(
  defineProps<{ items: { label: string; value: number; hint?: string }[]; format?: (value: number) => string }>(),
  { format: (value: number) => String(value) },
);

const max = computed(() => Math.max(1, ...props.items.map((item) => item.value)));
</script>

<template>
  <ul class="space-y-3.5">
    <li v-for="item in items" :key="item.label" class="group" :title="`${item.label}: ${format(item.value)}`">
      <div class="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span class="truncate font-medium text-slate-700">{{ item.label }}</span>
        <span class="shrink-0 tabular-nums text-slate-900">
          {{ format(item.value) }}
          <span v-if="item.hint" class="ml-1 text-xs text-slate-400">{{ item.hint }}</span>
        </span>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          class="h-full rounded-full bg-brand-500 transition-all duration-500 group-hover:bg-brand-600"
          :style="{ width: `${Math.max(2, (item.value / max) * 100)}%` }"
        />
      </div>
    </li>
  </ul>
</template>
