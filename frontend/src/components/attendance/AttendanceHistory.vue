<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import DataTable, { type TableColumn } from '@/components/ui/DataTable.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import { useTable } from '@/composables/useTable';
import { attendanceService } from '@/services/attendance.service';
import type { AttendanceRecord } from '@/types/models';
import { formatDate, fullName } from '@/utils/format';
import { statusColor } from '@/utils/status';

/** Paginated attendance records; scoped by student and/or group. */
const props = defineProps<{ studentId?: string; groupId?: string; showStudent?: boolean }>();
const { t } = useI18n();

const table = useTable<AttendanceRecord, { status: string | null; studentId?: string; groupId?: string }>(
  attendanceService.list,
  { sortBy: 'date', filters: { status: null, studentId: props.studentId, groupId: props.groupId } },
);

const columns = computed<TableColumn[]>(() => [
  { key: 'date', label: t('fields.date'), sortable: true },
  ...(props.showStudent ? [{ key: 'student', label: t('students.columns.student') }] : []),
  { key: 'group', label: t('fields.group') },
  { key: 'topic', label: t('attendance.topic'), hideOnMobile: true },
  { key: 'status', label: t('common.status'), sortable: true },
]);

const statusOptions = computed(() =>
  ['present', 'late', 'absent', 'excused'].map((value) => ({ value, label: t(`attendance.statuses.${value}`) })),
);
</script>

<template>
  <div>
    <div class="flex justify-end border-b border-slate-100 p-4">
      <AppSelect v-model="table.filters.status" :options="statusOptions" :placeholder="$t('common.all')" class="w-full sm:w-48" />
    </div>
    <ErrorState v-if="table.error.value" :message="table.error.value" @retry="table.load" />
    <DataTable
      v-else
      :columns="columns"
      :rows="table.rows.value"
      :loading="table.loading.value"
      :sort-by="table.state.sortBy"
      :sort-order="table.state.sortOrder"
      @sort="table.sort"
    >
      <template #cell-date="{ row }">{{ formatDate(row.lesson.date) }}</template>
      <template #cell-student="{ row }">{{ fullName(row.student.user) }}</template>
      <template #cell-group="{ row }">{{ row.lesson.group?.name }}</template>
      <template #cell-topic="{ row }">
        <span class="block max-w-xs truncate">{{ row.lesson.topic || '—' }}</span>
      </template>
      <template #cell-status="{ row }">
        <AppBadge :color="statusColor('attendance', row.status)" dot>{{ $t(`attendance.statuses.${row.status}`) }}</AppBadge>
      </template>
    </DataTable>
    <AppPagination :meta="table.meta.value" @page="table.setPage" />
  </div>
</template>
