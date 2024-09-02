<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import { useForm, useRules } from '@/composables/useForm';
import { useToast } from '@/composables/useToast';
import { leadsService } from '@/services/leads.service';
import { useLookupsStore } from '@/stores/lookups';
import type { Lead } from '@/types/models';

/** Turns a lead into a student account and optionally enrolls them into a group. */
const props = defineProps<{ open: boolean; lead: Lead | null }>();
const emit = defineEmits<{ close: []; converted: [] }>();

const { t } = useI18n();
const toast = useToast();
const rules = useRules();
const lookups = useLookupsStore();

onMounted(() => lookups.loadGroups().catch(() => undefined));

const { values, errors, submitting, submit, reset } = useForm(
  { firstName: '', lastName: '', email: '', password: '', groupId: null as string | null },
  {
    firstName: [rules.required(), rules.minLength(2)],
    lastName: [rules.required(), rules.minLength(2)],
    email: [rules.required(), rules.email()],
    password: [rules.required(), rules.minLength(6)],
  },
);

watch(
  () => props.open,
  (open) => {
    if (!open || !props.lead) return;
    const [firstName = '', ...rest] = props.lead.fullName.split(' ');
    reset({ firstName, lastName: rest.join(' '), email: props.lead.email || '', password: '' });
  },
);

/** Groups of the lead's course come first. */
const groupOptions = computed(() =>
  lookups.groups
    .filter((group) => ['active', 'planned'].includes(group.status))
    .sort((a, b) => Number(b.courseId === props.lead?.courseId) - Number(a.courseId === props.lead?.courseId))
    .map((group) => ({ value: group.id, label: `${group.name} · ${group.course?.name ?? ''}` })),
);

async function onSubmit() {
  await submit(async () => {
    await leadsService.convert(props.lead!.id, { ...values, groupId: values.groupId || undefined });
    toast.success(t('leads.converted'));
    lookups.invalidate('groups');
    emit('converted');
    emit('close');
  });
}
</script>

<template>
  <AppModal :open="open" :title="$t('leads.convertTitle')" :description="$t('leads.convertHint')" @close="emit('close')">
    <form id="convert-form" class="grid grid-cols-1 gap-4 sm:grid-cols-2" novalidate @submit.prevent="onSubmit">
      <AppInput v-model="values.firstName" :label="$t('fields.firstName')" required :error="errors.firstName" />
      <AppInput v-model="values.lastName" :label="$t('fields.lastName')" required :error="errors.lastName" />
      <AppInput v-model="values.email" type="email" :label="$t('fields.email')" required :error="errors.email" />
      <AppInput v-model="values.password" type="password" autocomplete="new-password" :label="$t('fields.password')" required :error="errors.password" />
      <AppSelect v-model="values.groupId" class="sm:col-span-2" :options="groupOptions" :label="$t('leads.enrollInto')" :placeholder="$t('leads.noEnroll')" />
    </form>
    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton type="submit" form="convert-form" :loading="submitting">{{ $t('leads.convert') }}</AppButton>
    </template>
  </AppModal>
</template>
