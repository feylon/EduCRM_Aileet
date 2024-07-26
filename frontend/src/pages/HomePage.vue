<script setup lang="ts">
import { SUPPORTED_LOCALES, setLocale } from '@/i18n';
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4">
    <h1 class="text-2xl font-semibold">{{ $t('app.name') }}</h1>
    <p class="text-slate-500">{{ $t('app.tagline') }}</p>
    <div class="flex gap-2">
      <button
        v-for="locale in SUPPORTED_LOCALES"
        :key="locale.code"
        class="rounded-md border px-3 py-1"
        @click="setLocale(locale.code)"
      >
        {{ locale.label }}
      </button>
    </div>
  </div>
</template>
