<script setup lang="ts">
import { computed, type Component } from 'vue';
import AppSpinner from './AppSpinner.vue';

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'soft';
    size?: 'sm' | 'md' | 'lg';
    type?: 'button' | 'submit' | 'reset';
    loading?: boolean;
    disabled?: boolean;
    icon?: Component;
    block?: boolean;
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
);

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap',
  {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
  }[props.size],
  {
    primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:ring-brand-500',
    secondary: 'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:ring-brand-500',
    danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-500',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-brand-500',
    soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100 focus-visible:ring-brand-500',
  }[props.variant],
  props.block ? 'w-full' : '',
]);
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled || loading">
    <AppSpinner v-if="loading" class="h-4 w-4" />
    <component :is="icon" v-else-if="icon" class="h-4 w-4 shrink-0" aria-hidden="true" />
    <slot />
  </button>
</template>
