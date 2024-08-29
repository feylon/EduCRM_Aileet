<script setup lang="ts">
import { BanknotesIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline';
import { computed, ref } from 'vue';
import PaymentsTable from '@/components/payments/PaymentsTable.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import StatCard from '@/components/ui/StatCard.vue';
import { useTable } from '@/composables/useTable';
import { paymentsService } from '@/services/payments.service';
import type { Payment, StudentDebt } from '@/types/models';
import { formatMoney } from '@/utils/format';

const balance = ref<StudentDebt | null>(null);
const table = useTable<Payment>(
  async (params) => {
    const result = await paymentsService.mine(params);
    balance.value = result.balance;
    return result;
  },
  { sortBy: 'paidAt' },
);

const totalPaid = computed(() => balance.value?.groups.reduce((sum, group) => sum + group.paid, 0) ?? 0);
</script>

<template>
  <div>
    <PageHeader :title="$t('nav.myPayments')" :subtitle="$t('payments.mySubtitle')" />
    <div class="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      <StatCard :label="$t('dashboard.student.debt')" :value="formatMoney(balance?.totalDebt)" :icon="ExclamationTriangleIcon" :color="balance?.totalDebt ? 'red' : 'teal'" :loading="table.loading.value && !table.meta.value" />
      <StatCard :label="$t('payments.totalPaid')" :value="formatMoney(totalPaid)" :icon="CheckCircleIcon" color="green" :loading="table.loading.value && !table.meta.value" />
      <StatCard class="col-span-2 lg:col-span-1" :label="$t('payments.monthlyFee')" :value="formatMoney(balance?.groups.reduce((sum, g) => sum + g.monthlyPrice, 0))" :icon="BanknotesIcon" :loading="table.loading.value && !table.meta.value" />
    </div>

    <div v-if="balance?.groups.length" class="card mb-6 overflow-hidden">
      <h3 class="border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-900">{{ $t('payments.balanceByGroup') }}</h3>
      <ul class="divide-y divide-slate-100">
        <li v-for="group in balance.groups" :key="group.groupId" class="grid grid-cols-2 gap-2 px-5 py-3 text-sm sm:grid-cols-4">
          <span class="font-medium text-slate-900">{{ group.groupName }} <span class="block text-xs font-normal text-slate-500">{{ group.courseName }}</span></span>
          <span class="text-slate-600">{{ $t('payments.charged') }}: <b class="text-slate-900">{{ formatMoney(group.charged) }}</b></span>
          <span class="text-slate-600">{{ $t('payments.paid') }}: <b class="text-slate-900">{{ formatMoney(group.paid) }}</b></span>
          <span :class="group.debt ? 'font-semibold text-rose-600' : 'text-emerald-600'">{{ group.debt ? formatMoney(group.debt) : $t('payments.noDebt') }}</span>
        </li>
      </ul>
    </div>

    <div class="card overflow-hidden">
      <ErrorState v-if="table.error.value" :message="table.error.value" @retry="table.load" />
      <PaymentsTable
        v-else
        :rows="table.rows.value"
        :loading="table.loading.value"
        :show-student="false"
        :sort-by="table.state.sortBy"
        :sort-order="table.state.sortOrder"
        @sort="table.sort"
      />
      <AppPagination :meta="table.meta.value" @page="table.setPage" />
    </div>
  </div>
</template>
