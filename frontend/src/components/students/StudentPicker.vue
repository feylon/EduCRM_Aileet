<script setup lang="ts">
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/vue';
import { ChevronUpDownIcon } from '@heroicons/vue/20/solid';
import { onBeforeUnmount, ref, watch } from 'vue';
import { studentsService } from '@/services/students.service';
import type { Student } from '@/types/models';
import { fullName } from '@/utils/format';

/** Searchable student select (server-side search). */
const props = defineProps<{ modelValue: Student | null; label?: string; error?: string | null; required?: boolean; disabled?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [student: Student | null] }>();

const query = ref('');
const results = ref<Student[]>([]);
const loading = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

async function search() {
  loading.value = true;
  try {
    results.value = (await studentsService.list({ search: query.value, limit: 10, sortBy: 'firstName', sortOrder: 'ASC' })).items;
  } finally {
    loading.value = false;
  }
}

watch(query, () => {
  clearTimeout(timer);
  timer = setTimeout(search, 300);
});
onBeforeUnmount(() => clearTimeout(timer));
search();
</script>

<template>
  <Combobox :model-value="props.modelValue" :disabled="disabled" nullable @update:model-value="emit('update:modelValue', $event)">
    <div class="relative">
      <label v-if="label" class="form-label">{{ label }}<span v-if="required" class="text-rose-500"> *</span></label>
      <div class="relative">
        <ComboboxInput
          :class="['form-control pr-9', { 'form-control-error': error }]"
          :display-value="(student: unknown) => (student ? fullName((student as Student).user) : '')"
          :placeholder="$t('payments.searchStudent')"
          autocomplete="off"
          @change="query = $event.target.value"
        />
        <ComboboxButton class="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
          <ChevronUpDownIcon class="h-5 w-5" />
        </ComboboxButton>
      </div>
      <ComboboxOptions class="absolute z-40 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-100 bg-white p-1 shadow-popover focus:outline-none">
        <li v-if="loading && !results.length" class="px-3 py-2 text-sm text-slate-500">{{ $t('common.loading') }}</li>
        <li v-else-if="!results.length" class="px-3 py-2 text-sm text-slate-500">{{ $t('empty.title') }}</li>
        <ComboboxOption v-for="student in results" :key="student.id" v-slot="{ active, selected }" :value="student" as="template">
          <li :class="['cursor-pointer rounded-lg px-3 py-2', active ? 'bg-brand-50' : '', selected ? 'font-semibold' : '']">
            <p class="text-sm text-slate-900">{{ fullName(student.user) }}</p>
            <p class="text-xs text-slate-500">{{ student.user.phone || student.user.email }}</p>
          </li>
        </ComboboxOption>
      </ComboboxOptions>
      <p v-if="error" class="form-error">{{ error }}</p>
    </div>
  </Combobox>
</template>
