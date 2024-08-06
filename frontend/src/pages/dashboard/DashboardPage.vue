<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
</script>

<template>
  <PageHeader :title="$t('dashboard.greeting', { name: auth.user?.firstName })" :subtitle="$t('dashboard.subtitle')" />
</template>
