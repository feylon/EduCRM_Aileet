<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/20/solid';
import { computed } from 'vue';
import type { PaginationMeta } from '@/types/api';

const props = defineProps<{ meta: PaginationMeta | null; limitOptions?: number[] }>();
const emit = defineEmits<{ page: [page: number]; limit: [limit: number] }>();

const from = computed(() => (props.meta && props.meta.total ? (props.meta.page - 1) * props.meta.limit + 1 : 0));
const to = computed(() => (props.meta ? Math.min(props.meta.page * props.meta.limit, props.meta.total) : 0));

/** Compact page list: 1 … 4 5 6 … 12 */
const pages = computed<(number | '…')[]>(() => {
  if (!props.meta) return [];
  const { page, totalPages } = props.meta;
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const result: (number | '…')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) result.push('…');
  for (let i = start; i <= end; i++) result.push(i);
  if (end < totalPages - 1) result.push('…');
  result.push(totalPages);
  return result;
});
</script>

<template>
  <div
    v-if="meta && meta.total > 0"
    class="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row"
  >
    <div class="flex items-center gap-3 text-xs text-slate-500">
      <span>{{ $t('common.showing', { from, to, total: meta.total }) }}</span>
      <select
        v-if="limitOptions"
        :value="meta.limit"
        class="rounded-md border-slate-300 py-1 pl-2 pr-7 text-xs focus:border-brand-500 focus:ring-brand-500/20"
        :aria-label="$t('common.perPage')"
        @change="emit('limit', Number(($event.target as HTMLSelectElement).value))"
      >
        <option v-for="option in limitOptions" :key="option" :value="option">{{ option }}</option>
      </select>
    </div>
    <nav v-if="meta.totalPages > 1" class="flex items-center gap-1">
      <button
        class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"
        :disabled="meta.page <= 1"
        :aria-label="$t('common.back')"
        @click="emit('page', meta.page - 1)"
      >
        <ChevronLeftIcon class="h-4 w-4" />
      </button>
      <template v-for="(item, index) in pages" :key="index">
        <span v-if="item === '…'" class="px-1 text-slate-400">…</span>
        <button
          v-else
          :class="[
            'h-8 min-w-[2rem] rounded-lg px-2 text-xs font-medium transition',
            item === meta.page ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
          ]"
          @click="emit('page', item)"
        >
          {{ item }}
        </button>
      </template>
      <button
        class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"
        :disabled="meta.page >= meta.totalPages"
        :aria-label="$t('common.next')"
        @click="emit('page', meta.page + 1)"
      >
        <ChevronRightIcon class="h-4 w-4" />
      </button>
    </nav>
  </div>
</template>
