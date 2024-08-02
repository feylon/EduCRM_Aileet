<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
</script>

<template>
  <div class="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
    <p class="text-sm font-semibold text-brand-600">404</p>
    <h1 class="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{{ $t('errorPages.notFoundTitle') }}</h1>
    <p class="mt-3 max-w-md text-slate-500">{{ $t('errorPages.notFoundText') }}</p>
    <RouterLink to="/" class="mt-8"><AppButton>{{ $t('errorPages.goHome') }}</AppButton></RouterLink>
  </div>
</template>
