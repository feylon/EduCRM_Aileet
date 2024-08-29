<script setup lang="ts">
import { ArrowLeftIcon, BanknotesIcon, EnvelopeIcon, PencilSquareIcon, PhoneIcon } from '@heroicons/vue/20/solid';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import AttendanceHistory from '@/components/attendance/AttendanceHistory.vue';
import PaymentFormModal from '@/components/payments/PaymentFormModal.vue';
import PaymentsTable from '@/components/payments/PaymentsTable.vue';
import StudentFormModal from '@/components/students/StudentFormModal.vue';
import AppAvatar from '@/components/ui/AppAvatar.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import AppTabs from '@/components/ui/AppTabs.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import { useAsync } from '@/composables/useAsync';
import { usePaymentActions } from '@/composables/usePaymentActions';
import { useTable } from '@/composables/useTable';
import { paymentsService } from '@/services/payments.service';
import type { Payment } from '@/types/models';
import { studentsService } from '@/services/students.service';
import { useAuthStore } from '@/stores/auth';
import { formatDate, formatMoney, fullName } from '@/utils/format';
import { statusColor } from '@/utils/status';

const route = useRoute();
const auth = useAuthStore();
const { t } = useI18n();
const id = computed(() => route.params.id as string);

const student = useAsync(() => studentsService.get(id.value));
const tab = ref('overview');
const editOpen = ref(false);
const paymentOpen = ref(false);
const editingPayment = ref<Payment | null>(null);

const payments = useTable<Payment, { studentId: string }>(paymentsService.list, {
  sortBy: 'paidAt',
  filters: { studentId: id.value },
  immediate: false,
});
const balance = useAsync(() => (auth.isStaff ? paymentsService.balance(id.value) : Promise.resolve(null)));
watch(tab, (value) => {
  if (value === 'payments' && !payments.meta.value) payments.load();
});

function refreshPayments() {
  payments.load();
  balance.run();
}
const paymentActions = usePaymentActions(refreshPayments);

function openPayment(payment: Payment | null) {
  editingPayment.value = payment;
  paymentOpen.value = true;
}

const tabs = computed(() => [
  { value: 'overview', label: t('students.tabs.overview') },
  { value: 'attendance', label: t('students.tabs.attendance') },
  ...(auth.isStaff ? [{ value: 'payments', label: t('students.tabs.payments') }] : []),
]);

const info = computed(() => {
  const s = student.data.value;
  if (!s) return [];
  return [
    { label: t('fields.birthDate'), value: formatDate(s.birthDate) },
    { label: t('fields.gender'), value: s.gender ? t(`students.genders.${s.gender}`) : '—' },
    { label: t('fields.parentName'), value: s.parentName || '—' },
    { label: t('fields.parentPhone'), value: s.parentPhone || '—' },
    { label: t('fields.address'), value: s.address || '—' },
    { label: t('fields.enrolledAt'), value: formatDate(s.enrolledAt) },
  ];
});
</script>

<template>
  <div>
    <RouterLink :to="{ name: 'students' }" class="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
      <ArrowLeftIcon class="h-4 w-4" /> {{ $t('nav.students') }}
    </RouterLink>

    <ErrorState v-if="student.error.value" :message="student.error.value" @retry="student.run" />

    <template v-else>
      <div class="card p-5 sm:p-6">
        <div v-if="student.loading.value && !student.data.value" class="flex items-center gap-4">
          <AppSkeleton class="h-14 w-14 rounded-full" />
          <div class="space-y-2"><AppSkeleton class="h-5 w-48" /><AppSkeleton class="h-4 w-64" /></div>
        </div>
        <div v-else-if="student.data.value" class="flex flex-col gap-5 sm:flex-row sm:items-center">
          <AppAvatar :name="fullName(student.data.value.user)" size="lg" />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-xl font-semibold text-slate-900">{{ fullName(student.data.value.user) }}</h1>
              <AppBadge :color="statusColor('student', student.data.value.status)" dot>
                {{ $t(`students.statuses.${student.data.value.status}`) }}
              </AppBadge>
            </div>
            <div class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
              <span class="inline-flex items-center gap-1.5"><EnvelopeIcon class="h-4 w-4 text-slate-400" />{{ student.data.value.user.email }}</span>
              <span v-if="student.data.value.user.phone" class="inline-flex items-center gap-1.5">
                <PhoneIcon class="h-4 w-4 text-slate-400" />{{ student.data.value.user.phone }}
              </span>
            </div>
          </div>
          <div v-if="auth.isStaff" class="flex gap-2">
            <AppButton variant="soft" :icon="BanknotesIcon" @click="openPayment(null)">{{ $t('payments.accept') }}</AppButton>
            <AppButton variant="secondary" :icon="PencilSquareIcon" @click="editOpen = true">{{ $t('common.edit') }}</AppButton>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <AppTabs v-model="tab" :tabs="tabs" />
      </div>

      <div v-if="tab === 'overview' && student.data.value" class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section class="card p-5 lg:col-span-2">
          <h3 class="mb-4 text-sm font-semibold text-slate-900">{{ $t('students.sections.info') }}</h3>
          <dl class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div v-for="item in info" :key="item.label">
              <dt class="text-xs font-medium text-slate-500">{{ item.label }}</dt>
              <dd class="mt-1 text-sm text-slate-900">{{ item.value }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs font-medium text-slate-500">{{ $t('fields.notes') }}</dt>
              <dd class="mt-1 whitespace-pre-line text-sm text-slate-900">{{ student.data.value.notes || '—' }}</dd>
            </div>
          </dl>
        </section>
        <section class="card">
          <h3 class="border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-900">{{ $t('students.columns.groups') }}</h3>
          <EmptyState v-if="!student.data.value.groupLinks?.length" compact :title="$t('students.noGroups')" :description="$t('students.noGroupsHint')" />
          <ul v-else class="divide-y divide-slate-100">
            <li v-for="link in student.data.value.groupLinks" :key="link.id" class="flex items-center gap-3 px-5 py-3">
              <span class="h-8 w-1 rounded-full" :style="{ backgroundColor: link.group?.course?.color }" />
              <div class="min-w-0 flex-1">
                <RouterLink :to="`/groups/${link.groupId}`" class="block truncate text-sm font-medium text-slate-900 hover:text-brand-600">
                  {{ link.group?.name }}
                </RouterLink>
                <p class="truncate text-xs text-slate-500">{{ link.group?.course?.name }} · {{ $t('students.joined', { date: formatDate(link.joinedAt) }) }}</p>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <div v-if="tab === 'payments'" class="mt-6 space-y-6">
        <div v-if="balance.data.value?.groups.length" class="card overflow-hidden">
          <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 class="text-sm font-semibold text-slate-900">{{ $t('payments.balanceByGroup') }}</h3>
            <span :class="['text-sm font-semibold', balance.data.value.totalDebt ? 'text-rose-600' : 'text-emerald-600']">
              {{ balance.data.value.totalDebt ? `${$t('payments.totalDebt')}: ${formatMoney(balance.data.value.totalDebt)}` : $t('payments.noDebt') }}
            </span>
          </div>
          <ul class="divide-y divide-slate-100">
            <li v-for="group in balance.data.value.groups" :key="group.groupId" class="grid grid-cols-2 gap-2 px-5 py-3 text-sm sm:grid-cols-4">
              <span class="font-medium text-slate-900">{{ group.groupName }} <span class="block text-xs font-normal text-slate-500">{{ $t('payments.months', { count: group.months }) }} × {{ formatMoney(group.monthlyPrice) }}</span></span>
              <span class="text-slate-600">{{ $t('payments.charged') }}: <b class="text-slate-900">{{ formatMoney(group.charged) }}</b></span>
              <span class="text-slate-600">{{ $t('payments.paid') }}: <b class="text-slate-900">{{ formatMoney(group.paid) }}</b></span>
              <span :class="group.debt ? 'font-semibold text-rose-600' : 'text-emerald-600'">{{ group.debt ? formatMoney(group.debt) : $t('payments.noDebt') }}</span>
            </li>
          </ul>
        </div>
        <div class="card overflow-hidden">
          <PaymentsTable
            :rows="payments.rows.value"
            :loading="payments.loading.value"
            :show-student="false"
            :sort-by="payments.state.sortBy"
            :sort-order="payments.state.sortOrder"
            editable
            @sort="payments.sort"
            @edit="openPayment"
            @refund="paymentActions.refund"
            @remove="paymentActions.remove"
          />
          <AppPagination :meta="payments.meta.value" @page="payments.setPage" />
        </div>
      </div>

      <div v-if="tab === 'attendance'" class="card mt-6 overflow-hidden">
        <AttendanceHistory :student-id="id" />
      </div>
    </template>

    <PaymentFormModal
      v-if="auth.isStaff"
      :open="paymentOpen"
      :payment="editingPayment"
      :preset-student-id="id"
      @close="paymentOpen = false"
      @saved="refreshPayments"
    />
    <StudentFormModal :open="editOpen" :student="student.data.value" @close="editOpen = false" @saved="student.run()" />
  </div>
</template>
