<script setup lang="ts">
defineProps<{ modelValue: string; tabs: { value: string; label: string; count?: number }[] }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <div class="scrollbar-thin -mb-px flex gap-1 overflow-x-auto border-b border-slate-200">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      :class="[
        'inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition',
        modelValue === tab.value
          ? 'border-brand-600 text-brand-700'
          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
      ]"
      @click="emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
      <span
        v-if="tab.count !== undefined"
        :class="[
          'rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
          modelValue === tab.value ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600',
        ]"
      >
        {{ tab.count }}
      </span>
    </button>
  </div>
</template>
