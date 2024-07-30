<script setup lang="ts">
import { computed } from 'vue';
import { useFieldId } from '@/composables/useFieldId';

export interface SelectOption {
  value: string | number | null;
  label: string;
  disabled?: boolean;
}

const props = defineProps<{
  modelValue?: string | number | null;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string | number | null] }>();
const id = useFieldId();

const value = computed({
  get: () => props.modelValue ?? '',
  set: (val) => emit('update:modelValue', val === '' ? null : val),
});
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="form-label">
      {{ label }}<span v-if="required" class="text-rose-500"> *</span>
    </label>
    <select
      :id="id"
      v-model="value"
      :disabled="disabled"
      :aria-invalid="!!error"
      :class="['form-control pr-9', { 'form-control-error': error, 'text-slate-400': value === '' }]"
    >
      <option v-if="placeholder !== undefined" value="">{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="String(option.value)"
        :value="option.value"
        :disabled="option.disabled"
        class="text-slate-900"
      >
        {{ option.label }}
      </option>
    </select>
    <p v-if="error" class="form-error">{{ error }}</p>
  </div>
</template>
