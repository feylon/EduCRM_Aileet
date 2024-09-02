<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import { useForm, useRules } from '@/composables/useForm';
import { useToast } from '@/composables/useToast';
import { LEAD_SOURCES, LEAD_STATUSES, leadsService, type LeadPayload } from '@/services/leads.service';
import { useLookupsStore } from '@/stores/lookups';
import type { Lead } from '@/types/models';

const props = defineProps<{ open: boolean; lead?: Lead | null }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const { t } = useI18n();
const toast = useToast();
const rules = useRules();
const lookups = useLookupsStore();
const isEdit = computed(() => !!props.lead);

onMounted(() => Promise.all([lookups.loadCourses(), lookups.loadAdmins()]).catch(() => undefined));

/** datetime-local works with local "YYYY-MM-DDTHH:mm" strings. */
function toLocalInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const { values, errors, submitting, submit, reset } = useForm(
  {
    fullName: '',
    phone: '',
    email: '',
    source: 'instagram',
    status: 'new',
    courseId: null as string | null,
    assignedToId: null as string | null,
    nextContactAt: '',
    note: '',
    lostReason: '',
  },
  {
    fullName: [rules.required(), rules.minLength(2)],
    phone: [rules.required(), rules.phone()],
    email: [rules.email()],
  },
);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    const l = props.lead;
    reset(
      l
        ? {
            fullName: l.fullName,
            phone: l.phone,
            email: l.email || '',
            source: l.source,
            status: l.status,
            courseId: l.courseId,
            assignedToId: l.assignedToId,
            nextContactAt: toLocalInput(l.nextContactAt),
            note: l.note || '',
            lostReason: l.lostReason || '',
          }
        : {},
    );
  },
);

const statusOptions = computed(() =>
  LEAD_STATUSES.filter((status) => status !== 'converted' || props.lead?.status === 'converted').map((value) => ({
    value,
    label: t(`leads.statuses.${value}`),
  })),
);
const sourceOptions = computed(() => LEAD_SOURCES.map((value) => ({ value, label: t(`leads.sources.${value}`) })));

async function onSubmit() {
  await submit(async () => {
    const data: LeadPayload = {
      fullName: values.fullName,
      phone: values.phone,
      email: values.email || undefined,
      source: values.source as LeadPayload['source'],
      courseId: values.courseId || null,
      assignedToId: values.assignedToId || null,
      nextContactAt: values.nextContactAt ? new Date(values.nextContactAt).toISOString() : null,
      note: values.note || undefined,
      lostReason: values.status === 'lost' ? values.lostReason || undefined : undefined,
    };
    if (values.status !== 'converted') data.status = values.status as LeadPayload['status'];
    if (isEdit.value) await leadsService.update(props.lead!.id, data);
    else await leadsService.create(data);
    toast.success(isEdit.value ? t('leads.updated') : t('leads.created'));
    emit('saved');
    emit('close');
  });
}
</script>

<template>
  <AppModal :open="open" :title="isEdit ? $t('leads.editTitle') : $t('leads.createTitle')" @close="emit('close')">
    <form id="lead-form" class="grid grid-cols-1 gap-4 sm:grid-cols-2" novalidate @submit.prevent="onSubmit">
      <AppInput v-model="values.fullName" class="sm:col-span-2" :label="$t('fields.fullName')" required :error="errors.fullName" />
      <AppInput v-model="values.phone" type="tel" :label="$t('fields.phone')" placeholder="+998 90 123 45 67" required :error="errors.phone" />
      <AppInput v-model="values.email" type="email" :label="$t('fields.email')" :error="errors.email" />
      <AppSelect v-model="values.source" :options="sourceOptions" :label="$t('leads.source')" />
      <AppSelect v-model="values.status" :options="statusOptions" :label="$t('common.status')" :disabled="lead?.status === 'converted'" />
      <AppSelect v-model="values.courseId" :options="lookups.courseOptions()" :label="$t('leads.interestedIn')" placeholder="—" />
      <AppSelect v-model="values.assignedToId" :options="lookups.adminOptions()" :label="$t('leads.assignedTo')" :placeholder="$t('leads.unassigned')" />
      <AppInput v-model="values.nextContactAt" class="sm:col-span-2" type="datetime-local" :label="$t('leads.nextContact')" />
      <AppInput v-if="values.status === 'lost'" v-model="values.lostReason" class="sm:col-span-2" :label="$t('leads.lostReason')" />
      <AppTextarea v-model="values.note" class="sm:col-span-2" :label="$t('fields.notes')" :rows="3" />
    </form>
    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton type="submit" form="lead-form" :loading="submitting">{{ isEdit ? $t('common.save') : $t('common.create') }}</AppButton>
    </template>
  </AppModal>
</template>
