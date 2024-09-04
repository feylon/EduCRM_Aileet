<script setup lang="ts">
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/vue/20/solid';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import UserFormModal from '@/components/users/UserFormModal.vue';
import AppAvatar from '@/components/ui/AppAvatar.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppDropdown from '@/components/ui/AppDropdown.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import AppTabs from '@/components/ui/AppTabs.vue';
import DataTable, { type TableColumn } from '@/components/ui/DataTable.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useTable } from '@/composables/useTable';
import { useToast } from '@/composables/useToast';
import { usersService } from '@/services/users.service';
import { useAuthStore } from '@/stores/auth';
import type { User } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatDateTime, fullName } from '@/utils/format';

const { t } = useI18n();
const toast = useToast();
const auth = useAuthStore();
const { confirmDelete } = useConfirm();

const table = useTable<User, { role: string | null }>(usersService.list, { sortBy: 'createdAt', filters: { role: 'admin' } });
const roleTab = computed({
  get: () => table.filters.role || 'all',
  set: (value: string) => (table.filters.role = value === 'all' ? null : value),
});
const tabs = computed(() => [
  { value: 'admin', label: t('roles.admin') },
  { value: 'super_admin', label: t('roles.super_admin') },
  { value: 'teacher', label: t('roles.teacher') },
  { value: 'student', label: t('roles.student') },
  { value: 'all', label: t('common.all') },
]);

const ROLE_COLORS = { super_admin: 'purple', admin: 'indigo', teacher: 'blue', student: 'teal' } as const;

const columns = computed<TableColumn[]>(() => [
  { key: 'firstName', label: t('users.columns.user'), sortable: true },
  { key: 'phone', label: t('fields.phone'), hideOnMobile: true },
  { key: 'role', label: t('users.role'), sortable: true },
  { key: 'status', label: t('common.status') },
  { key: 'lastLoginAt', label: t('users.lastLogin'), sortable: true, hideOnMobile: true },
  { key: 'actions', label: '', align: 'right', class: 'w-12' },
]);

const formOpen = ref(false);
const editing = ref<User | null>(null);
function openForm(user: User | null) {
  editing.value = user;
  formOpen.value = true;
}
async function remove(user: User) {
  if (!(await confirmDelete(fullName(user)))) return;
  try {
    await usersService.remove(user.id);
    toast.success(t('users.deleted'));
    table.load();
  } catch (error) {
    toast.error(getErrorMessage(error));
  }
}
</script>

<template>
  <div>
    <PageHeader :title="$t('nav.users')" :subtitle="$t('users.subtitle')">
      <template #actions>
        <AppButton :icon="PlusIcon" @click="openForm(null)">{{ $t('users.add') }}</AppButton>
      </template>
    </PageHeader>

    <AppTabs v-model="roleTab" :tabs="tabs" />

    <div class="card mt-6 overflow-hidden">
      <div class="border-b border-slate-100 p-4"><SearchInput v-model="table.state.search" /></div>
      <ErrorState v-if="table.error.value" :message="table.error.value" @retry="table.load" />
      <DataTable
        v-else
        :columns="columns"
        :rows="table.rows.value"
        :loading="table.loading.value"
        :sort-by="table.state.sortBy"
        :sort-order="table.state.sortOrder"
        @sort="table.sort"
      >
        <template #cell-firstName="{ row }">
          <div class="flex items-center gap-3">
            <AppAvatar :name="fullName(row)" size="sm" />
            <div class="min-w-0">
              <p class="truncate font-medium text-slate-900">
                {{ fullName(row) }}
                <span v-if="row.id === auth.user?.id" class="ml-1 text-xs font-normal text-slate-400">({{ $t('users.you') }})</span>
              </p>
              <p class="truncate text-xs text-slate-500">{{ row.email }}</p>
            </div>
          </div>
        </template>
        <template #cell-phone="{ row }"><span class="tabular-nums">{{ row.phone || '—' }}</span></template>
        <template #cell-role="{ row }"><AppBadge :color="ROLE_COLORS[row.role as keyof typeof ROLE_COLORS]">{{ $t(`roles.${row.role}`) }}</AppBadge></template>
        <template #cell-status="{ row }">
          <AppBadge :color="row.isActive ? 'green' : 'gray'" dot>{{ row.isActive ? $t('common.active') : $t('common.inactive') }}</AppBadge>
        </template>
        <template #cell-lastLoginAt="{ row }">{{ row.lastLoginAt ? formatDateTime(row.lastLoginAt) : $t('users.never') }}</template>
        <template #cell-actions="{ row }">
          <AppDropdown
            :items="[
              { label: $t('common.edit'), icon: PencilSquareIcon, action: () => openForm(row) },
              { label: $t('common.delete'), icon: TrashIcon, danger: true, hidden: row.id === auth.user?.id, action: () => remove(row) },
            ]"
          />
        </template>
      </DataTable>
      <AppPagination :meta="table.meta.value" @page="table.setPage" />
    </div>

    <UserFormModal :open="formOpen" :user="editing" @close="formOpen = false" @saved="table.load()" />
  </div>
</template>
