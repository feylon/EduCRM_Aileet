<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import { useForm, useRules } from '@/composables/useForm';
import { useToast } from '@/composables/useToast';
import { groupsService, type GroupPayload } from '@/services/groups.service';
import { useLookupsStore } from '@/stores/lookups';
import type { Group } from '@/types/models';
import { todayString } from '@/utils/format';

const props = defineProps<{ open: boolean; group?: Group | null }>();
const emit = defineEmits<{ close: []; saved: [group: Group] }>();

const { t } = useI18n();
const toast = useToast();
const rules = useRules();
const lookups = useLookupsStore();
const isEdit = computed(() => !!props.group);

onMounted(() => Promise.all([lookups.loadCourses(), lookups.loadTeachers()]).catch(() => undefined));

const { values, errors, submitting, submit, reset } = useForm(
  {
    name: '',
    courseId: null as string | null,
    teacherId: null as string | null,
    room: '',
    startDate: todayString(),
    endDate: '',
    status: 'planned',
    maxStudents: 15 as number | null,
  },
  {
    name: [rules.required(), rules.maxLength(100)],
    courseId: [rules.required()],
    startDate: [rules.required()],
    endDate: [rules.after('startDate')],
    maxStudents: [rules.required(), rules.min(1), rules.max(100)],
  },
);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    const g = props.group;
    reset(
      g
        ? {
            name: g.name,
            courseId: g.courseId,
            teacherId: g.teacherId,
            room: g.room || '',
            startDate: g.startDate,
            endDate: g.endDate || '',
            status: g.status,
            maxStudents: g.maxStudents,
          }
        : {},
    );
  },
);

const statusOptions = computed(() =>
  ['planned', 'active', 'completed', 'cancelled'].map((value) => ({ value, label: t(`groups.statuses.${value}`) })),
);
const courseOptions = computed(() =>
  lookups.courses.filter((c) => c.isActive || c.id === values.courseId).map((c) => ({ value: c.id, label: c.name })),
);

async function onSubmit() {
  await submit(async () => {
    const data = {
      ...values,
      room: values.room || undefined,
      endDate: values.endDate || undefined,
    } as GroupPayload;
    const saved = isEdit.value ? await groupsService.update(props.group!.id, data) : await groupsService.create(data);
    toast.success(isEdit.value ? t('groups.updated') : t('groups.created'));
    lookups.invalidate('groups');
    emit('saved', saved);
    emit('close');
  });
}
</script>

<template>
  <AppModal :open="open" :title="isEdit ? $t('groups.editTitle') : $t('groups.createTitle')" @close="emit('close')">
    <form id="group-form" class="grid grid-cols-1 gap-4 sm:grid-cols-2" novalidate @submit.prevent="onSubmit">
      <AppInput v-model="values.name" :label="$t('groups.name')" placeholder="IELTS-203" required :error="errors.name" />
      <AppSelect v-model="values.courseId" :options="courseOptions" :label="$t('fields.course')" placeholder="—" required :error="errors.courseId" />
      <AppSelect v-model="values.teacherId" :options="lookups.teacherOptions()" :label="$t('fields.teacher')" :placeholder="$t('groups.noTeacher')" />
      <AppInput v-model="values.room" :label="$t('fields.room')" placeholder="101" />
      <AppInput v-model="values.startDate" type="date" :label="$t('groups.startDate')" required :error="errors.startDate" />
      <AppInput v-model="values.endDate" type="date" :label="$t('groups.endDate')" :error="errors.endDate" />
      <AppSelect v-model="values.status" :options="statusOptions" :label="$t('common.status')" />
      <AppInput v-model="values.maxStudents" type="number" min="1" :label="$t('groups.capacity')" required :error="errors.maxStudents" />
    </form>
    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton type="submit" form="group-form" :loading="submitting">{{ isEdit ? $t('common.save') : $t('common.create') }}</AppButton>
    </template>
  </AppModal>
</template>
