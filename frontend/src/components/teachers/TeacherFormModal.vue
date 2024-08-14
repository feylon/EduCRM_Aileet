<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppToggle from '@/components/ui/AppToggle.vue';
import ChipSelect from '@/components/ui/ChipSelect.vue';
import { useForm, useRules } from '@/composables/useForm';
import { useToast } from '@/composables/useToast';
import { teachersService, type TeacherPayload } from '@/services/teachers.service';
import { useLookupsStore } from '@/stores/lookups';
import type { Teacher } from '@/types/models';

const props = defineProps<{ open: boolean; teacher?: Teacher | null }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const { t } = useI18n();
const toast = useToast();
const rules = useRules();
const lookups = useLookupsStore();
const isEdit = computed(() => !!props.teacher);

onMounted(() => lookups.loadCourses().catch(() => undefined));

const { values, errors, submitting, submit, reset } = useForm(
  {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    specialization: '',
    experienceYears: 0 as number | null,
    hireDate: '',
    salary: null as number | null,
    bio: '',
    courseIds: [] as string[],
    isActive: true,
  },
  {
    firstName: [rules.required(), rules.minLength(2)],
    lastName: [rules.required(), rules.minLength(2)],
    email: [rules.required(), rules.email()],
    phone: [rules.phone()],
    password: [rules.when(() => !isEdit.value, rules.required()), rules.minLength(6)],
    experienceYears: [rules.min(0), rules.max(60)],
    salary: [rules.min(0)],
  },
);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    const teacher = props.teacher;
    reset(
      teacher
        ? {
            firstName: teacher.user.firstName,
            lastName: teacher.user.lastName,
            email: teacher.user.email,
            phone: teacher.user.phone || '',
            password: '',
            specialization: teacher.specialization || '',
            experienceYears: teacher.experienceYears,
            hireDate: teacher.hireDate || '',
            salary: teacher.salary,
            bio: teacher.bio || '',
            courseIds: [...(teacher.courseIds || [])],
            isActive: teacher.user.isActive,
          }
        : {},
    );
  },
);

function payload(): TeacherPayload {
  const data: Record<string, unknown> = { ...values };
  for (const key of Object.keys(data)) {
    if (data[key] === '' || data[key] === null) delete data[key];
  }
  if (!isEdit.value) delete data.isActive;
  return data as unknown as TeacherPayload;
}

async function onSubmit() {
  await submit(async () => {
    if (isEdit.value) await teachersService.update(props.teacher!.id, payload());
    else await teachersService.create(payload());
    toast.success(isEdit.value ? t('teachers.updated') : t('teachers.created'));
    lookups.invalidate('teachers');
    emit('saved');
    emit('close');
  });
}
</script>

<template>
  <AppModal
    :open="open"
    size="lg"
    :title="isEdit ? $t('teachers.editTitle') : $t('teachers.createTitle')"
    :description="$t('teachers.formHint')"
    @close="emit('close')"
  >
    <form id="teacher-form" class="space-y-6" novalidate @submit.prevent="onSubmit">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppInput v-model="values.firstName" :label="$t('fields.firstName')" required :error="errors.firstName" />
        <AppInput v-model="values.lastName" :label="$t('fields.lastName')" required :error="errors.lastName" />
        <AppInput v-model="values.email" type="email" :label="$t('fields.email')" required :error="errors.email" />
        <AppInput v-model="values.phone" type="tel" :label="$t('fields.phone')" :error="errors.phone" />
        <AppInput
          v-model="values.password"
          type="password"
          autocomplete="new-password"
          :label="isEdit ? $t('fields.newPassword') : $t('fields.password')"
          :required="!isEdit"
          :hint="isEdit ? $t('fields.passwordKeepHint') : undefined"
          :error="errors.password"
        />
        <AppInput v-model="values.specialization" :label="$t('teachers.specialization')" :placeholder="$t('teachers.specializationPlaceholder')" />
        <AppInput v-model="values.experienceYears" type="number" min="0" :label="$t('teachers.experience')" :error="errors.experienceYears" />
        <AppInput v-model="values.hireDate" type="date" :label="$t('teachers.hireDate')" />
        <AppInput v-model="values.salary" type="number" min="0" step="10000" :label="$t('teachers.salary')" :error="errors.salary" />
      </div>
      <ChipSelect v-model="values.courseIds" :options="lookups.courseOptions().map((o) => ({ value: String(o.value), label: o.label }))" :label="$t('teachers.courses')" />
      <AppTextarea v-model="values.bio" :label="$t('teachers.bio')" :rows="3" />
      <div v-if="isEdit" class="rounded-lg border border-slate-200 p-4">
        <AppToggle v-model="values.isActive" :label="$t('teachers.accountActive')" :description="$t('teachers.accountActiveHint')" />
      </div>
    </form>
    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton type="submit" form="teacher-form" :loading="submitting">
        {{ isEdit ? $t('common.save') : $t('common.create') }}
      </AppButton>
    </template>
  </AppModal>
</template>
