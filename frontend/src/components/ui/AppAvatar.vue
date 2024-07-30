<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{ name: string; size?: 'xs' | 'sm' | 'md' | 'lg' }>(), { size: 'md' });

const PALETTE = [
  'bg-brand-100 text-brand-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-teal-100 text-teal-700',
  'bg-pink-100 text-pink-700',
];

const initials = computed(() =>
  props.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join(''),
);

const color = computed(() => {
  let hash = 0;
  for (const char of props.name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
});

const sizes = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-14 w-14 text-lg' };
</script>

<template>
  <span :class="['inline-flex shrink-0 items-center justify-center rounded-full font-semibold', sizes[size], color]">
    {{ initials || '?' }}
  </span>
</template>
