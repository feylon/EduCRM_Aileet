<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { CheckIcon, LanguageIcon } from '@heroicons/vue/20/solid';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { SUPPORTED_LOCALES, setLocale, type AppLocale } from '@/i18n';
import { profileService } from '@/services/profile.service';
import { useAuthStore } from '@/stores/auth';

withDefaults(defineProps<{ compact?: boolean; placement?: 'top' | 'bottom' }>(), { placement: 'bottom' });

const { locale } = useI18n();
const auth = useAuthStore();
const current = computed(() => SUPPORTED_LOCALES.find((item) => item.code === locale.value) ?? SUPPORTED_LOCALES[0]);

function change(code: AppLocale) {
  setLocale(code);
  // Remember the choice on the account too (fire and forget).
  if (auth.isAuthenticated) profileService.update({ language: code }).catch(() => undefined);
}
</script>

<template>
  <Menu as="div" class="relative">
    <MenuButton
      class="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      :aria-label="$t('common.language')"
    >
      <LanguageIcon class="h-4 w-4" />
      <span>{{ compact ? current.short : current.label }}</span>
    </MenuButton>
    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <MenuItems
        :class="[
          'absolute right-0 z-40 w-44 rounded-xl border border-slate-100 bg-white p-1 shadow-popover focus:outline-none',
          placement === 'top' ? 'bottom-full mb-1 origin-bottom-right' : 'mt-1 origin-top-right',
        ]"
      >
        <MenuItem v-for="item in SUPPORTED_LOCALES" :key="item.code" v-slot="{ active }">
          <button
            type="button"
            :class="['flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm', active ? 'bg-slate-50' : '']"
            @click="change(item.code)"
          >
            <span class="flex items-center gap-2">
              <span class="w-6 text-xs font-semibold text-slate-400">{{ item.short }}</span>
              {{ item.label }}
            </span>
            <CheckIcon v-if="item.code === locale" class="h-4 w-4 text-brand-600" />
          </button>
        </MenuItem>
      </MenuItems>
    </transition>
  </Menu>
</template>
