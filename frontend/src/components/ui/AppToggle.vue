<script setup lang="ts">
import { Switch, SwitchGroup, SwitchLabel } from '@headlessui/vue';

defineProps<{ modelValue: boolean; label?: string; description?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
</script>

<template>
  <SwitchGroup as="div" class="flex items-center justify-between gap-4">
    <span v-if="label" class="flex flex-col">
      <SwitchLabel as="span" class="text-sm font-medium text-slate-900" passive>{{ label }}</SwitchLabel>
      <span v-if="description" class="text-xs text-slate-500">{{ description }}</span>
    </span>
    <Switch
      :model-value="modelValue"
      :class="[
        modelValue ? 'bg-brand-600' : 'bg-slate-200',
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
      ]"
      @update:model-value="emit('update:modelValue', $event)"
    >
      <span
        aria-hidden="true"
        :class="[
          modelValue ? 'translate-x-5' : 'translate-x-0',
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition',
        ]"
      />
    </Switch>
  </SwitchGroup>
</template>
