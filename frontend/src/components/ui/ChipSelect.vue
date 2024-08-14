<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/20/solid';

/** Multi-select rendered as toggleable chips — friendlier than <select multiple> on touch devices. */
const props = defineProps<{ modelValue: string[]; options: { value: string; label: string }[]; label?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();

function toggle(value: string) {
  const set = new Set(props.modelValue);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  emit('update:modelValue', [...set]);
}
</script>

<template>
  <div>
    <p v-if="label" class="form-label">{{ label }}</p>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :aria-pressed="modelValue.includes(option.value)"
        :class="[
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
          modelValue.includes(option.value)
            ? 'border-brand-200 bg-brand-50 text-brand-700'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
        ]"
        @click="toggle(option.value)"
      >
        <CheckIcon v-if="modelValue.includes(option.value)" class="h-3.5 w-3.5" />
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
