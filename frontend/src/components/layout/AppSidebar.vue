<script setup lang="ts">
import { AcademicCapIcon } from '@heroicons/vue/24/solid';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { navigation } from '@/config/navigation';
import { useAuthStore } from '@/stores/auth';

const emit = defineEmits<{ navigate: [] }>();

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

/** Sections filtered by the user's role and by the routes that exist. */
const sections = computed(() =>
  navigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => auth.hasRole(item.roles) && router.hasRoute(item.name)),
    }))
    .filter((section) => section.items.length),
);

function isActive(name: string) {
  if (name === 'dashboard') return route.name === 'dashboard';
  const target = router.resolve({ name }).path;
  return route.path === target || route.path.startsWith(`${target}/`);
}
</script>

<template>
  <div class="flex h-full flex-col bg-slate-950 text-slate-300">
    <div class="flex h-16 shrink-0 items-center gap-3 px-5">
      <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
        <AcademicCapIcon class="h-5 w-5" />
      </div>
      <div class="leading-tight">
        <p class="text-[15px] font-semibold text-white">{{ $t('app.name') }}</p>
        <p class="text-[11px] text-slate-500">{{ $t('nav.workspace') }}</p>
      </div>
    </div>

    <nav class="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-4">
      <div v-for="(section, index) in sections" :key="index">
        <p v-if="section.title" class="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {{ $t(section.title) }}
        </p>
        <ul class="space-y-0.5">
          <li v-for="item in section.items" :key="item.name">
            <RouterLink
              :to="{ name: item.name }"
              :class="[
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                isActive(item.name)
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
              ]"
              @click="emit('navigate')"
            >
              <component
                :is="item.icon"
                :class="[
                  'h-5 w-5 shrink-0',
                  isActive(item.name) ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300',
                ]"
              />
              {{ $t(item.label) }}
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>

    <div class="border-t border-white/5 p-4">
      <div class="rounded-xl bg-white/5 px-3 py-2.5">
        <p class="truncate text-sm font-medium text-white">{{ auth.user?.firstName }} {{ auth.user?.lastName }}</p>
        <p class="truncate text-xs text-slate-500">{{ $t(`roles.${auth.role}`) }}</p>
      </div>
    </div>
  </div>
</template>
