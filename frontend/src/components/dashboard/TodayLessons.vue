<script setup lang="ts">
import { CalendarDaysIcon, MapPinIcon } from '@heroicons/vue/20/solid';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import type { Schedule } from '@/types/models';
import { formatTime, fullName } from '@/utils/format';

defineProps<{ lessons: Schedule[] | null; loading?: boolean; showTeacher?: boolean }>();

function isNow(lesson: Schedule) {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return lesson.startTime.slice(0, 5) <= time && time < lesson.endTime.slice(0, 5);
}
</script>

<template>
  <div class="card flex flex-col">
    <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <h3 class="text-sm font-semibold text-slate-900">{{ $t('dashboard.todayLessons') }}</h3>
      <RouterLink :to="{ name: 'schedule' }" class="link text-xs">{{ $t('dashboard.fullSchedule') }}</RouterLink>
    </div>
    <div v-if="loading" class="space-y-3 p-5">
      <AppSkeleton v-for="i in 3" :key="i" class="h-12" />
    </div>
    <EmptyState
      v-else-if="!lessons?.length"
      compact
      :icon="CalendarDaysIcon"
      :title="$t('dashboard.noLessonsToday')"
      :description="$t('dashboard.noLessonsTodayHint')"
    />
    <ul v-else class="divide-y divide-slate-100">
      <li v-for="lesson in lessons" :key="lesson.id" class="flex items-center gap-4 px-5 py-3">
        <div class="w-14 shrink-0 text-center">
          <p class="text-sm font-semibold tabular-nums text-slate-900">{{ formatTime(lesson.startTime) }}</p>
          <p class="text-[11px] tabular-nums text-slate-400">{{ formatTime(lesson.endTime) }}</p>
        </div>
        <span class="h-9 w-1 shrink-0 rounded-full" :style="{ backgroundColor: lesson.group?.course?.color || '#6366f1' }" />
        <div class="min-w-0 flex-1">
          <RouterLink
            :to="{ name: 'group-detail', params: { id: lesson.groupId } }"
            class="block truncate text-sm font-medium text-slate-900 hover:text-brand-600"
          >
            {{ lesson.group?.name }} · {{ lesson.group?.course?.name }}
          </RouterLink>
          <p class="mt-0.5 flex items-center gap-3 truncate text-xs text-slate-500">
            <span v-if="lesson.room" class="inline-flex items-center gap-1"><MapPinIcon class="h-3.5 w-3.5" />{{ lesson.room }}</span>
            <span v-if="showTeacher && lesson.group?.teacher">{{ fullName(lesson.group.teacher.user) }}</span>
          </p>
        </div>
        <span
          v-if="isNow(lesson)"
          class="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20"
        >
          {{ $t('dashboard.inProgress') }}
        </span>
      </li>
    </ul>
  </div>
</template>
