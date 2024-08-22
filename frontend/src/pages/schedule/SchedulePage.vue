<script setup lang="ts">
import { CalendarDaysIcon, MapPinIcon, PlusIcon } from '@heroicons/vue/20/solid';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import ScheduleSlotModal from '@/components/schedule/ScheduleSlotModal.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { useAsync } from '@/composables/useAsync';
import { useDays } from '@/composables/useDays';
import { schedulesService } from '@/services/schedules.service';
import { useAuthStore } from '@/stores/auth';
import { useLookupsStore } from '@/stores/lookups';
import type { Schedule } from '@/types/models';
import { formatTime, fullName } from '@/utils/format';

const auth = useAuthStore();
const lookups = useLookupsStore();
const router = useRouter();
const { dayName } = useDays();

const filters = ref<{ groupId: string | null; teacherId: string | null }>({ groupId: null, teacherId: null });
const schedules = useAsync(() =>
  schedulesService.list({ groupId: filters.value.groupId || undefined, teacherId: filters.value.teacherId || undefined }),
);
watch(filters, () => schedules.run(), { deep: true });

onMounted(() => {
  lookups.loadGroups().catch(() => undefined);
  if (auth.isStaff) lookups.loadTeachers().catch(() => undefined);
});

const todayIndex = (() => {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
})();
const mobileDay = ref(todayIndex);
const days = [1, 2, 3, 4, 5, 6, 7];

/** Only active/planned groups appear on the timetable. */
const byDay = computed(() => {
  const map = new Map<number, Schedule[]>(days.map((day) => [day, []]));
  for (const slot of schedules.data.value || []) {
    if (slot.group && !['active', 'planned'].includes(slot.group.status)) continue;
    map.get(slot.dayOfWeek)?.push(slot);
  }
  return map;
});
const hasLessons = computed(() => [...byDay.value.values()].some((list) => list.length));

const slotOpen = ref(false);
const editing = ref<Schedule | null>(null);

function onSlotClick(slot: Schedule) {
  if (auth.isStaff) {
    editing.value = slot;
    slotOpen.value = true;
  } else {
    router.push({ name: 'group-detail', params: { id: slot.groupId } });
  }
}

function openCreate() {
  editing.value = null;
  slotOpen.value = true;
}
</script>

<template>
  <div>
    <PageHeader :title="$t('nav.schedule')" :subtitle="$t('schedule.subtitle')">
      <template v-if="auth.isStaff" #actions>
        <AppButton :icon="PlusIcon" @click="openCreate">{{ $t('schedule.addSlot') }}</AppButton>
      </template>
    </PageHeader>

    <div v-if="!auth.isStudent" class="mb-5 grid grid-cols-1 gap-3 sm:flex">
      <AppSelect v-model="filters.groupId" :options="lookups.groupOptions()" :placeholder="$t('students.allGroups')" class="sm:w-60" />
      <AppSelect v-if="auth.isStaff" v-model="filters.teacherId" :options="lookups.teacherOptions()" :placeholder="$t('groups.allTeachers')" class="sm:w-60" />
    </div>

    <ErrorState v-if="schedules.error.value" :message="schedules.error.value" @retry="schedules.run" />
    <div v-else-if="schedules.loading.value && !schedules.data.value" class="grid grid-cols-1 gap-3 lg:grid-cols-7">
      <AppSkeleton v-for="i in 7" :key="i" class="h-48" />
    </div>
    <div v-else-if="!hasLessons" class="card">
      <EmptyState :icon="CalendarDaysIcon" :title="$t('schedule.emptyTitle')" :description="$t('schedule.emptyDescription')" />
    </div>
    <template v-else>
      <!-- Mobile: day switcher -->
      <div class="scrollbar-thin -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 lg:hidden">
        <button
          v-for="day in days"
          :key="day"
          :class="[
            'flex min-w-[3.25rem] flex-col items-center rounded-xl border px-2 py-2 text-xs font-medium transition',
            mobileDay === day ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600',
          ]"
          @click="mobileDay = day"
        >
          {{ dayName(day, true) }}
          <span :class="['mt-1 text-[11px]', mobileDay === day ? 'text-brand-100' : 'text-slate-400']">{{ byDay.get(day)?.length || 0 }}</span>
        </button>
      </div>

      <div class="grid grid-cols-1 gap-3 lg:grid-cols-7">
        <section
          v-for="day in days"
          :key="day"
          :class="[
            'rounded-xl border bg-white',
            day === todayIndex ? 'border-brand-200 ring-1 ring-brand-100' : 'border-slate-200/80',
            mobileDay === day ? 'block' : 'hidden lg:block',
          ]"
        >
          <header :class="['flex items-center justify-between border-b px-3 py-2.5', day === todayIndex ? 'border-brand-100 bg-brand-50/60' : 'border-slate-100']">
            <span :class="['text-sm font-semibold', day === todayIndex ? 'text-brand-700' : 'text-slate-900']">{{ dayName(day) }}</span>
            <span v-if="day === todayIndex" class="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">{{ $t('common.today') }}</span>
          </header>
          <div class="space-y-2 p-2">
            <p v-if="!byDay.get(day)?.length" class="py-6 text-center text-xs text-slate-400">{{ $t('schedule.noLessons') }}</p>
            <button
              v-for="slot in byDay.get(day)"
              :key="slot.id"
              type="button"
              class="w-full rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-left transition hover:border-slate-200 hover:bg-white hover:shadow-sm"
              :style="{ borderLeft: `3px solid ${slot.group?.course?.color || '#6366f1'}` }"
              @click="onSlotClick(slot)"
            >
              <p class="text-xs font-semibold tabular-nums text-slate-900">{{ formatTime(slot.startTime) }}–{{ formatTime(slot.endTime) }}</p>
              <p class="mt-1 truncate text-sm font-medium text-slate-800">{{ slot.group?.name }}</p>
              <p class="truncate text-[11px] text-slate-500">{{ slot.group?.course?.name }}</p>
              <p class="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span class="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap"><MapPinIcon class="h-3 w-3" />{{ slot.room || '—' }}</span>
                <span v-if="slot.group?.teacher && !auth.isTeacher" class="truncate">{{ fullName(slot.group.teacher.user) }}</span>
              </p>
            </button>
          </div>
        </section>
      </div>
    </template>

    <ScheduleSlotModal v-if="auth.isStaff" :open="slotOpen" :slot="editing" @close="slotOpen = false" @saved="schedules.run()" />
  </div>
</template>
