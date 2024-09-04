<script setup lang="ts">
import { ArrowDownTrayIcon, BanknotesIcon, ChartBarIcon, ReceiptRefundIcon, UsersIcon } from '@heroicons/vue/24/outline';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BarChart from '@/components/charts/BarChart.vue';
import BarList from '@/components/charts/BarList.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import AppTabs from '@/components/ui/AppTabs.vue';
import DataTable, { type TableColumn } from '@/components/ui/DataTable.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import StatCard from '@/components/ui/StatCard.vue';
import { useToast } from '@/composables/useToast';
import { reportsService, type AttendanceReport, type FinanceReport, type StudentsReport, type TeachersReport } from '@/services/reports.service';
import { getErrorMessage } from '@/utils/errors';
import { formatCompactMoney, formatMoney, formatMonth, todayString } from '@/utils/format';

const { t } = useI18n();
const toast = useToast();

function iso(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
const now = new Date();
const PRESETS = {
  thisMonth: () => [iso(new Date(now.getFullYear(), now.getMonth(), 1)), todayString()],
  lastMonth: () => [iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)), iso(new Date(now.getFullYear(), now.getMonth(), 0))],
  last3Months: () => [iso(new Date(now.getFullYear(), now.getMonth() - 2, 1)), todayString()],
  thisYear: () => [iso(new Date(now.getFullYear(), 0, 1)), todayString()],
} as const;
type Preset = keyof typeof PRESETS;

const preset = ref<Preset | 'custom'>('thisMonth');
const [initialFrom, initialTo] = PRESETS.thisMonth();
const period = ref({ from: initialFrom, to: initialTo });
function applyPreset(key: Preset) {
  preset.value = key;
  const [from, to] = PRESETS[key]();
  period.value = { from, to };
}

const tab = ref('finance');
const tabs = computed(() => [
  { value: 'finance', label: t('reports.tabs.finance') },
  { value: 'attendance', label: t('reports.tabs.attendance') },
  { value: 'teachers', label: t('reports.tabs.teachers') },
  { value: 'students', label: t('reports.tabs.students') },
]);

const loading = ref(false);
const error = ref<string | null>(null);
const finance = ref<FinanceReport | null>(null);
const attendance = ref<AttendanceReport | null>(null);
const teachers = ref<TeachersReport | null>(null);
const students = ref<StudentsReport | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const p = period.value;
    if (tab.value === 'finance') finance.value = await reportsService.finance(p);
    if (tab.value === 'attendance') attendance.value = await reportsService.attendance(p);
    if (tab.value === 'teachers') teachers.value = await reportsService.teachers(p);
    if (tab.value === 'students') students.value = await reportsService.students();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
}
watch([tab, period], load, { immediate: true, deep: true });

const exporting = ref(false);
async function exportCsv() {
  exporting.value = true;
  try {
    await reportsService.exportPayments(period.value);
  } catch (err) {
    toast.error(getErrorMessage(err));
  } finally {
    exporting.value = false;
  }
}

const attendanceColumns = computed<TableColumn[]>(() => [
  { key: 'groupName', label: t('fields.group') },
  { key: 'teacherName', label: t('fields.teacher'), hideOnMobile: true },
  { key: 'lessons', label: t('reports.lessons'), align: 'center' },
  { key: 'present', label: t('attendance.statuses.present'), align: 'center', hideOnMobile: true },
  { key: 'late', label: t('attendance.statuses.late'), align: 'center', hideOnMobile: true },
  { key: 'absent', label: t('attendance.statuses.absent'), align: 'center', hideOnMobile: true },
  { key: 'rate', label: t('attendance.rate'), align: 'right' },
]);
const teacherColumns = computed<TableColumn[]>(() => [
  { key: 'teacherName', label: t('fields.teacher') },
  { key: 'groups', label: t('nav.groups'), align: 'center' },
  { key: 'students', label: t('nav.students'), align: 'center' },
  { key: 'lessons', label: t('reports.lessonsInPeriod'), align: 'center' },
]);
</script>

<template>
  <div>
    <PageHeader :title="$t('nav.reports')" :subtitle="$t('reports.subtitle')">
      <template #actions>
        <AppButton variant="secondary" :icon="ArrowDownTrayIcon" :loading="exporting" @click="exportCsv">{{ $t('reports.exportPayments') }}</AppButton>
      </template>
    </PageHeader>

    <div class="card mb-6 flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="key in Object.keys(PRESETS) as Preset[]"
          :key="key"
          :class="[
            'rounded-lg px-3 py-1.5 text-sm font-medium transition',
            preset === key ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
          ]"
          @click="applyPreset(key)"
        >
          {{ $t(`reports.presets.${key}`) }}
        </button>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <AppInput v-model="period.from" type="date" :label="$t('common.from')" @update:model-value="preset = 'custom'" />
        <AppInput v-model="period.to" type="date" :label="$t('common.to')" @update:model-value="preset = 'custom'" />
      </div>
    </div>

    <AppTabs v-model="tab" :tabs="tabs" />

    <ErrorState v-if="error" class="mt-6" :message="error" @retry="load" />

    <!-- Finance -->
    <div v-else-if="tab === 'finance'" class="mt-6 space-y-6">
      <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard :label="$t('reports.revenue')" :value="formatMoney(finance?.total)" :icon="BanknotesIcon" color="green" :loading="loading && !finance" />
        <StatCard :label="$t('payments.summary.count')" :value="finance?.count ?? 0" :icon="ChartBarIcon" :loading="loading && !finance" />
        <StatCard class="col-span-2 lg:col-span-1" :label="$t('reports.refunded')" :value="formatMoney(finance?.refunded)" :icon="ReceiptRefundIcon" color="red" :loading="loading && !finance" />
      </div>
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section class="card p-5 xl:col-span-2">
          <h3 class="mb-4 text-sm font-semibold text-slate-900">{{ $t('reports.revenueByMonth') }}</h3>
          <AppSkeleton v-if="loading && !finance" class="h-[260px]" />
          <p v-else-if="!finance?.byMonth.length" class="py-20 text-center text-sm text-slate-500">{{ $t('empty.title') }}</p>
          <BarChart
            v-else
            :labels="finance.byMonth.map((row) => formatMonth(row.month, true))"
            :values="finance.byMonth.map((row) => row.total)"
            :label="$t('reports.revenueByMonth')"
            :format="formatCompactMoney"
          />
        </section>
        <section class="card p-5">
          <h3 class="mb-5 text-sm font-semibold text-slate-900">{{ $t('reports.byMethod') }}</h3>
          <BarList :items="(finance?.byMethod || []).map((row) => ({ label: $t(`payments.methods.${row.method}`), value: row.total, hint: `×${row.count}` }))" :format="formatCompactMoney" />
        </section>
      </div>
      <section class="card p-5">
        <h3 class="mb-5 text-sm font-semibold text-slate-900">{{ $t('reports.byCourse') }}</h3>
        <BarList :items="(finance?.byCourse || []).map((row) => ({ label: row.course === '-' ? $t('payments.noGroup') : row.course, value: row.total }))" :format="formatMoney" />
      </section>
    </div>

    <!-- Attendance -->
    <div v-else-if="tab === 'attendance'" class="mt-6 space-y-6">
      <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard :label="$t('attendance.rate')" :value="`${attendance?.overall.rate ?? 0}%`" :icon="ChartBarIcon" color="green" :loading="loading && !attendance" />
        <StatCard :label="$t('attendance.statuses.present')" :value="attendance?.overall.present ?? 0" :loading="loading && !attendance" />
        <StatCard :label="$t('attendance.statuses.late')" :value="attendance?.overall.late ?? 0" :loading="loading && !attendance" />
        <StatCard :label="$t('attendance.statuses.absent')" :value="attendance?.overall.absent ?? 0" :loading="loading && !attendance" />
      </div>
      <div class="card overflow-hidden">
        <DataTable row-key="groupId" :columns="attendanceColumns" :rows="attendance?.groups || []" :loading="loading">
          <template #cell-groupName="{ row }">
            <RouterLink :to="{ name: 'group-detail', params: { id: row.groupId } }" class="font-medium text-slate-900 hover:text-brand-600">{{ row.groupName }}</RouterLink>
            <p class="text-xs text-slate-500">{{ row.courseName }}</p>
          </template>
          <template #cell-teacherName="{ row }">{{ row.teacherName || '—' }}</template>
          <template #cell-rate="{ row }">
            <span :class="['font-semibold tabular-nums', row.rate >= 85 ? 'text-emerald-600' : row.rate >= 70 ? 'text-amber-600' : 'text-rose-600']">{{ row.rate }}%</span>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Teachers -->
    <div v-else-if="tab === 'teachers'" class="card mt-6 overflow-hidden">
      <DataTable row-key="teacherId" :columns="teacherColumns" :rows="teachers?.teachers || []" :loading="loading" />
    </div>

    <!-- Students -->
    <div v-else-if="tab === 'students'" class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section class="card p-5">
        <h3 class="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-900"><UsersIcon class="h-4 w-4 text-slate-400" />{{ $t('reports.byStatus') }}</h3>
        <BarList :items="(students?.byStatus || []).map((row) => ({ label: $t(`students.statuses.${row.status}`), value: row.count }))" />
      </section>
      <section class="card p-5">
        <h3 class="mb-5 text-sm font-semibold text-slate-900">{{ $t('dashboard.charts.studentsByCourse') }}</h3>
        <BarList :items="(students?.byCourse || []).map((row) => ({ label: row.course, value: row.count }))" />
      </section>
      <section class="card p-5">
        <h3 class="mb-5 text-sm font-semibold text-slate-900">{{ $t('reports.byGender') }}</h3>
        <BarList :items="(students?.byGender || []).map((row) => ({ label: row.gender === 'unknown' ? $t('common.notSet') : $t(`students.genders.${row.gender}`), value: row.count }))" />
      </section>
    </div>
  </div>
</template>
