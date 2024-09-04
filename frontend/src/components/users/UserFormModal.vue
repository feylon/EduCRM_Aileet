<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppToggle from '@/components/ui/AppToggle.vue';
import { useForm, useRules } from '@/composables/useForm';
import { useToast } from '@/composables/useToast';
import { usersService, type UserPayload } from '@/services/users.service';
import { useAuthStore } from '@/stores/auth';
import type { User } from '@/types/models';

const props = defineProps<{ open: boolean; user?: User | null }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const { t } = useI18n();
const toast = useToast();
const rules = useRules();
const auth = useAuthStore();
const isEdit = computed(() => !!props.user);
const isSelf = computed(() => props.user?.id === auth.user?.id);
/** Role of teacher/student accounts is managed by their profiles. */
const roleEditable = computed(() => !isSelf.value && (!props.user || ['admin', 'super_admin'].includes(props.user.role)));

const { values, errors, submitting, submit, reset } = useForm(
  { firstName: '', lastName: '', email: '', phone: '', password: '', role: 'admin', isActive: true },
  {
    firstName: [rules.required(), rules.minLength(2)],
    lastName: [rules.required(), rules.minLength(2)],
    email: [rules.required(), rules.email()],
    phone: [rules.phone()],
    password: [rules.when(() => !isEdit.value, rules.required()), rules.minLength(6)],
  },
);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    const u = props.user;
    reset(u ? { firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone || '', password: '', role: u.role, isActive: u.isActive } : {});
  },
);

const roleOptions = computed(() =>
  (roleEditable.value ? ['admin', 'super_admin'] : [values.role]).map((value) => ({ value, label: t(`roles.${value}`) })),
);

async function onSubmit() {
  await submit(async () => {
    const data: UserPayload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone || undefined,
      password: values.password || undefined,
    };
    if (roleEditable.value) data.role = values.role as UserPayload['role'];
    if (!isSelf.value) data.isActive = values.isActive;
    if (isEdit.value) await usersService.update(props.user!.id, data);
    else await usersService.create(data);
    toast.success(isEdit.value ? t('users.updated') : t('users.created'));
    emit('saved');
    emit('close');
  });
}
</script>

<template>
  <AppModal :open="open" :title="isEdit ? $t('users.editTitle') : $t('users.createTitle')" @close="emit('close')">
    <form id="user-form" class="grid grid-cols-1 gap-4 sm:grid-cols-2" novalidate @submit.prevent="onSubmit">
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
      <AppSelect v-model="values.role" :options="roleOptions" :label="$t('users.role')" :disabled="!roleEditable" />
      <div v-if="isEdit && !isSelf" class="rounded-lg border border-slate-200 p-4 sm:col-span-2">
        <AppToggle v-model="values.isActive" :label="$t('teachers.accountActive')" :description="$t('users.activeHint')" />
      </div>
    </form>
    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton type="submit" form="user-form" :loading="submitting">{{ isEdit ? $t('common.save') : $t('common.create') }}</AppButton>
    </template>
  </AppModal>
</template>
