<script setup lang="ts">
import { useRouter } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

async function logout() {
  await auth.logout();
  router.replace({ name: 'login' });
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4">
    <h1 class="text-2xl font-semibold">{{ auth.user?.firstName }} {{ auth.user?.lastName }}</h1>
    <p class="text-slate-500">{{ $t(`roles.${auth.role}`) }}</p>
    <AppButton variant="secondary" @click="logout">{{ $t('auth.logout') }}</AppButton>
  </div>
</template>
