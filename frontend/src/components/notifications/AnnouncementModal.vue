<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import ChipSelect from '@/components/ui/ChipSelect.vue';
import { useForm, useRules } from '@/composables/useForm';
import { useToast } from '@/composables/useToast';
import { notificationsService } from '@/services/notifications.service';
import type { Role } from '@/types/models';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; sent: [] }>();

const { t } = useI18n();
const toast = useToast();
const rules = useRules();

const { values, errors, submitting, submit, reset } = useForm(
  { title: '', message: '', roles: ['student', 'teacher'] as string[] },
  {
    title: [rules.required(), rules.maxLength(200)],
    message: [rules.required(), rules.maxLength(2000)],
    roles: [rules.required()],
  },
);
watch(() => props.open, (open) => open && reset());

const roleOptions = computed(() => (['student', 'teacher', 'admin'] as Role[]).map((value) => ({ value, label: t(`roles.${value}`) })));

async function onSubmit() {
  await submit(async () => {
    const result = await notificationsService.broadcast({ title: values.title, message: values.message, roles: values.roles as Role[] });
    toast.success(t('notifications.sent', { count: result.sent }));
    emit('sent');
    emit('close');
  });
}
</script>

<template>
  <AppModal :open="open" :title="$t('notifications.newAnnouncement')" :description="$t('notifications.announcementHint')" @close="emit('close')">
    <form id="announcement-form" class="space-y-4" novalidate @submit.prevent="onSubmit">
      <AppInput v-model="values.title" :label="$t('notifications.announcementTitle')" required :error="errors.title" />
      <AppTextarea v-model="values.message" :label="$t('notifications.announcementMessage')" :rows="4" required :error="errors.message" />
      <div>
        <ChipSelect v-model="values.roles" :options="roleOptions" :label="$t('notifications.recipients')" />
        <p v-if="errors.roles" class="form-error">{{ errors.roles }}</p>
      </div>
    </form>
    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton type="submit" form="announcement-form" :loading="submitting">{{ $t('notifications.send') }}</AppButton>
    </template>
  </AppModal>
</template>
