<script setup lang="ts">
import { AcademicCapIcon, ChartBarIcon, CreditCardIcon, UserGroupIcon } from '@heroicons/vue/24/outline';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue';

const features = [
  { icon: UserGroupIcon, key: 'students' },
  { icon: CreditCardIcon, key: 'payments' },
  { icon: ChartBarIcon, key: 'analytics' },
];
</script>

<template>
  <div class="flex min-h-screen bg-white">
    <!-- Brand panel -->
    <aside class="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex">
      <div class="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-600/40 blur-3xl" />
      <div class="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />

      <div class="relative flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
          <AcademicCapIcon class="h-6 w-6" />
        </div>
        <span class="text-lg font-semibold tracking-tight">{{ $t('app.name') }}</span>
      </div>

      <div class="relative">
        <h2 class="max-w-md text-3xl font-semibold leading-tight tracking-tight text-white">
          {{ $t('auth.heroTitle') }}
        </h2>
        <p class="mt-4 max-w-md text-base text-slate-300">{{ $t('auth.heroSubtitle') }}</p>
        <ul class="mt-10 space-y-4">
          <li v-for="feature in features" :key="feature.key" class="flex items-center gap-3 text-slate-200">
            <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
              <component :is="feature.icon" class="h-5 w-5" />
            </span>
            {{ $t(`auth.features.${feature.key}`) }}
          </li>
        </ul>
      </div>

      <p class="relative text-xs text-slate-500">© {{ new Date().getFullYear() }} {{ $t('app.name') }}</p>
    </aside>

    <!-- Form -->
    <main class="flex flex-1 flex-col">
      <div class="flex items-center justify-between p-4 sm:p-6">
        <div class="flex items-center gap-2 lg:invisible">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <AcademicCapIcon class="h-5 w-5" />
          </div>
          <span class="font-semibold text-slate-900">{{ $t('app.name') }}</span>
        </div>
        <LanguageSwitcher />
      </div>
      <div class="flex flex-1 items-center justify-center px-4 pb-16 sm:px-6">
        <div class="w-full max-w-sm">
          <slot />
        </div>
      </div>
    </main>
  </div>
</template>
