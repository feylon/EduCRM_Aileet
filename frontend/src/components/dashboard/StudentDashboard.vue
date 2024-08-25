<script setup lang="ts">
import { BanknotesIcon, ChartBarIcon, ExclamationTriangleIcon, UserGroupIcon } from '@heroicons/vue/24/outline';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import StatCard from '@/components/ui/StatCard.vue';
import { useAsync } from '@/composables/useAsync';
import { dashboardService } from '@/services/dashboard.service';
import { formatDate, formatMoney, formatMonth, fullName } from '@/utils/format';
import TodayLessons from './TodayLessons.vue';

const dashboard = useAsync(dashboardService.student);
</script>

<template>
  <ErrorState v-if="dashboard.error.value" :message="dashboard.error.value" @retry="dashboard.run" />
  <div v-else class="space-y-6">
    <div
      v-if="dashboard.data.value && dashboard.data.value.balance.totalDebt > 0"
      class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <ExclamationTriangleIcon class="h-5 w-5 shrink-0 text-amber-500" />
      <p>{{ $t('dashboard.student.debtWarning', { amount: formatMoney(dashboard.data.value.balance.totalDebt) }) }}</p>
    </div>

    <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatCard :label="$t('groups.myGroups')" :value="dashboard.data.value?.groups.length" :icon="UserGroupIcon" :loading="dashboard.loading.value" />
      <StatCard :label="$t('attendance.rate')" :value="`${dashboard.data.value?.attendance.rate ?? 0}%`" :icon="ChartBarIcon" color="green" :loading="dashboard.loading.value" />
      <StatCard :label="$t('dashboard.student.lessonsAttended')" :value="(dashboard.data.value?.attendance.present ?? 0) + (dashboard.data.value?.attendance.late ?? 0)" :icon="UserGroupIcon" color="blue" :loading="dashboard.loading.value" />
      <StatCard :label="$t('dashboard.student.debt')" :value="formatMoney(dashboard.data.value?.balance.totalDebt)" :icon="BanknotesIcon" :color="dashboard.data.value?.balance.totalDebt ? 'red' : 'teal'" :loading="dashboard.loading.value" />
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <TodayLessons :lessons="dashboard.data.value?.todayLessons ?? null" :loading="dashboard.loading.value" show-teacher />
      <section class="card">
        <h3 class="border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-900">{{ $t('groups.myGroups') }}</h3>
        <div v-if="dashboard.loading.value" class="space-y-3 p-5"><AppSkeleton v-for="i in 2" :key="i" class="h-12" /></div>
        <EmptyState v-else-if="!dashboard.data.value?.groups.length" compact :title="$t('students.noGroups')" />
        <ul v-else class="divide-y divide-slate-100">
          <li v-for="group in dashboard.data.value.groups" :key="group.id" class="flex items-center gap-4 px-5 py-3">
            <span class="h-9 w-1 shrink-0 rounded-full" :style="{ backgroundColor: group.course?.color }" />
            <div class="min-w-0 flex-1">
              <RouterLink :to="{ name: 'group-detail', params: { id: group.id } }" class="block truncate text-sm font-medium text-slate-900 hover:text-brand-600">
                {{ group.name }} · {{ group.course?.name }}
              </RouterLink>
              <p class="truncate text-xs text-slate-500">{{ group.teacher ? fullName(group.teacher.user) : '—' }}</p>
            </div>
            <span class="text-sm font-medium text-slate-700">{{ formatMoney(group.course?.price) }}</span>
          </li>
        </ul>
      </section>
    </div>

    <section class="card">
      <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 class="text-sm font-semibold text-slate-900">{{ $t('dashboard.student.recentPayments') }}</h3>
        <RouterLink to="/my/payments" class="link text-xs">{{ $t('dashboard.student.allPayments') }}</RouterLink>
      </div>
      <EmptyState v-if="!dashboard.loading.value && !dashboard.data.value?.recentPayments.length" compact :title="$t('dashboard.student.noPayments')" />
      <ul v-else class="divide-y divide-slate-100">
        <li v-for="payment in dashboard.data.value?.recentPayments" :key="payment.id" class="flex items-center justify-between gap-3 px-5 py-3 text-sm">
          <div class="min-w-0">
            <p class="font-medium text-slate-900">{{ formatMonth(payment.forMonth) }}</p>
            <p class="text-xs text-slate-500">{{ payment.group?.name || '—' }} · {{ formatDate(payment.paidAt) }}</p>
          </div>
          <div class="flex items-center gap-3">
            <AppBadge :color="payment.status === 'paid' ? 'green' : 'red'">{{ $t(`payments.statuses.${payment.status}`) }}</AppBadge>
            <span class="font-semibold tabular-nums text-slate-900">{{ formatMoney(payment.amount) }}</span>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
