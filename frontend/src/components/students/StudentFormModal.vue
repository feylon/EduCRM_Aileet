<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import { useForm, useRules } from '@/composables/useForm';
import { useToast } from '@/composables/useToast';
import { studentsService, type StudentPayload } from '@/services/students.service';
import type { Student } from '@/types/models';
import { todayString } from '@/utils/format';

const props = defineProps<{ open: boolean; student?: Student | null }>();
const emit = defineEmits<{ close: []; saved: [student: Student] }>();

const { t } = useI18n();
const toast = useToast();
const rules = useRules();
const isEdit = computed(() => !!props.student);

const initial = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  birthDate: '',
  gender: '' as string,
  parentName: '',
  parentPhone: '',
  address: '',
  status: 'active',
  enrolledAt: todayString(),
  notes: '',
};

const { values, errors, submitting, submit, reset } = useForm(initial, {
  firstName: [rules.required(), rules.minLength(2)],
  lastName: [rules.required(), rules.minLength(2)],
  email: [rules.required(), rules.email()],
  phone: [rules.phone()],
  parentPhone: [rules.phone()],
  password: [rules.when(() => !isEdit.value, rules.required()), rules.minLength(6)],
});

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    const s = props.student;
    reset(
      s
        ? {
            firstName: s.user.firstName,
            lastName: s.user.lastName,
            email: s.user.email,
            phone: s.user.phone || '',
            password: '',
            birthDate: s.birthDate || '',
            gender: s.gender || '',
            parentName: s.parentName || '',
            parentPhone: s.parentPhone || '',
            address: s.address || '',
            status: s.status,
            enrolledAt: s.enrolledAt,
            notes: s.notes || '',
          }
        : {},
    );
  },
);

const genderOptions = computed(() => [
  { value: 'male', label: t('students.genders.male') },
  { value: 'female', label: t('students.genders.female') },
]);
const statusOptions = computed(() =>
  ['active', 'frozen', 'graduated', 'left'].map((value) => ({ value, label: t(`students.statuses.${value}`) })),
);

/** Only send filled optional fields. */
function payload(): StudentPayload {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== '' && value !== null) data[key] = value;
  }
  return data as unknown as StudentPayload;
}

async function onSubmit() {
  await submit(async () => {
    const saved = isEdit.value
      ? await studentsService.update(props.student!.id, payload())
      : await studentsService.create(payload());
    toast.success(isEdit.value ? t('students.updated') : t('students.created'));
    emit('saved', saved);
    emit('close');
  });
}
</script>

<template>
  <AppModal
    :open="open"
    size="lg"
    :title="isEdit ? $t('students.editTitle') : $t('students.createTitle')"
    :description="$t('students.formHint')"
    @close="emit('close')"
  >
    <form id="student-form" class="space-y-6" novalidate @submit.prevent="onSubmit">
      <fieldset>
        <legend class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {{ $t('students.sections.personal') }}
        </legend>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppInput v-model="values.firstName" :label="$t('fields.firstName')" required :error="errors.firstName" />
          <AppInput v-model="values.lastName" :label="$t('fields.lastName')" required :error="errors.lastName" />
          <AppInput v-model="values.birthDate" type="date" :label="$t('fields.birthDate')" />
          <AppSelect v-model="values.gender" :options="genderOptions" :label="$t('fields.gender')" placeholder="—" />
        </div>
      </fieldset>

      <fieldset>
        <legend class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {{ $t('students.sections.account') }}
        </legend>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppInput v-model="values.email" type="email" :label="$t('fields.email')" required :error="errors.email" />
          <AppInput v-model="values.phone" type="tel" :label="$t('fields.phone')" placeholder="+998 90 123 45 67" :error="errors.phone" />
          <AppInput
            v-model="values.password"
            type="password"
            autocomplete="new-password"
            :label="isEdit ? $t('fields.newPassword') : $t('fields.password')"
            :required="!isEdit"
            :hint="isEdit ? $t('fields.passwordKeepHint') : undefined"
            :error="errors.password"
          />
          <AppSelect v-model="values.status" :options="statusOptions" :label="$t('common.status')" />
        </div>
      </fieldset>

      <fieldset>
        <legend class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {{ $t('students.sections.family') }}
        </legend>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppInput v-model="values.parentName" :label="$t('fields.parentName')" />
          <AppInput v-model="values.parentPhone" type="tel" :label="$t('fields.parentPhone')" :error="errors.parentPhone" />
          <AppInput v-model="values.address" class="sm:col-span-2" :label="$t('fields.address')" />
          <AppInput v-model="values.enrolledAt" type="date" :label="$t('fields.enrolledAt')" />
          <AppTextarea v-model="values.notes" class="sm:col-span-2" :label="$t('fields.notes')" :rows="2" />
        </div>
      </fieldset>
    </form>

    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton type="submit" form="student-form" :loading="submitting">
        {{ isEdit ? $t('common.save') : $t('common.create') }}
      </AppButton>
    </template>
  </AppModal>
</template>
