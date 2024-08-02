<script setup lang="ts">
import { ShieldExclamationIcon } from '@heroicons/vue/24/outline';
import AppButton from '@/components/ui/AppButton.vue';
</script>

<template>
  <div class="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
    <div class="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-500">
      <ShieldExclamationIcon class="h-7 w-7" />
    </div>
    <h1 class="mt-5 text-2xl font-semibold tracking-tight text-slate-900">{{ $t('errorPages.forbiddenTitle') }}</h1>
    <p class="mt-3 max-w-md text-slate-500">{{ $t('errorPages.forbiddenText') }}</p>
    <RouterLink to="/" class="mt-8"><AppButton>{{ $t('errorPages.goHome') }}</AppButton></RouterLink>
  </div>
</template>
