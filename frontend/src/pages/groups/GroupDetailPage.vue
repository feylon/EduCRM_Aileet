<script setup lang="ts">
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  MapPinIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  UserMinusIcon,
} from '@heroicons/vue/20/solid';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import AddStudentsModal from '@/components/groups/AddStudentsModal.vue';
import CapacityBar from '@/components/groups/CapacityBar.vue';
import GroupFormModal from '@/components/groups/GroupFormModal.vue';
import ScheduleSlotModal from '@/components/schedule/ScheduleSlotModal.vue';
import AppAvatar from '@/components/ui/AppAvatar.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import AppTabs from '@/components/ui/AppTabs.vue';
import DataTable, { type TableColumn } from '@/components/ui/DataTable.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import { useAsync } from '@/composables/useAsync';
import { useConfirm } from '@/composables/useConfirm';
import { useDays } from '@/composables/useDays';
import { useTable } from '@/composables/useTable';
import { useToast } from '@/composables/useToast';
import { attendanceService } from '@/services/attendance.service';
import { groupsService } from '@/services/groups.service';
import { schedulesService } from '@/services/schedules.service';
import { useAuthStore } from '@/stores/auth';
import type { GroupLink, Lesson, Schedule } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatDate, formatTime, fullName } from '@/utils/format';
import { statusColor } from '@/utils/status';

const route = useRoute();
const auth = useAuthStore();
const toast = useToast();
const { t } = useI18n();
const { confirm, confirmDelete } = useConfirm();
const { dayName } = useDays();
const id = computed(() => route.params.id as string);
const canSeeMembers = computed(() => auth.isStaff || auth.isTeacher);

const group = useAsync(() => groupsService.get(id.value));
const members = useAsync<GroupLink[]>(() => (canSeeMembers.value ? groupsService.students(id.value) : Promise.resolve([])));
const lessons = useTable<Lesson, { groupId: string }>(attendanceService.lessons, {
  sortBy: 'date',
  filters: { groupId: id.value },
  immediate: false,
});

const tab = ref(canSeeMembers.value ? 'students' : 'schedule');
const editOpen = ref(false);
const addOpen = ref(false);
const slotOpen = ref(false);
const editingSlot = ref<Schedule | null>(null);

watch(tab, (value) => {
  if (value === 'lessons' && !lessons.meta.value) lessons.load();
});

const activeMembers = computed(() => (members.data.value || []).filter((link) => link.status === 'active'));
const freeSeats = computed(() => Math.max(0, (group.data.value?.maxStudents || 0) - activeMembers.value.length));

const tabs = computed(() => [
  ...(canSeeMembers.value ? [{ value: 'students', label: t('groups.tabs.students'), count: activeMembers.value.length }] : []),
  { value: 'schedule', label: t('groups.tabs.schedule'), count: group.data.value?.schedules?.length },
  ...(canSeeMembers.value ? [{ value: 'lessons', label: t('groups.tabs.lessons') }] : []),
]);

const memberColumns = computed<TableColumn[]>(() => [
  { key: 'student', label: t('students.columns.student') },
  { key: 'phone', label: t('fields.phone'), hideOnMobile: true },
  { key: 'joinedAt', label: t('groups.joinedAt'), hideOnMobile: true },
  { key: 'status', label: t('common.status') },
  ...(auth.isStaff ? [{ key: 'actions', label: '', align: 'right' as const, class: 'w-12' }] : []),
]);

const lessonColumns = computed<TableColumn[]>(() => [
  { key: 'date', label: t('fields.date'), sortable: true },
  { key: 'topic', label: t('attendance.topic') },
  { key: 'attendance', label: t('nav.attendance'), align: 'right' },
]);

async function removeMember(link: GroupLink) {
  const ok = await confirm({
    title: t('groups.removeStudentTitle'),
    message: t('groups.removeStudentMessage', { name: fullName(link.student?.user) }),
    confirmText: t('groups.removeStudent'),
  });
  if (!ok) return;
  try {
    await groupsService.removeStudent(id.value, link.studentId);
    toast.success(t('groups.studentRemoved'));
    members.run();
  } catch (error) {
    toast.error(getErrorMessage(error));
  }
}

function openSlot(slot: Schedule | null) {
  editingSlot.value = slot;
  slotOpen.value = true;
}

async function removeSlot(slot: Schedule) {
  if (!(await confirmDelete(`${dayName(slot.dayOfWeek)} ${formatTime(slot.startTime)}`))) return;
  try {
    await schedulesService.remove(slot.id);
    group.run();
  } catch (error) {
    toast.error(getErrorMessage(error));
  }
}

function refreshAll() {
  group.run();
  members.run();
}
</script>

<template>
  <div>
    <RouterLink :to="{ name: 'groups' }" class="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
      <ArrowLeftIcon class="h-4 w-4" /> {{ $t('nav.groups') }}
    </RouterLink>

    <ErrorState v-if="group.error.value" :message="group.error.value" @retry="group.run" />
    <template v-else>
      <div class="card overflow-hidden">
        <div class="h-1.5" :style="{ backgroundColor: group.data.value?.course?.color || '#e2e8f0' }" />
        <div class="p-5 sm:p-6">
          <div v-if="!group.data.value" class="space-y-3"><AppSkeleton class="h-6 w-48" /><AppSkeleton class="h-4 w-80" /></div>
          <div v-else class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-xl font-semibold text-slate-900">{{ group.data.value.name }}</h1>
                <AppBadge :color="statusColor('group', group.data.value.status)" dot>{{ $t(`groups.statuses.${group.data.value.status}`) }}</AppBadge>
              </div>
              <p class="mt-1 text-sm text-slate-500">{{ group.data.value.course?.name }}</p>
              <div class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                <span class="inline-flex items-center gap-1.5"><UserIcon class="h-4 w-4 text-slate-400" />{{ group.data.value.teacher ? fullName(group.data.value.teacher.user) : $t('groups.noTeacher') }}</span>
                <span class="inline-flex items-center gap-1.5"><MapPinIcon class="h-4 w-4 text-slate-400" />{{ group.data.value.room || '—' }}</span>
                <span class="inline-flex items-center gap-1.5">
                  <CalendarDaysIcon class="h-4 w-4 text-slate-400" />{{ formatDate(group.data.value.startDate) }} — {{ formatDate(group.data.value.endDate) }}
                </span>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <CapacityBar v-if="canSeeMembers" :count="activeMembers.length" :max="group.data.value.maxStudents" />
              <RouterLink v-if="canSeeMembers" :to="`/attendance?groupId=${id}`">
                <AppButton variant="soft" :icon="ClipboardDocumentCheckIcon">{{ $t('groups.markAttendance') }}</AppButton>
              </RouterLink>
              <AppButton v-if="auth.isStaff" variant="secondary" :icon="PencilSquareIcon" @click="editOpen = true">{{ $t('common.edit') }}</AppButton>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6"><AppTabs v-model="tab" :tabs="tabs" /></div>

      <!-- Students -->
      <div v-if="tab === 'students'" class="card mt-6 overflow-hidden">
        <div v-if="auth.isStaff" class="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <p class="text-sm text-slate-500">{{ $t('groups.freeSeats', { count: freeSeats }) }}</p>
          <AppButton size="sm" :icon="PlusIcon" :disabled="!freeSeats" @click="addOpen = true">{{ $t('groups.addStudents') }}</AppButton>
        </div>
        <ErrorState v-if="members.error.value" :message="members.error.value" @retry="members.run" />
        <DataTable v-else :columns="memberColumns" :rows="members.data.value || []" :loading="members.loading.value">
          <template #cell-student="{ row }">
            <RouterLink :to="`/students/${row.studentId}`" class="flex items-center gap-3 hover:text-brand-600">
              <AppAvatar :name="fullName(row.student?.user)" size="sm" />
              <span :class="['font-medium', row.status === 'left' ? 'text-slate-400 line-through' : 'text-slate-900']">{{ fullName(row.student?.user) }}</span>
            </RouterLink>
          </template>
          <template #cell-phone="{ row }"><span class="tabular-nums">{{ row.student?.user.phone || '—' }}</span></template>
          <template #cell-joinedAt="{ row }">{{ formatDate(row.joinedAt) }}<template v-if="row.leftAt"> — {{ formatDate(row.leftAt) }}</template></template>
          <template #cell-status="{ row }">
            <AppBadge :color="row.status === 'active' ? 'green' : 'gray'" dot>{{ $t(`groups.memberStatuses.${row.status}`) }}</AppBadge>
          </template>
          <template #cell-actions="{ row }">
            <button
              v-if="row.status === 'active'"
              class="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              :title="$t('groups.removeStudent')"
              @click="removeMember(row)"
            >
              <UserMinusIcon class="h-4 w-4" />
            </button>
          </template>
          <template #empty>
            <EmptyState :title="$t('groups.noMembers')" :description="$t('groups.noMembersHint')" compact />
          </template>
        </DataTable>
      </div>

      <!-- Schedule -->
      <div v-if="tab === 'schedule'" class="card mt-6 overflow-hidden">
        <div v-if="auth.isStaff" class="flex justify-end border-b border-slate-100 px-5 py-3">
          <AppButton size="sm" :icon="PlusIcon" @click="openSlot(null)">{{ $t('schedule.addSlot') }}</AppButton>
        </div>
        <EmptyState v-if="!group.data.value?.schedules?.length" compact :icon="CalendarDaysIcon" :title="$t('schedule.noSlots')" :description="$t('schedule.noSlotsHint')" />
        <ul v-else class="divide-y divide-slate-100">
          <li v-for="slot in group.data.value.schedules" :key="slot.id" class="flex items-center gap-4 px-5 py-3.5">
            <span class="w-28 text-sm font-medium text-slate-900">{{ dayName(slot.dayOfWeek) }}</span>
            <span class="text-sm tabular-nums text-slate-600">{{ formatTime(slot.startTime) }} – {{ formatTime(slot.endTime) }}</span>
            <span class="inline-flex items-center gap-1 text-sm text-slate-500"><MapPinIcon class="h-4 w-4 text-slate-400" />{{ slot.room || '—' }}</span>
            <span v-if="auth.isStaff" class="ml-auto flex gap-1">
              <button class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" :title="$t('common.edit')" @click="openSlot(slot)"><PencilSquareIcon class="h-4 w-4" /></button>
              <button class="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" :title="$t('common.delete')" @click="removeSlot(slot)"><TrashIcon class="h-4 w-4" /></button>
            </span>
          </li>
        </ul>
      </div>

      <!-- Lessons -->
      <div v-if="tab === 'lessons'" class="card mt-6 overflow-hidden">
        <ErrorState v-if="lessons.error.value" :message="lessons.error.value" @retry="lessons.load" />
        <DataTable
          v-else
          :columns="lessonColumns"
          :rows="lessons.rows.value"
          :loading="lessons.loading.value"
          :sort-by="lessons.state.sortBy"
          :sort-order="lessons.state.sortOrder"
          @sort="lessons.sort"
        >
          <template #cell-date="{ row }">{{ formatDate(row.date) }}</template>
          <template #cell-topic="{ row }"><span class="block max-w-sm truncate">{{ row.topic || '—' }}</span></template>
          <template #cell-attendance="{ row }">
            <span class="font-medium text-slate-900">{{ row.presentCount }}</span><span class="text-slate-400">/{{ row.totalCount }}</span>
          </template>
        </DataTable>
        <AppPagination :meta="lessons.meta.value" @page="lessons.setPage" />
      </div>
    </template>

    <GroupFormModal v-if="auth.isStaff" :open="editOpen" :group="group.data.value" @close="editOpen = false" @saved="group.run()" />
    <AddStudentsModal
      v-if="auth.isStaff"
      :open="addOpen"
      :group-id="id"
      :existing-ids="activeMembers.map((link) => link.studentId)"
      :free-seats="freeSeats"
      @close="addOpen = false"
      @added="refreshAll"
    />
    <ScheduleSlotModal
      v-if="auth.isStaff"
      :open="slotOpen"
      :slot="editingSlot"
      :group-id="id"
      :default-room="group.data.value?.room"
      @close="slotOpen = false"
      @saved="group.run()"
    />
  </div>
</template>
