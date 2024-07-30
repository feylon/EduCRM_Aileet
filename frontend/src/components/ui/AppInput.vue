<script setup lang="ts">
import { computed } from 'vue';
import { useFieldId } from '@/composables/useFieldId';

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    label?: string;
    type?: string;
    placeholder?: string;
    error?: string | null;
    hint?: string;
    required?: boolean;
    disabled?: boolean;
    autocomplete?: string;
    min?: string | number;
    max?: string | number;
    step?: string | number;
  }>(),
  { type: 'text' },
);

const emit = defineEmits<{ 'update:modelValue': [value: string | number | null]; blur: [] }>();
const id = useFieldId();

const value = computed({
  get: () => props.modelValue ?? '',
  set: (val) => {
    if (props.type === 'number') emit('update:modelValue', val === '' ? null : Number(val));
    else emit('update:modelValue', val as string);
  },
});
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="form-label">
      {{ label }}<span v-if="required" class="text-rose-500"> *</span>
    </label>
    <div class="relative">
      <div v-if="$slots.prefix" class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
        <slot name="prefix" />
      </div>
      <input
        :id="id"
        v-model="value"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :min="min"
        :max="max"
        :step="step"
        :aria-invalid="!!error"
        :class="['form-control', { 'form-control-error': error, 'pl-9': $slots.prefix, 'pr-10': $slots.suffix }]"
        @blur="emit('blur')"
      />
      <div v-if="$slots.suffix" class="absolute inset-y-0 right-0 flex items-center pr-2">
        <slot name="suffix" />
      </div>
    </div>
    <p v-if="error" class="form-error">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-slate-500">{{ hint }}</p>
  </div>
</template>
