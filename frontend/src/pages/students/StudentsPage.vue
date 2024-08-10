<script setup lang="ts">
import { EyeIcon, PencilSquareIcon, PlusIcon, TrashIcon, UsersIcon } from '@heroicons/vue/20/solid';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import StudentFormModal from '@/components/students/StudentFormModal.vue';
import AppAvatar from '@/components/ui/AppAvatar.vue';
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
import { useTable } from '@/composables/useTable';
import { useToast } from '@/composables/useToast';
import { studentsService } from '@/services/students.service';
import { useAuthStore } from '@/stores/auth';
import { useLookupsStore } from '@/stores/lookups';
import type { Student } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatDate, fullName } from '@/utils/format';
import { statusColor } from '@/utils/status';

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();
const lookups = useLookupsStore();
const toast = useToast();
const { confirmDelete } = useConfirm();

const table = useTable<Student, { status: string | null; groupId: string | null }>(studentsService.list, {
  sortBy: 'createdAt',
  filters: { status: null, groupId: null },
});

const formOpen = ref(false);
const editing = ref<Student | null>(null);

onMounted(() => lookups.loadGroups().catch(() => undefined));

const columns = computed<TableColumn[]>(() => [
  { key: 'firstName', label: t('students.columns.student'), sortable: true },
  { key: 'phone', label: t('fields.phone'), hideOnMobile: true },
  { key: 'groups', label: t('students.columns.groups'), hideOnMobile: true },
  { key: 'status', label: t('common.status'), sortable: true },
  { key: 'enrolledAt', label: t('fields.enrolledAt'), sortable: true, hideOnMobile: true },
  ...(auth.isStaff ? [{ key: 'actions', label: '', align: 'right' as const, class: 'w-12' }] : []),
]);

const statusOptions = computed(() =>
  ['active', 'frozen', 'graduated', 'left'].map((value) => ({ value, label: t(`students.statuses.${value}`) })),
);

function openCreate() {
  editing.value = null;
  formOpen.value = true;
}

function openEdit(student: Student) {
  editing.value = student;
  formOpen.value = true;
}

async function remove(student: Student) {
  if (!(await confirmDelete(fullName(student.user)))) return;
  try {
    await studentsService.remove(student.id);
    toast.success(t('students.deleted'));
    table.load();
  } catch (error) {
    toast.error(getErrorMessage(error));
  }
}

function open(student: Student) {
  router.push({ name: 'student-detail', params: { id: student.id } });
}

const hasFilters = computed(() => !!(table.state.search || table.filters.status || table.filters.groupId));
</script>

<template>
  <div>
    <PageHeader :title="$t('nav.students')" :subtitle="$t('students.subtitle')">
      <template v-if="auth.isStaff" #actions>
        <AppButton :icon="PlusIcon" @click="openCreate">{{ $t('students.add') }}</AppButton>
      </template>
    </PageHeader>

    <div class="card overflow-hidden">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
        <SearchInput v-model="table.state.search" :placeholder="$t('students.searchPlaceholder')" />
        <div class="grid grid-cols-2 gap-3 sm:flex">
          <AppSelect v-model="table.filters.status" :options="statusOptions" :placeholder="$t('students.allStatuses')" class="sm:w-44" />
          <AppSelect v-model="table.filters.groupId" :options="lookups.groupOptions()" :placeholder="$t('students.allGroups')" class="sm:w-56" />
        </div>
        <AppButton v-if="hasFilters" variant="ghost" size="sm" class="sm:ml-auto" @click="table.resetFilters()">
          {{ $t('common.reset') }}
        </AppButton>
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
        <template #cell-firstName="{ row }">
          <div class="flex items-center gap-3">
            <AppAvatar :name="fullName(row.user)" size="sm" />
            <div class="min-w-0">
              <p class="truncate font-medium text-slate-900">{{ fullName(row.user) }}</p>
              <p class="truncate text-xs text-slate-500">{{ row.user.email }}</p>
            </div>
          </div>
        </template>
        <template #cell-phone="{ row }">
          <span class="tabular-nums">{{ row.user.phone || '—' }}</span>
        </template>
        <template #cell-groups="{ row }">
          <div class="flex max-w-[220px] flex-wrap gap-1">
            <AppBadge v-for="link in row.groupLinks" :key="link.id" color="indigo">{{ link.group?.name }}</AppBadge>
            <span v-if="!row.groupLinks?.length" class="text-xs text-slate-400">{{ $t('students.noGroups') }}</span>
          </div>
        </template>
        <template #cell-status="{ row }">
          <AppBadge :color="statusColor('student', row.status)" dot>{{ $t(`students.statuses.${row.status}`) }}</AppBadge>
        </template>
        <template #cell-enrolledAt="{ row }">{{ formatDate(row.enrolledAt) }}</template>
        <template #cell-actions="{ row }">
          <AppDropdown
            :items="[
              { label: $t('common.view'), icon: EyeIcon, action: () => open(row) },
              { label: $t('common.edit'), icon: PencilSquareIcon, action: () => openEdit(row) },
              { label: $t('common.delete'), icon: TrashIcon, danger: true, action: () => remove(row) },
            ]"
          />
        </template>
        <template #empty>
          <EmptyState
            :icon="UsersIcon"
            :title="hasFilters ? $t('empty.title') : $t('students.emptyTitle')"
            :description="hasFilters ? $t('empty.description') : $t('students.emptyDescription')"
          >
            <AppButton v-if="auth.isStaff && !hasFilters" :icon="PlusIcon" size="sm" @click="openCreate">
              {{ $t('students.add') }}
            </AppButton>
          </EmptyState>
        </template>
      </DataTable>
      <AppPagination :meta="table.meta.value" :limit-options="[10, 20, 50]" @page="table.setPage" @limit="table.setLimit" />
    </div>

    <StudentFormModal :open="formOpen" :student="editing" @close="formOpen = false" @saved="table.load()" />
  </div>
</template>
