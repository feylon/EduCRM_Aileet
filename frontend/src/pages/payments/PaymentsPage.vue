<script setup lang="ts">
import { BanknotesIcon, CreditCardIcon, PlusIcon, ReceiptPercentIcon } from '@heroicons/vue/24/outline';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import PaymentFormModal from '@/components/payments/PaymentFormModal.vue';
import PaymentsTable from '@/components/payments/PaymentsTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppTabs from '@/components/ui/AppTabs.vue';
import DataTable, { type TableColumn } from '@/components/ui/DataTable.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
import StatCard from '@/components/ui/StatCard.vue';
import { usePaymentActions } from '@/composables/usePaymentActions';
import { useTable } from '@/composables/useTable';
import { PAYMENT_METHODS, paymentsService, type PaymentSummary } from '@/services/payments.service';
import { useLookupsStore } from '@/stores/lookups';
import type { Payment, StudentDebt } from '@/types/models';
import { formatMoney, fullName } from '@/utils/format';

const { t } = useI18n();
const lookups = useLookupsStore();
const tab = ref('payments');

type Filters = { method: string | null; status: string | null; groupId: string | null; forMonth: string | null; from: string | null; to: string | null };
const payments = useTable<Payment, Filters>(paymentsService.list, {
  sortBy: 'paidAt',
  filters: { method: null, status: null, groupId: null, forMonth: null, from: null, to: null },
});
const debtors = useTable<StudentDebt>(paymentsService.debtors, { immediate: false });

const summary = ref<PaymentSummary | null>(null);
const summaryLoading = ref(false);
async function loadSummary() {
  summaryLoading.value = true;
  try {
    summary.value = await paymentsService.summary({ ...payments.filters, search: payments.state.search });
  } finally {
    summaryLoading.value = false;
  }
}
watch([() => ({ ...payments.filters }), () => payments.state.search], loadSummary, { deep: true });
onMounted(() => {
  loadSummary();
  lookups.loadGroups().catch(() => undefined);
});
watch(tab, (value) => {
  if (value === 'debtors' && !debtors.meta.value) debtors.load();
});

function refresh() {
  payments.load();
  loadSummary();
  if (debtors.meta.value) debtors.load();
}
const actions = usePaymentActions(refresh);

const formOpen = ref(false);
const editing = ref<Payment | null>(null);
const preset = ref<{ studentId: string | null; groupId: string | null; amount: number | null }>({ studentId: null, groupId: null, amount: null });

function openCreate() {
  editing.value = null;
  preset.value = { studentId: null, groupId: null, amount: null };
  formOpen.value = true;
}
function openEdit(payment: Payment) {
  editing.value = payment;
  formOpen.value = true;
}
function acceptFrom(debtor: StudentDebt) {
  const group = [...debtor.groups].sort((a, b) => b.debt - a.debt)[0];
  editing.value = null;
  preset.value = { studentId: debtor.studentId, groupId: group?.groupId ?? null, amount: group ? Math.min(group.debt, group.monthlyPrice) : null };
  formOpen.value = true;
}

const methodOptions = computed(() => PAYMENT_METHODS.map((value) => ({ value, label: t(`payments.methods.${value}`) })));
const statusOptions = computed(() => ['paid', 'refunded'].map((value) => ({ value, label: t(`payments.statuses.${value}`) })));
const tabs = computed(() => [
  { value: 'payments', label: t('payments.tabs.payments') },
  { value: 'debtors', label: t('payments.tabs.debtors'), count: debtors.meta.value?.total },
]);
const topMethod = computed(() => [...(summary.value?.byMethod || [])].sort((a, b) => b.total - a.total)[0]);

const debtorColumns = computed<TableColumn[]>(() => [
  { key: 'student', label: t('students.columns.student') },
  { key: 'phone', label: t('fields.phone'), hideOnMobile: true },
  { key: 'groups', label: t('payments.debtByGroup'), hideOnMobile: true },
  { key: 'totalDebt', label: t('payments.totalDebt'), align: 'right' },
  { key: 'actions', label: '', align: 'right' },
]);
</script>

<template>
  <div>
    <PageHeader :title="$t('nav.payments')" :subtitle="$t('payments.subtitle')">
      <template #actions>
        <AppButton :icon="PlusIcon" @click="openCreate">{{ $t('payments.add') }}</AppButton>
      </template>
    </PageHeader>

    <div class="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      <StatCard :label="$t('payments.summary.total')" :value="formatMoney(summary?.total)" :icon="BanknotesIcon" color="green" :hint="$t('payments.summary.filtered')" :loading="summaryLoading && !summary" />
      <StatCard :label="$t('payments.summary.count')" :value="summary?.count ?? 0" :icon="ReceiptPercentIcon" :loading="summaryLoading && !summary" />
      <StatCard
        class="col-span-2 lg:col-span-1"
        :label="$t('payments.summary.topMethod')"
        :value="topMethod ? $t(`payments.methods.${topMethod.method}`) : '—'"
        :hint="topMethod ? formatMoney(topMethod.total) : undefined"
        :icon="CreditCardIcon"
        color="blue"
        :loading="summaryLoading && !summary"
      />
    </div>

    <AppTabs v-model="tab" :tabs="tabs" />

    <div v-if="tab === 'payments'" class="card mt-6 overflow-hidden">
      <div class="grid grid-cols-2 gap-3 border-b border-slate-100 p-4 lg:grid-cols-4">
        <SearchInput v-model="payments.state.search" class="col-span-2 !max-w-none" />
        <AppSelect v-model="payments.filters.groupId" :options="lookups.groupOptions()" :placeholder="$t('students.allGroups')" />
        <AppSelect v-model="payments.filters.method" :options="methodOptions" :placeholder="$t('payments.allMethods')" />
        <AppSelect v-model="payments.filters.status" :options="statusOptions" :placeholder="$t('groups.allStatuses')" />
        <AppInput v-model="payments.filters.from" type="date" :aria-label="$t('common.from')" />
        <AppInput v-model="payments.filters.to" type="date" :aria-label="$t('common.to')" />
      </div>
      <ErrorState v-if="payments.error.value" :message="payments.error.value" @retry="payments.load" />
      <PaymentsTable
        v-else
        :rows="payments.rows.value"
        :loading="payments.loading.value"
        :sort-by="payments.state.sortBy"
        :sort-order="payments.state.sortOrder"
        editable
        @sort="payments.sort"
        @edit="openEdit"
        @refund="actions.refund"
        @remove="actions.remove"
      />
      <AppPagination :meta="payments.meta.value" :limit-options="[10, 20, 50]" @page="payments.setPage" @limit="payments.setLimit" />
    </div>

    <div v-if="tab === 'debtors'" class="card mt-6 overflow-hidden">
      <div class="border-b border-slate-100 p-4">
        <SearchInput v-model="debtors.state.search" />
      </div>
      <ErrorState v-if="debtors.error.value" :message="debtors.error.value" @retry="debtors.load" />
      <DataTable
        v-else
        row-key="studentId"
        :columns="debtorColumns"
        :rows="debtors.rows.value"
        :loading="debtors.loading.value"
        :empty-title="$t('payments.noDebtors')"
        :empty-description="$t('payments.noDebtorsHint')"
      >
        <template #cell-student="{ row }">
          <RouterLink :to="`/students/${row.studentId}`" class="font-medium text-slate-900 hover:text-brand-600">{{ fullName(row) }}</RouterLink>
          <p class="text-xs text-slate-500 md:hidden">{{ row.phone }}</p>
        </template>
        <template #cell-phone="{ row }">
          <p class="tabular-nums">{{ row.phone || '—' }}</p>
          <p v-if="row.parentPhone" class="text-xs tabular-nums text-slate-500">{{ $t('payments.parent') }}: {{ row.parentPhone }}</p>
        </template>
        <template #cell-groups="{ row }">
          <div class="space-y-0.5 text-xs">
            <p v-for="group in row.groups.filter((g) => g.debt > 0)" :key="group.groupId">
              <span class="font-medium text-slate-700">{{ group.groupName }}</span>
              <span class="text-slate-500"> · {{ formatMoney(group.debt) }}</span>
            </p>
          </div>
        </template>
        <template #cell-totalDebt="{ row }"><span class="font-semibold tabular-nums text-rose-600">{{ formatMoney(row.totalDebt) }}</span></template>
        <template #cell-actions="{ row }">
          <AppButton size="sm" variant="soft" @click="acceptFrom(row)">{{ $t('payments.accept') }}</AppButton>
        </template>
      </DataTable>
      <AppPagination :meta="debtors.meta.value" @page="debtors.setPage" />
    </div>

    <PaymentFormModal
      :open="formOpen"
      :payment="editing"
      :preset-student-id="preset.studentId"
      :preset-group-id="preset.groupId"
      :preset-amount="preset.amount"
      @close="formOpen = false"
      @saved="refresh"
    />
  </div>
</template>
