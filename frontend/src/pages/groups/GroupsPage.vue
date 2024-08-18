<script setup lang="ts">
import { EyeIcon, PencilSquareIcon, PlusIcon, TrashIcon, UserGroupIcon } from '@heroicons/vue/20/solid';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import CapacityBar from '@/components/groups/CapacityBar.vue';
import GroupFormModal from '@/components/groups/GroupFormModal.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppDropdown from '@/components/ui/AppDropdown.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import DataTable, { type TableColumn } from '@/components/ui/DataTable.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useDays } from '@/composables/useDays';
import { useTable } from '@/composables/useTable';
import { useToast } from '@/composables/useToast';
import { groupsService } from '@/services/groups.service';
import { useAuthStore } from '@/stores/auth';
import { useLookupsStore } from '@/stores/lookups';
import type { Group } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatDate, fullName } from '@/utils/format';
import { statusColor } from '@/utils/status';

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();
const lookups = useLookupsStore();
const toast = useToast();
const { confirmDelete } = useConfirm();
const { scheduleSummary } = useDays();

const table = useTable<Group, { status: string | null; courseId: string | null; teacherId: string | null }>(groupsService.list, {
  sortBy: 'createdAt',
  filters: { status: null, courseId: null, teacherId: null },
});

const formOpen = ref(false);
const editing = ref<Group | null>(null);

onMounted(() => {
  lookups.loadCourses().catch(() => undefined);
  if (auth.isStaff) lookups.loadTeachers().catch(() => undefined);
});

const columns = computed<TableColumn[]>(() => [
  { key: 'name', label: t('groups.columns.group'), sortable: true },
  { key: 'teacher', label: t('fields.teacher'), hideOnMobile: true },
  { key: 'schedule', label: t('nav.schedule'), hideOnMobile: true },
  { key: 'students', label: t('groups.columns.students') },
  { key: 'startDate', label: t('groups.startDate'), sortable: true, hideOnMobile: true },
  { key: 'status', label: t('common.status'), sortable: true },
  ...(auth.isStaff ? [{ key: 'actions', label: '', align: 'right' as const, class: 'w-12' }] : []),
]);

const statusOptions = computed(() =>
  ['planned', 'active', 'completed', 'cancelled'].map((value) => ({ value, label: t(`groups.statuses.${value}`) })),
);

function openForm(group: Group | null) {
  editing.value = group;
  formOpen.value = true;
}

function open(group: Group) {
  router.push({ name: 'group-detail', params: { id: group.id } });
}

async function remove(group: Group) {
  if (!(await confirmDelete(group.name))) return;
  try {
    await groupsService.remove(group.id);
    toast.success(t('groups.deleted'));
    lookups.invalidate('groups');
    table.load();
  } catch (error) {
    toast.error(getErrorMessage(error));
  }
}
</script>

<template>
  <div>
    <PageHeader :title="auth.isStaff ? $t('nav.groups') : $t('groups.myGroups')" :subtitle="$t('groups.subtitle')">
      <template v-if="auth.isStaff" #actions>
        <AppButton :icon="PlusIcon" @click="openForm(null)">{{ $t('groups.add') }}</AppButton>
      </template>
    </PageHeader>

    <div class="card overflow-hidden">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
        <SearchInput v-model="table.state.search" />
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex">
          <AppSelect v-model="table.filters.status" :options="statusOptions" :placeholder="$t('groups.allStatuses')" class="lg:w-40" />
          <AppSelect v-model="table.filters.courseId" :options="lookups.courseOptions()" :placeholder="$t('teachers.allCourses')" class="lg:w-48" />
          <AppSelect v-if="auth.isStaff" v-model="table.filters.teacherId" :options="lookups.teacherOptions()" :placeholder="$t('groups.allTeachers')" class="lg:w-48" />
        </div>
      </div>
      <ErrorState v-if="table.error.value" :message="table.error.value" @retry="table.load" />
      <DataTable
        v-else
        :columns="columns"
        :rows="table.rows.value"
        :loading="table.loading.value"
        :sort-by="table.state.sortBy"
        :sort-order="table.state.sortOrder"
        clickable
        @sort="table.sort"
        @row-click="open"
      >
        <template #cell-name="{ row }">
          <div class="flex items-center gap-3">
            <span class="h-9 w-1 rounded-full" :style="{ backgroundColor: row.course?.color }" />
            <div class="min-w-0">
              <p class="truncate font-medium text-slate-900">{{ row.name }}</p>
              <p class="truncate text-xs text-slate-500">{{ row.course?.name }}<template v-if="row.room"> · {{ row.room }}</template></p>
            </div>
          </div>
        </template>
        <template #cell-teacher="{ row }">{{ row.teacher ? fullName(row.teacher.user) : '—' }}</template>
        <template #cell-schedule="{ row }">
          <span class="text-xs text-slate-600">{{ scheduleSummary(row.schedules) }}</span>
        </template>
        <template #cell-students="{ row }"><CapacityBar :count="row.studentsCount ?? 0" :max="row.maxStudents" /></template>
        <template #cell-startDate="{ row }">{{ formatDate(row.startDate) }}</template>
        <template #cell-status="{ row }">
          <AppBadge :color="statusColor('group', row.status)" dot>{{ $t(`groups.statuses.${row.status}`) }}</AppBadge>
        </template>
        <template #cell-actions="{ row }">
          <AppDropdown
            :items="[
              { label: $t('common.view'), icon: EyeIcon, action: () => open(row) },
              { label: $t('common.edit'), icon: PencilSquareIcon, action: () => openForm(row) },
              { label: $t('common.delete'), icon: TrashIcon, danger: true, action: () => remove(row) },
            ]"
          />
        </template>
        <template #empty>
          <EmptyState :icon="UserGroupIcon" :title="$t('groups.emptyTitle')" :description="$t('groups.emptyDescription')">
            <AppButton v-if="auth.isStaff" :icon="PlusIcon" size="sm" @click="openForm(null)">{{ $t('groups.add') }}</AppButton>
          </EmptyState>
        </template>
      </DataTable>
      <AppPagination :meta="table.meta.value" @page="table.setPage" />
    </div>

    <GroupFormModal v-if="auth.isStaff" :open="formOpen" :group="editing" @close="formOpen = false" @saved="table.load()" />
  </div>
</template>
