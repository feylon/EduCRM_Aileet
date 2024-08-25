<script setup lang="ts">
import {
  AcademicCapIcon,
  BanknotesIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/vue/24/outline';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import BarChart from '@/components/charts/BarChart.vue';
import BarList from '@/components/charts/BarList.vue';
import LineChart from '@/components/charts/LineChart.vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import StatCard from '@/components/ui/StatCard.vue';
import { useAsync } from '@/composables/useAsync';
import { dashboardService } from '@/services/dashboard.service';
import { formatCompactMoney, formatMoney, formatMonth, formatNumber } from '@/utils/format';
import TodayLessons from './TodayLessons.vue';

const { t } = useI18n();
const stats = useAsync(dashboardService.statistics);
const charts = useAsync(dashboardService.charts);
const today = useAsync(dashboardService.today);

const revenueTrend = computed(() => {
  const revenue = stats.data.value?.revenue;
  if (!revenue || !revenue.previousMonth) return null;
  return Math.round(((revenue.currentMonth - revenue.previousMonth) / revenue.previousMonth) * 100);
});

const cards = computed(() => {
  const s = stats.data.value;
  return [
    { label: t('dashboard.cards.students'), value: formatNumber(s?.students.active), icon: UsersIcon, color: 'indigo', hint: t('dashboard.cards.newThisMonth', { count: s?.students.newThisMonth ?? 0 }) },
    { label: t('dashboard.cards.teachers'), value: formatNumber(s?.teachers), icon: AcademicCapIcon, color: 'purple' },
    { label: t('dashboard.cards.activeGroups'), value: formatNumber(s?.groups.active), icon: UserGroupIcon, color: 'blue', hint: t('dashboard.cards.ofTotal', { total: s?.groups.total ?? 0 }) },
    { label: t('dashboard.cards.courses'), value: formatNumber(s?.courses), icon: BookOpenIcon, color: 'teal' },
    { label: t('dashboard.cards.monthlyRevenue'), value: formatMoney(s?.revenue.currentMonth), icon: BanknotesIcon, color: 'green', trend: revenueTrend.value, hint: t('dashboard.cards.vsLastMonth') },
    { label: t('dashboard.cards.debts'), value: formatMoney(s?.debts.total), icon: ExclamationTriangleIcon, color: 'red', hint: t('dashboard.cards.debtors', { count: s?.debts.debtors ?? 0 }) },
    { label: t('dashboard.cards.newLeads'), value: formatNumber(s?.newLeads), icon: FunnelIcon, color: 'amber', hint: t('dashboard.cards.thisMonth') },
    { label: t('dashboard.cards.todayLessons'), value: formatNumber(s?.todayLessons), icon: CalendarDaysIcon, color: 'pink' },
  ] as const;
});

const c = computed(() => charts.data.value);
const funnel = computed(() =>
  (c.value?.leadFunnel || []).map((row) => ({ label: t(`leads.statuses.${row.status}`), value: row.count })),
);
const sources = computed(() =>
  [...(c.value?.leadSources || [])]
    .sort((a, b) => b.total - a.total)
    .map((row) => ({
      label: t(`leads.sources.${row.source}`),
      value: row.total,
      hint: t('dashboard.converted', { count: row.converted }),
    })),
);
const byCourse = computed(() => (c.value?.studentsByCourse || []).map((row) => ({ label: row.course, value: row.count })));
const conversionRate = computed(() => {
  const rows = c.value?.leadFunnel || [];
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const converted = rows.find((row) => row.status === 'converted')?.count || 0;
  return total ? Math.round((converted / total) * 100) : 0;
});
</script>

<template>
  <div class="space-y-6">
    <ErrorState v-if="stats.error.value" :message="stats.error.value" @retry="stats.run" />
    <div v-else class="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <StatCard
        v-for="card in cards"
        :key="card.label"
        :label="card.label"
        :value="card.value"
        :icon="card.icon"
        :color="card.color"
        :hint="'hint' in card ? card.hint : undefined"
        :trend="'trend' in card ? card.trend : undefined"
        :loading="stats.loading.value"
      />
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <section class="card p-5 xl:col-span-2">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">{{ $t('dashboard.charts.revenue') }}</h3>
            <p class="text-xs text-slate-500">{{ $t('dashboard.charts.last12Months') }}</p>
          </div>
        </div>
        <AppSkeleton v-if="charts.loading.value" class="h-[260px]" />
        <BarChart
          v-else-if="c"
          :labels="c.revenue.map((row) => formatMonth(row.month, true))"
          :values="c.revenue.map((row) => row.total)"
          :label="$t('dashboard.charts.revenue')"
          :format="formatCompactMoney"
        />
      </section>

      <section class="card p-5">
        <div class="mb-5 flex items-start justify-between">
          <div>
            <h3 class="text-sm font-semibold text-slate-900">{{ $t('dashboard.charts.leadFunnel') }}</h3>
            <p class="text-xs text-slate-500">{{ $t('dashboard.charts.allTime') }}</p>
          </div>
          <div class="text-right">
            <p class="text-xl font-semibold text-slate-900">{{ conversionRate }}%</p>
            <p class="text-[11px] text-slate-500">{{ $t('dashboard.charts.conversion') }}</p>
          </div>
        </div>
        <div v-if="charts.loading.value" class="space-y-4"><AppSkeleton v-for="i in 5" :key="i" class="h-8" /></div>
        <BarList v-else :items="funnel" />
      </section>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section class="card p-5">
        <h3 class="text-sm font-semibold text-slate-900">{{ $t('dashboard.charts.newStudents') }}</h3>
        <p class="mb-4 text-xs text-slate-500">{{ $t('dashboard.charts.last12Months') }}</p>
        <AppSkeleton v-if="charts.loading.value" class="h-[220px]" />
        <LineChart
          v-else-if="c"
          :labels="c.newStudents.map((row) => formatMonth(row.month, true))"
          :values="c.newStudents.map((row) => row.count)"
          :label="$t('dashboard.charts.newStudents')"
        />
      </section>
      <section class="card p-5">
        <h3 class="text-sm font-semibold text-slate-900">{{ $t('dashboard.charts.attendanceRate') }}</h3>
        <p class="mb-4 text-xs text-slate-500">{{ $t('dashboard.charts.last6Months') }}</p>
        <AppSkeleton v-if="charts.loading.value" class="h-[220px]" />
        <LineChart
          v-else-if="c"
          :labels="c.attendance.map((row) => formatMonth(row.month, true))"
          :values="c.attendance.map((row) => (row.present + row.late + row.absent + row.excused ? row.rate : null))"
          :label="$t('dashboard.charts.attendanceRate')"
          :format="(value) => `${value}%`"
          :max="100"
        />
      </section>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <TodayLessons :lessons="today.data.value" :loading="today.loading.value" show-teacher />
      <section class="card p-5">
        <h3 class="mb-5 text-sm font-semibold text-slate-900">{{ $t('dashboard.charts.studentsByCourse') }}</h3>
        <div v-if="charts.loading.value" class="space-y-4"><AppSkeleton v-for="i in 5" :key="i" class="h-8" /></div>
        <BarList v-else :items="byCourse" />
      </section>
      <section class="card p-5">
        <h3 class="mb-5 text-sm font-semibold text-slate-900">{{ $t('dashboard.charts.leadSources') }}</h3>
        <div v-if="charts.loading.value" class="space-y-4"><AppSkeleton v-for="i in 5" :key="i" class="h-8" /></div>
        <BarList v-else :items="sources" />
      </section>
    </div>
  </div>
</template>
