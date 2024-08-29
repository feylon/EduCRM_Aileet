<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import StudentPicker from '@/components/students/StudentPicker.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import { useForm, useRules } from '@/composables/useForm';
import { useToast } from '@/composables/useToast';
import { PAYMENT_METHODS, paymentsService, type PaymentPayload } from '@/services/payments.service';
import { studentsService } from '@/services/students.service';
import type { Payment, Student } from '@/types/models';
import { currentMonthString, todayString } from '@/utils/format';

/** Create or edit a payment. `presetStudentId`/`presetGroupId` prefill it (e.g. from the debtors list). */
const props = defineProps<{
  open: boolean;
  payment?: Payment | null;
  presetStudentId?: string | null;
  presetGroupId?: string | null;
  presetAmount?: number | null;
}>();
const emit = defineEmits<{ close: []; saved: [] }>();

const { t } = useI18n();
const toast = useToast();
const rules = useRules();
const isEdit = computed(() => !!props.payment);
const student = ref<Student | null>(null);

const { values, errors, submitting, submit, reset } = useForm(
  {
    groupId: null as string | null,
    amount: null as number | null,
    method: 'cash',
    status: 'paid',
    forMonth: currentMonthString(),
    paidAt: todayString(),
    note: '',
  },
  {
    amount: [rules.required(), rules.min(1)],
    method: [rules.required()],
    forMonth: [rules.required()],
  },
);
const studentError = ref<string | null>(null);

watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    studentError.value = null;
    const p = props.payment;
    if (p) {
      student.value = p.student;
      reset({ groupId: p.groupId, amount: p.amount, method: p.method, status: p.status, forMonth: p.forMonth, paidAt: p.paidAt, note: p.note || '' });
      // the list payload has no groups, load the full student for the group select
      studentsService.get(p.studentId).then((full) => (student.value = full)).catch(() => undefined);
    } else {
      reset({ groupId: props.presetGroupId ?? null, amount: props.presetAmount ?? null });
      student.value = props.presetStudentId ? await studentsService.get(props.presetStudentId).catch(() => null) : null;
    }
  },
);

const groupOptions = computed(() =>
  (student.value?.groupLinks || []).map((link) => ({ value: link.groupId, label: `${link.group?.name} · ${link.group?.course?.name ?? ''}` })),
);

// Picking a group pre-fills its monthly price.
watch(
  () => values.groupId,
  (groupId) => {
    if (isEdit.value || values.amount) return;
    const link = student.value?.groupLinks?.find((item) => item.groupId === groupId);
    if (link?.group?.course?.price) values.amount = link.group.course.price;
  },
);
watch(student, (next) => {
  if (isEdit.value) return;
  if (next && groupOptions.value.length === 1 && !values.groupId) values.groupId = String(groupOptions.value[0].value);
});

const methodOptions = computed(() => PAYMENT_METHODS.map((value) => ({ value, label: t(`payments.methods.${value}`) })));
const statusOptions = computed(() => ['paid', 'refunded'].map((value) => ({ value, label: t(`payments.statuses.${value}`) })));

async function onSubmit() {
  if (!student.value) {
    studentError.value = t('validation.required');
    return;
  }
  studentError.value = null;
  await submit(async () => {
    const data = {
      groupId: values.groupId || undefined,
      amount: Number(values.amount),
      method: values.method,
      status: values.status,
      forMonth: values.forMonth,
      paidAt: values.paidAt || undefined,
      note: values.note || undefined,
    } as Omit<PaymentPayload, 'studentId'>;
    if (isEdit.value) await paymentsService.update(props.payment!.id, data);
    else await paymentsService.create({ ...data, studentId: student.value!.id });
    toast.success(isEdit.value ? t('payments.updated') : t('payments.created'));
    emit('saved');
    emit('close');
  });
}
</script>

<template>
  <AppModal :open="open" :title="isEdit ? $t('payments.editTitle') : $t('payments.createTitle')" @close="emit('close')">
    <form id="payment-form" class="grid grid-cols-1 gap-4 sm:grid-cols-2" novalidate @submit.prevent="onSubmit">
      <StudentPicker v-model="student" class="sm:col-span-2" :label="$t('students.columns.student')" required :disabled="isEdit" :error="studentError" />
      <AppSelect
        v-model="values.groupId"
        class="sm:col-span-2"
        :options="groupOptions"
        :label="$t('fields.group')"
        :placeholder="$t('payments.noGroup')"
        :disabled="!student"
      />
      <AppInput v-model="values.amount" type="number" min="0" step="1000" :label="$t('payments.amount')" required :error="errors.amount" />
      <AppSelect v-model="values.method" :options="methodOptions" :label="$t('payments.method')" required />
      <AppInput v-model="values.forMonth" type="month" :label="$t('payments.forMonth')" required :error="errors.forMonth" />
      <AppInput v-model="values.paidAt" type="date" :label="$t('payments.paidAt')" />
      <AppSelect v-if="isEdit" v-model="values.status" :options="statusOptions" :label="$t('common.status')" />
      <AppTextarea v-model="values.note" class="sm:col-span-2" :label="$t('fields.notes')" :rows="2" />
    </form>
    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton type="submit" form="payment-form" :loading="submitting">{{ isEdit ? $t('common.save') : $t('payments.accept') }}</AppButton>
    </template>
  </AppModal>
</template>
