<script setup lang="ts">
import { KeyIcon, UserCircleIcon } from '@heroicons/vue/24/outline';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppAvatar from '@/components/ui/AppAvatar.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { useForm, useRules } from '@/composables/useForm';
import { useToast } from '@/composables/useToast';
import { SUPPORTED_LOCALES, setLocale, type AppLocale } from '@/i18n';
import { profileService } from '@/services/profile.service';
import { useAuthStore } from '@/stores/auth';
import { formatDateTime, fullName } from '@/utils/format';

const { t, locale } = useI18n();
const toast = useToast();
const rules = useRules();
const auth = useAuthStore();

const profile = useForm(
  {
    firstName: auth.user?.firstName || '',
    lastName: auth.user?.lastName || '',
    phone: auth.user?.phone || '',
    language: locale.value,
  },
  {
    firstName: [rules.required(), rules.minLength(2)],
    lastName: [rules.required(), rules.minLength(2)],
    phone: [rules.phone()],
  },
);

const password = useForm(
  { currentPassword: '', newPassword: '', confirmPassword: '' },
  {
    currentPassword: [rules.required()],
    newPassword: [rules.required(), rules.minLength(6)],
    confirmPassword: [rules.required(), rules.sameAs('newPassword')],
  },
);

const languageOptions = computed(() => SUPPORTED_LOCALES.map((item) => ({ value: item.code, label: item.label })));

async function saveProfile() {
  await profile.submit(async (data) => {
    const user = await profileService.update({ ...data, phone: data.phone || undefined });
    auth.setUser(user);
    setLocale(data.language as AppLocale);
    toast.success(t('profile.saved'));
  });
}

async function savePassword() {
  const ok = await password.submit((data) => profileService.changePassword(data.currentPassword, data.newPassword));
  if (ok) {
    toast.success(t('profile.passwordChanged'));
    password.reset();
  }
}
</script>

<template>
  <div>
    <PageHeader :title="$t('nav.profile')" :subtitle="$t('profile.subtitle')" />

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <section class="card p-6 text-center xl:row-span-2">
        <AppAvatar :name="fullName(auth.user)" size="lg" class="mx-auto" />
        <h2 class="mt-4 text-lg font-semibold text-slate-900">{{ fullName(auth.user) }}</h2>
        <p class="text-sm text-slate-500">{{ auth.user?.email }}</p>
        <AppBadge class="mt-3" color="indigo">{{ $t(`roles.${auth.role}`) }}</AppBadge>
        <dl class="mt-6 space-y-3 border-t border-slate-100 pt-5 text-left text-sm">
          <div class="flex justify-between gap-4"><dt class="text-slate-500">{{ $t('fields.phone') }}</dt><dd class="text-slate-900">{{ auth.user?.phone || '—' }}</dd></div>
          <div class="flex justify-between gap-4"><dt class="text-slate-500">{{ $t('users.lastLogin') }}</dt><dd class="text-slate-900">{{ formatDateTime(auth.user?.lastLoginAt) }}</dd></div>
        </dl>
      </section>

      <section class="card xl:col-span-2">
        <header class="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <UserCircleIcon class="h-5 w-5 text-slate-400" />
          <h3 class="text-sm font-semibold text-slate-900">{{ $t('profile.personal') }}</h3>
        </header>
        <form class="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2" novalidate @submit.prevent="saveProfile">
          <AppInput v-model="profile.values.firstName" :label="$t('fields.firstName')" required :error="profile.errors.firstName" />
          <AppInput v-model="profile.values.lastName" :label="$t('fields.lastName')" required :error="profile.errors.lastName" />
          <AppInput :model-value="auth.user?.email" :label="$t('fields.email')" disabled :hint="$t('profile.emailHint')" />
          <AppInput v-model="profile.values.phone" type="tel" :label="$t('fields.phone')" :error="profile.errors.phone" />
          <AppSelect v-model="profile.values.language" :options="languageOptions" :label="$t('common.language')" />
          <div class="flex items-end justify-end sm:col-span-2">
            <AppButton type="submit" :loading="profile.submitting.value">{{ $t('common.save') }}</AppButton>
          </div>
        </form>
      </section>

      <section class="card xl:col-span-2">
        <header class="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <KeyIcon class="h-5 w-5 text-slate-400" />
          <h3 class="text-sm font-semibold text-slate-900">{{ $t('profile.changePassword') }}</h3>
        </header>
        <form class="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3" novalidate @submit.prevent="savePassword">
          <AppInput v-model="password.values.currentPassword" type="password" autocomplete="current-password" :label="$t('profile.currentPassword')" :error="password.errors.currentPassword" />
          <AppInput v-model="password.values.newPassword" type="password" autocomplete="new-password" :label="$t('fields.newPassword')" :error="password.errors.newPassword" />
          <AppInput v-model="password.values.confirmPassword" type="password" autocomplete="new-password" :label="$t('profile.confirmPassword')" :error="password.errors.confirmPassword" />
          <div class="flex justify-end sm:col-span-3">
            <AppButton type="submit" variant="secondary" :loading="password.submitting.value">{{ $t('profile.updatePassword') }}</AppButton>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>
