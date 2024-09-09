<script setup lang="ts">
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, ClipboardDocumentCheckIcon, UserGroupIcon } from '@heroicons/vue/20/solid';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AppAvatar from '@/components/ui/AppAvatar.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { useDays } from '@/composables/useDays';
import { useToast } from '@/composables/useToast';
import { attendanceService } from '@/services/attendance.service';
import { useLookupsStore } from '@/stores/lookups';
import type { AttendanceSheet, AttendanceStatus } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { todayString } from '@/utils/format';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const lookups = useLookupsStore();
const { dayName } = useDays();

const STATUSES: AttendanceStatus[] = ['present', 'late', 'absent', 'excused'];
const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-600 text-white border-emerald-600',
  late: 'bg-amber-500 text-white border-amber-500',
  absent: 'bg-rose-600 text-white border-rose-600',
  excused: 'bg-sky-600 text-white border-sky-600',
};

const groupId = ref<string | null>((route.query.groupId as string) || null);
const date = ref((route.query.date as string) || todayString());
const sheet = ref<AttendanceSheet | null>(null);
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const marks = reactive<Record<string, { status: AttendanceStatus | null; note: string }>>({});
const lesson = reactive({ topic: '', homework: '' });

onMounted(async () => {
  const groups = await lookups.loadGroups().catch(() => []);
  if (!groupId.value) {
    // Prefer a group that has a lesson today, otherwise the first active one.
    const today = new Date().getDay() || 7;
    const active = groups.filter((group) => group.status === 'active');
    const withLessonToday = active.find((group) => group.schedules?.some((slot) => slot.dayOfWeek === today));
    groupId.value = (withLessonToday || active[0])?.id || null;
  }
});

const groupOptions = computed(() =>
  lookups.groups.filter((group) => ['active', 'planned'].includes(group.status) || group.id === groupId.value).map((g) => ({ value: g.id, label: `${g.name} · ${g.course?.name ?? ''}` })),
);
const selectedGroup = computed(() => lookups.groups.find((group) => group.id === groupId.value));
const weekday = computed(() => {
  const day = new Date(`${date.value}T00:00:00`).getDay();
  return day === 0 ? 7 : day;
});
const isLessonDay = computed(() => !selectedGroup.value?.schedules || selectedGroup.value.schedules.some((slot) => slot.dayOfWeek === weekday.value));
const isFuture = computed(() => date.value > todayString());

async function load() {
  if (!groupId.value || !date.value) return;
  router.replace({ query: { groupId: groupId.value, date: date.value } });
  loading.value = true;
  error.value = null;
  try {
    sheet.value = await attendanceService.sheet(groupId.value, date.value);
    Object.keys(marks).forEach((key) => delete marks[key]);
    for (const record of sheet.value.records) {
      marks[record.studentId] = { status: record.status, note: record.note || '' };
    }
    lesson.topic = sheet.value.lesson?.topic || '';
    lesson.homework = sheet.value.lesson?.homework || '';
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

watch([groupId, date], load, { immediate: true });

function shiftDate(days: number) {
  const current = new Date(`${date.value}T00:00:00`);
  current.setDate(current.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  date.value = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`;
}

function markAll(status: AttendanceStatus) {
  Object.values(marks).forEach((mark) => (mark.status = status));
}

const counts = computed(() => {
  const result: Record<string, number> = { present: 0, late: 0, absent: 0, excused: 0, unmarked: 0 };
  Object.values(marks).forEach((mark) => (result[mark.status || 'unmarked'] += 1));
  return result;
});

async function save() {
  if (!groupId.value || !sheet.value) return;
  const records = Object.entries(marks)
    .filter(([, mark]) => mark.status)
    .map(([studentId, mark]) => ({ studentId, status: mark.status!, note: mark.note || undefined }));
  if (!records.length) {
    toast.warning(t('attendance.nothingToSave'));
    return;
  }
  saving.value = true;
  try {
    sheet.value = await attendanceService.mark({
      groupId: groupId.value,
      date: date.value,
      topic: lesson.topic || undefined,
      homework: lesson.homework || undefined,
      records,
    });
    toast.success(t('attendance.saved'));
  } catch (err) {
    toast.error(getErrorMessage(err));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <PageHeader :title="$t('nav.attendance')" :subtitle="$t('attendance.subtitle')" />

    <div class="card mb-5 p-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <AppSelect v-model="groupId" :options="groupOptions" :label="$t('fields.group')" :placeholder="$t('attendance.selectGroup')" />
        <div>
          <p class="form-label">{{ $t('fields.date') }}</p>
          <div class="flex items-center gap-1">
            <AppButton variant="secondary" size="md" :aria-label="$t('common.back')" @click="shiftDate(-1)"><ChevronLeftIcon class="h-4 w-4" /></AppButton>
            <input v-model="date" type="date" class="form-control w-44" :max="todayString()" />
            <AppButton variant="secondary" size="md" :disabled="date >= todayString()" :aria-label="$t('common.next')" @click="shiftDate(1)"><ChevronRightIcon class="h-4 w-4" /></AppButton>
            <AppButton variant="ghost" size="md" @click="date = todayString()">{{ $t('common.today') }}</AppButton>
          </div>
        </div>
      </div>
      <p v-if="selectedGroup && !isLessonDay" class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        {{ $t('attendance.notLessonDay', { day: dayName(weekday) }) }}
      </p>
    </div>

    <div v-if="!groupId" class="card">
      <EmptyState :icon="UserGroupIcon" :title="$t('attendance.selectGroup')" :description="$t('attendance.selectGroupHint')" />
    </div>
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <div v-else class="card overflow-hidden">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-wrap gap-2 text-xs">
          <span v-for="status in STATUSES" :key="status" class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
            <span :class="['h-2 w-2 rounded-full', STATUS_STYLES[status].split(' ')[0]]" />
            {{ $t(`attendance.statuses.${status}`) }}: {{ counts[status] }}
          </span>
          <span v-if="counts.unmarked" class="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 font-medium text-slate-500 ring-1 ring-slate-200">
            {{ $t('attendance.unmarked') }}: {{ counts.unmarked }}
          </span>
        </div>
        <AppButton variant="soft" size="sm" :icon="CheckIcon" :disabled="!sheet?.records.length" @click="markAll('present')">
          {{ $t('attendance.allPresent') }}
        </AppButton>
      </div>

      <div v-if="loading && !sheet" class="space-y-3 p-5"><AppSkeleton v-for="i in 6" :key="i" class="h-12" /></div>
      <EmptyState v-else-if="!sheet?.records.length" :icon="ClipboardDocumentCheckIcon" :title="$t('attendance.noStudents')" :description="$t('attendance.noStudentsHint')" />
      <ul v-else :class="['divide-y divide-slate-100', loading && 'opacity-60']">
        <li v-for="(record, index) in sheet.records" :key="record.studentId" class="flex flex-col gap-3 px-4 py-3 sm:px-5 lg:flex-row lg:items-center">
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <span class="w-5 text-right text-xs tabular-nums text-slate-400">{{ index + 1 }}</span>
            <AppAvatar :name="`${record.firstName} ${record.lastName}`" size="sm" />
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-slate-900">{{ record.firstName }} {{ record.lastName }}</p>
              <p class="truncate text-xs text-slate-500">{{ record.phone || '—' }}</p>
            </div>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div class="grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1" role="radiogroup" :aria-label="`${record.firstName} ${record.lastName}`">
              <button
                v-for="status in STATUSES"
                :key="status"
                type="button"
                role="radio"
                :aria-checked="marks[record.studentId]?.status === status"
                :class="[
                  'rounded-md border px-2.5 py-1.5 text-xs font-medium transition',
                  marks[record.studentId]?.status === status ? STATUS_STYLES[status] : 'border-transparent text-slate-600 hover:bg-white',
                ]"
                @click="marks[record.studentId].status = status"
              >
                {{ $t(`attendance.statuses.${status}`) }}
              </button>
            </div>
            <input
              v-model="marks[record.studentId].note"
              type="text"
              maxlength="255"
              :placeholder="$t('attendance.notePlaceholder')"
              class="form-control py-1.5 text-xs sm:w-44"
            />
          </div>
        </li>
      </ul>

      <div v-if="sheet?.records.length" class="grid grid-cols-1 gap-4 border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5 md:grid-cols-2">
        <AppInput v-model="lesson.topic" :label="$t('attendance.topic')" :placeholder="$t('attendance.topicPlaceholder')" />
        <AppInput v-model="lesson.homework" :label="$t('attendance.homework')" />
        <div class="flex justify-end md:col-span-2">
          <AppButton :loading="saving" :disabled="isFuture" :icon="CheckIcon" @click="save">{{ $t('attendance.save') }}</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
