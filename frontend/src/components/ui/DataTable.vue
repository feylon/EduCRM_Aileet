<script setup lang="ts" generic="T extends Record<string, any>">
import { ChevronDownIcon, ChevronUpDownIcon, ChevronUpIcon } from '@heroicons/vue/20/solid';
import AppSkeleton from './AppSkeleton.vue';
import EmptyState from './EmptyState.vue';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  class?: string;
  /** Hide on small screens */
  hideOnMobile?: boolean;
}

const props = withDefaults(
  defineProps<{
    columns: TableColumn[];
    rows: T[];
    loading?: boolean;
    rowKey?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    clickable?: boolean;
    skeletonRows?: number;
    emptyTitle?: string;
    emptyDescription?: string;
  }>(),
  { rowKey: 'id', skeletonRows: 6 },
);

const emit = defineEmits<{ sort: [key: string, order: 'ASC' | 'DESC']; rowClick: [row: T] }>();

function toggleSort(column: TableColumn) {
  if (!column.sortable) return;
  const order = props.sortBy === column.key && props.sortOrder === 'DESC' ? 'ASC' : 'DESC';
  emit('sort', column.key, order);
}

function alignClass(column: TableColumn) {
  return column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left';
}
</script>

<template>
  <div class="scrollbar-thin overflow-x-auto">
    <table class="min-w-full divide-y divide-slate-200">
      <thead class="bg-slate-50/80">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            :class="[
              'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 first:pl-5 last:pr-5',
              alignClass(column),
              column.hideOnMobile ? 'hidden md:table-cell' : '',
              column.class,
            ]"
          >
            <button
              v-if="column.sortable"
              type="button"
              class="group inline-flex items-center gap-1 uppercase hover:text-slate-700"
              @click="toggleSort(column)"
            >
              {{ column.label }}
              <ChevronUpIcon v-if="sortBy === column.key && sortOrder === 'ASC'" class="h-4 w-4 text-brand-600" />
              <ChevronDownIcon v-else-if="sortBy === column.key" class="h-4 w-4 text-brand-600" />
              <ChevronUpDownIcon v-else class="h-4 w-4 text-slate-300 group-hover:text-slate-400" />
            </button>
            <template v-else>{{ column.label }}</template>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 bg-white">
        <template v-if="loading && !rows.length">
          <tr v-for="index in skeletonRows" :key="`skeleton-${index}`">
            <td
              v-for="column in columns"
              :key="column.key"
              :class="['px-4 py-3.5 first:pl-5 last:pr-5', column.hideOnMobile ? 'hidden md:table-cell' : '']"
            >
              <AppSkeleton class="h-4" :style="{ width: `${50 + ((index * 17 + column.key.length * 7) % 45)}%` }" />
            </td>
          </tr>
        </template>
        <tr v-else-if="!rows.length">
          <td :colspan="columns.length">
            <slot name="empty">
              <EmptyState :title="emptyTitle" :description="emptyDescription" />
            </slot>
          </td>
        </tr>
        <template v-else>
          <tr
            v-for="(row, index) in rows"
            :key="row[rowKey] ?? index"
            :class="[
              'transition-colors',
              clickable ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50/60',
              loading ? 'opacity-60' : '',
            ]"
            @click="clickable && emit('rowClick', row)"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="[
                'whitespace-nowrap px-4 py-3 text-sm text-slate-700 first:pl-5 last:pr-5',
                alignClass(column),
                column.hideOnMobile ? 'hidden md:table-cell' : '',
                column.class,
              ]"
            >
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                {{ row[column.key] ?? '—' }}
              </slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
