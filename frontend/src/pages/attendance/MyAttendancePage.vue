<script setup lang="ts">
import { CheckCircleIcon, ChartBarIcon, ClockIcon, XCircleIcon } from '@heroicons/vue/24/outline';
import AttendanceHistory from '@/components/attendance/AttendanceHistory.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import StatCard from '@/components/ui/StatCard.vue';
import { useAsync } from '@/composables/useAsync';
import { attendanceService } from '@/services/attendance.service';

const summary = useAsync(attendanceService.mySummary);
</script>

<template>
  <div>
    <PageHeader :title="$t('nav.myAttendance')" :subtitle="$t('attendance.mySubtitle')" />
    <div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard :label="$t('attendance.rate')" :value="`${summary.data.value?.rate ?? 0}%`" :icon="ChartBarIcon" :loading="summary.loading.value" />
      <StatCard :label="$t('attendance.statuses.present')" :value="summary.data.value?.present ?? 0" :icon="CheckCircleIcon" color="green" :loading="summary.loading.value" />
      <StatCard :label="$t('attendance.statuses.late')" :value="summary.data.value?.late ?? 0" :icon="ClockIcon" color="amber" :loading="summary.loading.value" />
      <StatCard :label="$t('attendance.statuses.absent')" :value="summary.data.value?.absent ?? 0" :icon="XCircleIcon" color="red" :loading="summary.loading.value" />
    </div>
    <div class="card overflow-hidden">
      <AttendanceHistory />
    </div>
  </div>
</template>
