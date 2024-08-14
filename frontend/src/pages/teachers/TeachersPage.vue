<script setup lang="ts">
import { AcademicCapIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/vue/20/solid';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import TeacherFormModal from '@/components/teachers/TeacherFormModal.vue';
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
import { teachersService } from '@/services/teachers.service';
import { useLookupsStore } from '@/stores/lookups';
import type { Teacher } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { fullName } from '@/utils/format';

const { t } = useI18n();
const toast = useToast();
const lookups = useLookupsStore();
const { confirmDelete } = useConfirm();

const table = useTable<Teacher, { courseId: string | null }>(teachersService.list, {
  sortBy: 'createdAt',
  filters: { courseId: null },
});

const formOpen = ref(false);
const editing = ref<Teacher | null>(null);

onMounted(() => lookups.loadCourses().catch(() => undefined));

const columns = computed<TableColumn[]>(() => [
  { key: 'firstName', label: t('teachers.columns.teacher'), sortable: true },
  { key: 'phone', label: t('fields.phone'), hideOnMobile: true },
  { key: 'courses', label: t('teachers.courses'), hideOnMobile: true },
  { key: 'groupsCount', label: t('teachers.columns.groups'), align: 'center', hideOnMobile: true },
  { key: 'experienceYears', label: t('teachers.experience'), sortable: true, align: 'center', hideOnMobile: true },
  { key: 'status', label: t('common.status') },
  { key: 'actions', label: '', align: 'right', class: 'w-12' },
]);

function openForm(teacher: Teacher | null) {
  editing.value = teacher;
  formOpen.value = true;
}

async function remove(teacher: Teacher) {
  if (!(await confirmDelete(fullName(teacher.user)))) return;
  try {
    await teachersService.remove(teacher.id);
    toast.success(t('teachers.deleted'));
    lookups.invalidate('teachers');
    table.load();
  } catch (error) {
    toast.error(getErrorMessage(error));
  }
}
</script>

<template>
  <div>
    <PageHeader :title="$t('nav.teachers')" :subtitle="$t('teachers.subtitle')">
      <template #actions>
        <AppButton :icon="PlusIcon" @click="openForm(null)">{{ $t('teachers.add') }}</AppButton>
      </template>
    </PageHeader>

    <div class="card overflow-hidden">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
        <SearchInput v-model="table.state.search" />
        <AppSelect v-model="table.filters.courseId" :options="lookups.courseOptions()" :placeholder="$t('teachers.allCourses')" class="sm:w-56" />
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
        @row-click="openForm"
      >
        <template #cell-firstName="{ row }">
          <div class="flex items-center gap-3">
            <AppAvatar :name="fullName(row.user)" size="sm" />
            <div class="min-w-0">
              <p class="truncate font-medium text-slate-900">{{ fullName(row.user) }}</p>
              <p class="truncate text-xs text-slate-500">{{ row.specialization || row.user.email }}</p>
            </div>
          </div>
        </template>
        <template #cell-phone="{ row }"><span class="tabular-nums">{{ row.user.phone || '—' }}</span></template>
        <template #cell-courses="{ row }">
          <div class="flex max-w-[240px] flex-wrap gap-1">
            <AppBadge v-for="course in row.courses" :key="course.id">{{ course.name }}</AppBadge>
            <span v-if="!row.courses.length" class="text-xs text-slate-400">—</span>
          </div>
        </template>
        <template #cell-groupsCount="{ row }">
          <span class="font-medium text-slate-900">{{ row.groupsCount ?? 0 }}</span>
        </template>
        <template #cell-experienceYears="{ row }">{{ $t('teachers.years', { count: row.experienceYears }) }}</template>
        <template #cell-status="{ row }">
          <AppBadge :color="row.user.isActive ? 'green' : 'gray'" dot>
            {{ row.user.isActive ? $t('common.active') : $t('common.inactive') }}
          </AppBadge>
        </template>
        <template #cell-actions="{ row }">
          <AppDropdown
            :items="[
              { label: $t('common.edit'), icon: PencilSquareIcon, action: () => openForm(row) },
              { label: $t('common.delete'), icon: TrashIcon, danger: true, action: () => remove(row) },
            ]"
          />
        </template>
        <template #empty>
          <EmptyState :icon="AcademicCapIcon" :title="$t('teachers.emptyTitle')" :description="$t('teachers.emptyDescription')">
            <AppButton :icon="PlusIcon" size="sm" @click="openForm(null)">{{ $t('teachers.add') }}</AppButton>
          </EmptyState>
        </template>
      </DataTable>
      <AppPagination :meta="table.meta.value" @page="table.setPage" />
    </div>

    <TeacherFormModal :open="formOpen" :teacher="editing" @close="formOpen = false" @saved="table.load()" />
  </div>
</template>
