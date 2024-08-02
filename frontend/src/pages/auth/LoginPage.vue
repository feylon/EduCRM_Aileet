<script setup lang="ts">
import { EnvelopeIcon, EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/vue/20/solid';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import { useForm, useRules } from '@/composables/useForm';
import { hasStoredLocale, setLocale, type AppLocale } from '@/i18n';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { useAuthStore } from '@/stores/auth';
import { getErrorMessage } from '@/utils/errors';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const rules = useRules();

const showPassword = ref(false);
const errorMessage = ref<string | null>(null);

const { values, errors, submitting, submit } = useForm(
  { email: '', password: '' },
  { email: [rules.required(), rules.email()], password: [rules.required()] },
);

const showDemo = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS !== 'false';
const demoAccounts = [
  { role: 'super_admin', email: 'superadmin@educrm.uz', password: 'Admin123!' },
  { role: 'admin', email: 'admin@educrm.uz', password: 'Admin123!' },
  { role: 'teacher', email: 'teacher@educrm.uz', password: 'Teacher123!' },
  { role: 'student', email: 'student@educrm.uz', password: 'Student123!' },
];

function fillDemo(account: (typeof demoAccounts)[number]) {
  values.email = account.email;
  values.password = account.password;
}

async function onSubmit() {
  errorMessage.value = null;
  // useForm.submit shows a toast on error; for login we prefer an inline alert.
  if (!submitting.value) {
    await submit(async (data) => {
      try {
        const user = await auth.login(data.email, data.password);
        if (!hasStoredLocale() && ['uz', 'ru', 'en'].includes(user.language)) setLocale(user.language as AppLocale);
        const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/';
        await router.replace(redirect);
      } catch (error) {
        errorMessage.value = getErrorMessage(error);
      }
    });
  }
}
</script>

<template>
  <AuthLayout>
    <div>
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900">{{ $t('auth.title') }}</h1>
      <p class="mt-1.5 text-sm text-slate-500">{{ $t('auth.subtitle') }}</p>
    </div>

    <div
      v-if="route.query.expired && !errorMessage"
      class="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800"
    >
      {{ $t('auth.sessionExpired') }}
    </div>
    <div
      v-if="errorMessage"
      class="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
      role="alert"
    >
      {{ errorMessage }}
    </div>

    <form class="mt-6 space-y-4" novalidate @submit.prevent="onSubmit">
      <AppInput
        v-model="values.email"
        :label="$t('auth.email')"
        type="email"
        autocomplete="username"
        placeholder="name@example.com"
        :error="errors.email"
      >
        <template #prefix><EnvelopeIcon class="h-4 w-4" /></template>
      </AppInput>
      <AppInput
        v-model="values.password"
        :label="$t('auth.password')"
        :type="showPassword ? 'text' : 'password'"
        autocomplete="current-password"
        placeholder="••••••••"
        :error="errors.password"
      >
        <template #prefix><LockClosedIcon class="h-4 w-4" /></template>
        <template #suffix>
          <button
            type="button"
            class="rounded p-1 text-slate-400 hover:text-slate-600"
            :aria-label="$t('auth.togglePassword')"
            @click="showPassword = !showPassword"
          >
            <EyeSlashIcon v-if="showPassword" class="h-4 w-4" />
            <EyeIcon v-else class="h-4 w-4" />
          </button>
        </template>
      </AppInput>
      <AppButton type="submit" size="lg" block :loading="submitting">{{ $t('auth.signIn') }}</AppButton>
    </form>

    <div v-if="showDemo" class="mt-8">
      <div class="relative">
        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200" /></div>
        <div class="relative flex justify-center">
          <span class="bg-white px-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            {{ $t('auth.demoAccounts') }}
          </span>
        </div>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-2">
        <button
          v-for="account in demoAccounts"
          :key="account.email"
          type="button"
          class="rounded-lg border border-slate-200 px-3 py-2 text-left transition hover:border-brand-300 hover:bg-brand-50/50"
          @click="fillDemo(account)"
        >
          <span class="block text-xs font-semibold text-slate-800">{{ $t(`roles.${account.role}`) }}</span>
          <span class="block truncate text-[11px] text-slate-500">{{ account.email }}</span>
        </button>
      </div>
    </div>
  </AuthLayout>
</template>
