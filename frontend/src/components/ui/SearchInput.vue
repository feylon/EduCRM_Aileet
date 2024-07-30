<script setup lang="ts">
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/20/solid';
import { onBeforeUnmount, ref, watch } from 'vue';

const props = withDefaults(defineProps<{ modelValue?: string; placeholder?: string; delay?: number }>(), {
  modelValue: '',
  delay: 350,
});
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const local = ref(props.modelValue);
let timer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => props.modelValue,
  (value) => (local.value = value),
);

watch(local, (value) => {
  clearTimeout(timer);
  timer = setTimeout(() => emit('update:modelValue', value.trim()), props.delay);
});

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div class="relative w-full sm:max-w-xs">
    <MagnifyingGlassIcon class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      v-model="local"
      type="search"
      :placeholder="placeholder || $t('common.search')"
      class="form-control pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden"
    />
    <button
      v-if="local"
      type="button"
      class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
      :aria-label="$t('common.reset')"
      @click="local = ''"
    >
      <XMarkIcon class="h-4 w-4" />
    </button>
  </div>
</template>
