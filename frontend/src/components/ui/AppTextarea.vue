<script setup lang="ts">
import { computed } from 'vue';
import { useFieldId } from '@/composables/useFieldId';

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    label?: string;
    placeholder?: string;
    error?: string | null;
    rows?: number;
    required?: boolean;
  }>(),
  { rows: 3 },
);

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const id = useFieldId();

const value = computed({
  get: () => props.modelValue ?? '',
  set: (val) => emit('update:modelValue', val),
});
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="form-label">
      {{ label }}<span v-if="required" class="text-rose-500"> *</span>
    </label>
    <textarea
      :id="id"
      v-model="value"
      :rows="rows"
      :placeholder="placeholder"
      :class="['form-control resize-y', { 'form-control-error': error }]"
    />
    <p v-if="error" class="form-error">{{ error }}</p>
  </div>
</template>
