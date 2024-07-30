<script setup lang="ts">
export type BadgeColor = 'gray' | 'green' | 'red' | 'amber' | 'blue' | 'indigo' | 'purple' | 'pink' | 'teal';

withDefaults(defineProps<{ color?: BadgeColor; dot?: boolean }>(), { color: 'gray' });

const colors: Record<BadgeColor, string> = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-500/10',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  indigo: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  purple: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  pink: 'bg-pink-50 text-pink-700 ring-pink-600/20',
  teal: 'bg-teal-50 text-teal-700 ring-teal-600/20',
};
const dots: Record<BadgeColor, string> = {
  gray: 'bg-slate-400',
  green: 'bg-emerald-500',
  red: 'bg-rose-500',
  amber: 'bg-amber-500',
  blue: 'bg-sky-500',
  indigo: 'bg-brand-500',
  purple: 'bg-violet-500',
  pink: 'bg-pink-500',
  teal: 'bg-teal-500',
};
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
      colors[color],
    ]"
  >
    <span v-if="dot" :class="['h-1.5 w-1.5 rounded-full', dots[color]]" />
    <slot />
  </span>
</template>
