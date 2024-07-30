<script setup lang="ts">
import { ArrowTrendingDownIcon, ArrowTrendingUpIcon } from '@heroicons/vue/20/solid';
import type { Component } from 'vue';
import AppSkeleton from './AppSkeleton.vue';

withDefaults(
  defineProps<{
    label: string;
    value?: string | number;
    icon?: Component;
    color?: 'indigo' | 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'pink' | 'teal';
    hint?: string;
    trend?: number | null;
    loading?: boolean;
  }>(),
  { color: 'indigo' },
);

const colors = {
  indigo: 'bg-brand-50 text-brand-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-rose-50 text-rose-600',
  blue: 'bg-sky-50 text-sky-600',
  purple: 'bg-violet-50 text-violet-600',
  pink: 'bg-pink-50 text-pink-600',
  teal: 'bg-teal-50 text-teal-600',
};
</script>

<template>
  <div class="card p-5">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate text-[13px] font-medium text-slate-500">{{ label }}</p>
        <AppSkeleton v-if="loading" class="mt-2.5 h-7 w-24" />
        <p v-else class="mt-1.5 truncate text-2xl font-semibold tracking-tight text-slate-900">{{ value }}</p>
      </div>
      <div v-if="icon" :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', colors[color]]">
        <component :is="icon" class="h-5 w-5" />
      </div>
    </div>
    <div v-if="!loading && (hint || trend !== undefined)" class="mt-3 flex items-center gap-1.5 text-xs">
      <span
        v-if="trend !== undefined && trend !== null"
        :class="[
          'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium',
          trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
        ]"
      >
        <ArrowTrendingUpIcon v-if="trend >= 0" class="h-3.5 w-3.5" />
        <ArrowTrendingDownIcon v-else class="h-3.5 w-3.5" />
        {{ Math.abs(trend) }}%
      </span>
      <span class="truncate text-slate-500">{{ hint }}</span>
    </div>
  </div>
</template>
