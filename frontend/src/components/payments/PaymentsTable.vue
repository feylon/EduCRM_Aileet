<script setup lang="ts">
import { ArrowUturnLeftIcon, PencilSquareIcon, TrashIcon } from '@heroicons/vue/20/solid';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppDropdown from '@/components/ui/AppDropdown.vue';
import DataTable, { type TableColumn } from '@/components/ui/DataTable.vue';
import type { Payment } from '@/types/models';
import { formatDate, formatMoney, formatMonth, fullName } from '@/utils/format';
import { statusColor } from '@/utils/status';

const props = withDefaults(
  defineProps<{
    rows: Payment[];
    loading?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    showStudent?: boolean;
    editable?: boolean;
  }>(),
  { showStudent: true },
);
const emit = defineEmits<{ sort: [key: string, order: 'ASC' | 'DESC']; edit: [Payment]; refund: [Payment]; remove: [Payment] }>();
const { t } = useI18n();

const columns = computed<TableColumn[]>(() => [
  { key: 'paidAt', label: t('payments.paidAt'), sortable: true },
  ...(props.showStudent ? [{ key: 'student', label: t('students.columns.student'), sortable: true }] : []),
  { key: 'group', label: t('fields.group'), hideOnMobile: true },
  { key: 'forMonth', label: t('payments.forMonth'), sortable: true, hideOnMobile: true },
  { key: 'method', label: t('payments.method'), hideOnMobile: true },
  { key: 'amount', label: t('payments.amount'), sortable: true, align: 'right' },
  { key: 'status', label: t('common.status') },
  ...(props.editable ? [{ key: 'actions', label: '', align: 'right' as const, class: 'w-12' }] : []),
]);
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="rows"
    :loading="loading"
    :sort-by="sortBy"
    :sort-order="sortOrder"
    :empty-title="$t('payments.emptyTitle')"
    :empty-description="$t('payments.emptyDescription')"
    @sort="(key, order) => emit('sort', key, order)"
  >
    <template #cell-paidAt="{ row }">{{ formatDate(row.paidAt) }}</template>
    <template #cell-student="{ row }">
      <RouterLink :to="`/students/${row.studentId}`" class="font-medium text-slate-900 hover:text-brand-600">{{ fullName(row.student?.user) }}</RouterLink>
    </template>
    <template #cell-group="{ row }">{{ row.group?.name || '—' }}</template>
    <template #cell-forMonth="{ row }">{{ formatMonth(row.forMonth) }}</template>
    <template #cell-method="{ row }"><AppBadge>{{ $t(`payments.methods.${row.method}`) }}</AppBadge></template>
    <template #cell-amount="{ row }">
      <span :class="['font-semibold tabular-nums', row.status === 'refunded' ? 'text-slate-400 line-through' : 'text-slate-900']">{{ formatMoney(row.amount) }}</span>
    </template>
    <template #cell-status="{ row }">
      <AppBadge :color="statusColor('payment', row.status)" dot>{{ $t(`payments.statuses.${row.status}`) }}</AppBadge>
    </template>
    <template #cell-actions="{ row }">
      <AppDropdown
        :items="[
          { label: $t('common.edit'), icon: PencilSquareIcon, action: () => emit('edit', row) },
          { label: $t('payments.refund'), icon: ArrowUturnLeftIcon, hidden: row.status === 'refunded', action: () => emit('refund', row) },
          { label: $t('common.delete'), icon: TrashIcon, danger: true, action: () => emit('remove', row) },
        ]"
      />
    </template>
  </DataTable>
</template>
