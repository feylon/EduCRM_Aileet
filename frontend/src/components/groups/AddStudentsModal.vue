<script setup lang="ts">
import { CheckCircleIcon } from '@heroicons/vue/20/solid';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppAvatar from '@/components/ui/AppAvatar.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
import { useToast } from '@/composables/useToast';
import { groupsService } from '@/services/groups.service';
import { studentsService } from '@/services/students.service';
import type { Student } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { fullName, todayString } from '@/utils/format';

const props = defineProps<{ open: boolean; groupId: string; existingIds: string[]; freeSeats: number }>();
const emit = defineEmits<{ close: []; added: [] }>();

const { t } = useI18n();
const toast = useToast();
const search = ref('');
const students = ref<Student[]>([]);
const loading = ref(false);
const saving = ref(false);
const selected = ref<string[]>([]);
const joinedAt = ref(todayString());

async function load() {
  loading.value = true;
  try {
    const result = await studentsService.list({ search: search.value, status: 'active', limit: 30, sortBy: 'firstName', sortOrder: 'ASC' });
    students.value = result.items.filter((s) => !props.existingIds.includes(s.id));
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    selected.value = [];
    search.value = '';
    joinedAt.value = todayString();
    load();
  },
);
watch(search, load);

const overCapacity = computed(() => selected.value.length > props.freeSeats);

function toggle(id: string) {
  selected.value = selected.value.includes(id) ? selected.value.filter((x) => x !== id) : [...selected.value, id];
}

async function save() {
  saving.value = true;
  try {
    await groupsService.addStudents(props.groupId, selected.value, joinedAt.value);
    toast.success(t('groups.studentsAdded', { count: selected.value.length }));
    emit('added');
    emit('close');
  } catch (error) {
    toast.error(getErrorMessage(error));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <AppModal :open="open" :title="$t('groups.addStudents')" :description="$t('groups.freeSeats', { count: freeSeats })" @close="emit('close')">
    <div class="space-y-4">
      <SearchInput v-model="search" class="!max-w-none" />
      <div class="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
        <div v-if="loading" class="space-y-2 p-3"><AppSkeleton v-for="i in 4" :key="i" class="h-10" /></div>
        <p v-else-if="!students.length" class="px-4 py-8 text-center text-sm text-slate-500">{{ $t('empty.title') }}</p>
        <button
          v-for="student in students"
          v-else
          :key="student.id"
          type="button"
          :class="['flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left last:border-0 transition', selected.includes(student.id) ? 'bg-brand-50/60' : 'hover:bg-slate-50']"
          @click="toggle(student.id)"
        >
          <AppAvatar :name="fullName(student.user)" size="sm" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium text-slate-900">{{ fullName(student.user) }}</span>
            <span class="block truncate text-xs text-slate-500">{{ student.user.phone || student.user.email }}</span>
          </span>
          <CheckCircleIcon :class="['h-5 w-5', selected.includes(student.id) ? 'text-brand-600' : 'text-slate-200']" />
        </button>
      </div>
      <AppInput v-model="joinedAt" type="date" :label="$t('groups.joinedAt')" />
      <p v-if="overCapacity" class="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{{ $t('errors.GROUP_IS_FULL') }}</p>
    </div>
    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton :disabled="!selected.length || overCapacity" :loading="saving" @click="save">
        {{ $t('groups.addSelected', { count: selected.length }) }}
      </AppButton>
    </template>
  </AppModal>
</template>
