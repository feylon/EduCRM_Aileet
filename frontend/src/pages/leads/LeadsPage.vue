<script setup lang="ts">
import { ArrowRightCircleIcon, FunnelIcon, PencilSquareIcon, PlusIcon, Squares2X2Icon, TableCellsIcon, TrashIcon, UserPlusIcon } from '@heroicons/vue/20/solid';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ConvertLeadModal from '@/components/leads/ConvertLeadModal.vue';
import LeadCard from '@/components/leads/LeadCard.vue';
import LeadFormModal from '@/components/leads/LeadFormModal.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppDropdown, { type DropdownItem } from '@/components/ui/AppDropdown.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import DataTable, { type TableColumn } from '@/components/ui/DataTable.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useTable } from '@/composables/useTable';
import { useToast } from '@/composables/useToast';
import { LEAD_SOURCES, LEAD_STATUSES, leadsService, type LeadStats } from '@/services/leads.service';
import { useLookupsStore } from '@/stores/lookups';
import type { Lead, LeadStatus } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatDateTime, fullName } from '@/utils/format';
import { statusColor } from '@/utils/status';

const { t } = useI18n();
const toast = useToast();
const lookups = useLookupsStore();
const { confirmDelete } = useConfirm();

const VIEW_KEY = 'educrm.leads.view';
const view = ref<'table' | 'board'>((localStorage.getItem(VIEW_KEY) as 'table' | 'board') || 'table');
watch(view, (value) => localStorage.setItem(VIEW_KEY, value));

type Filters = { status: string | null; source: string | null; courseId: string | null; assignedToId: string | null };
const table = useTable<Lead, Filters>(
  (params) => leadsService.list(view.value === 'board' ? { ...params, page: 1, limit: 100, status: undefined } : params),
  { sortBy: 'createdAt', filters: { status: null, source: null, courseId: null, assignedToId: null } },
);
watch(view, () => table.load());

const stats = ref<LeadStats | null>(null);
async function loadStats() {
  stats.value = await leadsService.stats().catch(() => stats.value);
}
onMounted(() => {
  loadStats();
  Promise.all([lookups.loadCourses(), lookups.loadAdmins()]).catch(() => undefined);
});
function refresh() {
  table.load();
  loadStats();
}

const formOpen = ref(false);
const convertOpen = ref(false);
const selected = ref<Lead | null>(null);

function openForm(lead: Lead | null) {
  selected.value = lead;
  formOpen.value = true;
}
function openConvert(lead: Lead) {
  selected.value = lead;
  convertOpen.value = true;
}
async function moveTo(lead: Lead, status: LeadStatus) {
  try {
    await leadsService.update(lead.id, { status });
    toast.success(t('leads.movedTo', { status: t(`leads.statuses.${status}`) }));
    refresh();
  } catch (error) {
    toast.error(getErrorMessage(error));
  }
}
async function remove(lead: Lead) {
  if (!(await confirmDelete(lead.fullName))) return;
  try {
    await leadsService.remove(lead.id);
    toast.success(t('leads.deleted'));
    refresh();
  } catch (error) {
    toast.error(getErrorMessage(error));
  }
}

function actionsFor(lead: Lead): DropdownItem[] {
  const open = lead.status !== 'converted';
  return [
    { label: t('common.edit'), icon: PencilSquareIcon, action: () => openForm(lead) },
    { label: t('leads.convert'), icon: UserPlusIcon, hidden: !open, action: () => openConvert(lead) },
    ...LEAD_STATUSES.filter((status) => open && status !== 'converted' && status !== lead.status).map((status) => ({
      label: t('leads.moveTo', { status: t(`leads.statuses.${status}`) }),
      icon: ArrowRightCircleIcon,
      action: () => moveTo(lead, status),
    })),
    { label: t('common.delete'), icon: TrashIcon, danger: true, action: () => remove(lead) },
  ];
}

const board = computed(() =>
  LEAD_STATUSES.map((status) => ({ status, leads: table.rows.value.filter((lead) => lead.status === status) })),
);

const columns = computed<TableColumn[]>(() => [
  { key: 'fullName', label: t('leads.columns.lead'), sortable: true },
  { key: 'course', label: t('leads.interestedIn'), hideOnMobile: true },
  { key: 'source', label: t('leads.source'), hideOnMobile: true },
  { key: 'status', label: t('common.status'), sortable: true },
  { key: 'assignedTo', label: t('leads.assignedTo'), hideOnMobile: true },
  { key: 'nextContactAt', label: t('leads.nextContact'), sortable: true, hideOnMobile: true },
  { key: 'actions', label: '', align: 'right', class: 'w-12' },
]);

const statusOptions = computed(() => LEAD_STATUSES.map((value) => ({ value, label: t(`leads.statuses.${value}`) })));
const sourceOptions = computed(() => LEAD_SOURCES.map((value) => ({ value, label: t(`leads.sources.${value}`) })));
const STAGE_ACCENT: Record<LeadStatus, string> = {
  new: 'bg-sky-500',
  contacted: 'bg-brand-500',
  trial: 'bg-amber-500',
  converted: 'bg-emerald-500',
  lost: 'bg-slate-400',
};

function toggleStatusFilter(status: LeadStatus) {
  if (view.value === 'board') return;
  table.filters.status = table.filters.status === status ? null : status;
}
</script>

<template>
  <div>
    <PageHeader :title="$t('nav.leads')" :subtitle="$t('leads.subtitle')">
      <template #actions>
        <div class="flex rounded-lg border border-slate-200 bg-white p-0.5">
          <button
            v-for="option in [{ value: 'table', icon: TableCellsIcon }, { value: 'board', icon: Squares2X2Icon }] as const"
            :key="option.value"
            :class="['rounded-md p-1.5 transition', view === option.value ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600']"
            :aria-label="$t(`leads.views.${option.value}`)"
            :title="$t(`leads.views.${option.value}`)"
            @click="view = option.value"
          >
            <component :is="option.icon" class="h-4 w-4" />
          </button>
        </div>
        <AppButton :icon="PlusIcon" @click="openForm(null)">{{ $t('leads.add') }}</AppButton>
      </template>
    </PageHeader>

    <!-- Pipeline -->
    <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <button
        v-for="status in LEAD_STATUSES"
        :key="status"
        type="button"
        :class="[
          'card relative overflow-hidden px-4 py-3 text-left transition hover:shadow-md',
          table.filters.status === status && view === 'table' ? 'ring-2 ring-brand-500' : '',
        ]"
        @click="toggleStatusFilter(status)"
      >
        <span :class="['absolute inset-x-0 top-0 h-1', STAGE_ACCENT[status]]" />
        <p class="text-xs font-medium text-slate-500">{{ $t(`leads.statuses.${status}`) }}</p>
        <AppSkeleton v-if="!stats" class="mt-2 h-6 w-10" />
        <p v-else class="mt-1 text-xl font-semibold text-slate-900">{{ stats.byStatus[status] }}</p>
      </button>
      <div class="card col-span-2 px-4 py-3 sm:col-span-1">
        <p class="text-xs font-medium text-slate-500">{{ $t('dashboard.charts.conversion') }}</p>
        <p class="mt-1 text-xl font-semibold text-emerald-600">{{ stats?.conversionRate ?? 0 }}%</p>
      </div>
    </div>

    <div class="card mb-5 grid grid-cols-2 gap-3 p-4 lg:grid-cols-5">
      <SearchInput v-model="table.state.search" class="col-span-2 !max-w-none lg:col-span-2" />
      <AppSelect v-if="view === 'table'" v-model="table.filters.status" :options="statusOptions" :placeholder="$t('groups.allStatuses')" />
      <AppSelect v-model="table.filters.source" :options="sourceOptions" :placeholder="$t('leads.allSources')" />
      <AppSelect v-model="table.filters.assignedToId" :options="lookups.adminOptions()" :placeholder="$t('leads.allAssignees')" />
    </div>

    <ErrorState v-if="table.error.value" :message="table.error.value" @retry="table.load" />

    <!-- Board -->
    <div v-else-if="view === 'board'" class="scrollbar-thin -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div class="grid min-w-[960px] grid-cols-5 gap-3">
        <section v-for="column in board" :key="column.status" class="rounded-xl bg-slate-100/70 p-2.5">
          <header class="mb-2.5 flex items-center justify-between px-1">
            <span class="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <span :class="['h-2 w-2 rounded-full', STAGE_ACCENT[column.status]]" />{{ $t(`leads.statuses.${column.status}`) }}
            </span>
            <span class="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600">{{ column.leads.length }}</span>
          </header>
          <div class="space-y-2">
            <template v-if="table.loading.value && !table.rows.value.length"><AppSkeleton v-for="i in 3" :key="i" class="h-24" /></template>
            <p v-else-if="!column.leads.length" class="py-6 text-center text-xs text-slate-400">{{ $t('leads.emptyColumn') }}</p>
            <LeadCard v-for="lead in column.leads" :key="lead.id" :lead="lead" :actions="actionsFor(lead)" @open="openForm(lead)" />
          </div>
        </section>
      </div>
    </div>

    <!-- Table -->
    <div v-else class="card overflow-hidden">
      <DataTable
        :columns="columns"
        :rows="table.rows.value"
        :loading="table.loading.value"
        :sort-by="table.state.sortBy"
        :sort-order="table.state.sortOrder"
        clickable
        @sort="table.sort"
        @row-click="openForm"
      >
        <template #cell-fullName="{ row }">
          <p class="font-medium text-slate-900">{{ row.fullName }}</p>
          <p class="text-xs tabular-nums text-slate-500">{{ row.phone }}</p>
        </template>
        <template #cell-course="{ row }">{{ row.course?.name || '—' }}</template>
        <template #cell-source="{ row }"><AppBadge>{{ $t(`leads.sources.${row.source}`) }}</AppBadge></template>
        <template #cell-status="{ row }">
          <AppBadge :color="statusColor('lead', row.status)" dot>{{ $t(`leads.statuses.${row.status}`) }}</AppBadge>
        </template>
        <template #cell-assignedTo="{ row }">{{ row.assignedTo ? fullName(row.assignedTo) : '—' }}</template>
        <template #cell-nextContactAt="{ row }">{{ row.nextContactAt ? formatDateTime(row.nextContactAt) : '—' }}</template>
        <template #cell-actions="{ row }"><AppDropdown :items="actionsFor(row)" /></template>
        <template #empty>
          <EmptyState :icon="FunnelIcon" :title="$t('leads.emptyTitle')" :description="$t('leads.emptyDescription')">
            <AppButton :icon="PlusIcon" size="sm" @click="openForm(null)">{{ $t('leads.add') }}</AppButton>
          </EmptyState>
        </template>
      </DataTable>
      <AppPagination :meta="table.meta.value" :limit-options="[10, 20, 50]" @page="table.setPage" @limit="table.setLimit" />
    </div>

    <LeadFormModal :open="formOpen" :lead="selected" @close="formOpen = false" @saved="refresh" />
    <ConvertLeadModal :open="convertOpen" :lead="selected" @close="convertOpen = false" @converted="refresh" />
  </div>
</template>
