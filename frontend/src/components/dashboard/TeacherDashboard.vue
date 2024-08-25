<script setup lang="ts">
import { BookOpenIcon, ChartBarIcon, ClipboardDocumentCheckIcon, UserGroupIcon, UsersIcon } from '@heroicons/vue/24/outline';
import AppButton from '@/components/ui/AppButton.vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import StatCard from '@/components/ui/StatCard.vue';
import CapacityBar from '@/components/groups/CapacityBar.vue';
import { useAsync } from '@/composables/useAsync';
import { useDays } from '@/composables/useDays';
import { dashboardService } from '@/services/dashboard.service';
import TodayLessons from './TodayLessons.vue';

const dashboard = useAsync(dashboardService.teacher);
const { scheduleSummary } = useDays();
</script>

<template>
  <ErrorState v-if="dashboard.error.value" :message="dashboard.error.value" @retry="dashboard.run" />
  <div v-else class="space-y-6">
    <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatCard :label="$t('dashboard.teacher.groups')" :value="dashboard.data.value?.groupsCount" :icon="UserGroupIcon" :loading="dashboard.loading.value" />
      <StatCard :label="$t('dashboard.teacher.students')" :value="dashboard.data.value?.studentsCount" :icon="UsersIcon" color="blue" :loading="dashboard.loading.value" />
      <StatCard :label="$t('dashboard.teacher.lessonsThisMonth')" :value="dashboard.data.value?.lessonsThisMonth" :icon="BookOpenIcon" color="purple" :loading="dashboard.loading.value" />
      <StatCard :label="$t('dashboard.teacher.attendanceRate')" :value="`${dashboard.data.value?.attendanceRate ?? 0}%`" :icon="ChartBarIcon" color="green" :hint="$t('dashboard.cards.thisMonth')" :loading="dashboard.loading.value" />
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-5">
      <TodayLessons class="xl:col-span-2" :lessons="dashboard.data.value?.todayLessons ?? null" :loading="dashboard.loading.value" />
      <section class="card xl:col-span-3">
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 class="text-sm font-semibold text-slate-900">{{ $t('groups.myGroups') }}</h3>
          <RouterLink :to="{ name: 'attendance' }">
            <AppButton size="sm" variant="soft" :icon="ClipboardDocumentCheckIcon">{{ $t('groups.markAttendance') }}</AppButton>
          </RouterLink>
        </div>
        <div v-if="dashboard.loading.value" class="space-y-3 p-5"><AppSkeleton v-for="i in 3" :key="i" class="h-12" /></div>
        <EmptyState v-else-if="!dashboard.data.value?.groups.length" compact :title="$t('groups.emptyTitle')" :description="$t('dashboard.teacher.noGroups')" />
        <ul v-else class="divide-y divide-slate-100">
          <li v-for="group in dashboard.data.value.groups" :key="group.id">
            <RouterLink :to="{ name: 'group-detail', params: { id: group.id } }" class="flex items-center gap-4 px-5 py-3 transition hover:bg-slate-50">
              <span class="h-9 w-1 shrink-0 rounded-full" :style="{ backgroundColor: group.course?.color }" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-slate-900">{{ group.name }} · {{ group.course?.name }}</p>
                <p class="truncate text-xs text-slate-500">{{ scheduleSummary(group.schedules) }}</p>
              </div>
              <CapacityBar :count="group.studentsCount ?? 0" :max="group.maxStudents" />
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
