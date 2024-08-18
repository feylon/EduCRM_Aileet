<script setup lang="ts">
import { BookOpenIcon, ClockIcon, PencilSquareIcon, PlusIcon, TrashIcon, UserGroupIcon } from '@heroicons/vue/20/solid';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import CourseFormModal from '@/components/courses/CourseFormModal.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppDropdown from '@/components/ui/AppDropdown.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
import { useConfirm } from '@/composables/useConfirm';
import { useTable } from '@/composables/useTable';
import { useToast } from '@/composables/useToast';
import { coursesService } from '@/services/courses.service';
import { useLookupsStore } from '@/stores/lookups';
import type { Course } from '@/types/models';
import { getErrorMessage } from '@/utils/errors';
import { formatMoney } from '@/utils/format';
import { statusColor } from '@/utils/status';

const { t } = useI18n();
const toast = useToast();
const lookups = useLookupsStore();
const { confirmDelete } = useConfirm();

const table = useTable<Course, { level: string | null }>(coursesService.list, {
  sortBy: 'name',
  sortOrder: 'ASC',
  limit: 12,
  filters: { level: null },
});

const formOpen = ref(false);
const editing = ref<Course | null>(null);

const levelOptions = computed(() =>
  ['beginner', 'elementary', 'intermediate', 'advanced'].map((value) => ({ value, label: t(`courses.levels.${value}`) })),
);

function openForm(course: Course | null) {
  editing.value = course;
  formOpen.value = true;
}

async function remove(course: Course) {
  if (!(await confirmDelete(course.name))) return;
  try {
    await coursesService.remove(course.id);
    toast.success(t('courses.deleted'));
    lookups.invalidate('courses');
    table.load();
  } catch (error) {
    toast.error(getErrorMessage(error));
  }
}
</script>

<template>
  <div>
    <PageHeader :title="$t('nav.courses')" :subtitle="$t('courses.subtitle')">
      <template #actions>
        <AppButton :icon="PlusIcon" @click="openForm(null)">{{ $t('courses.add') }}</AppButton>
      </template>
    </PageHeader>

    <div class="mb-5 flex flex-col gap-3 sm:flex-row">
      <SearchInput v-model="table.state.search" />
      <AppSelect v-model="table.filters.level" :options="levelOptions" :placeholder="$t('courses.allLevels')" class="sm:w-48" />
    </div>

    <ErrorState v-if="table.error.value" :message="table.error.value" @retry="table.load" />
    <div v-else-if="table.loading.value && !table.rows.value.length" class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="i in 6" :key="i" class="card space-y-3 p-5">
        <AppSkeleton class="h-5 w-2/3" /><AppSkeleton class="h-4 w-full" /><AppSkeleton class="h-4 w-1/2" />
      </div>
    </div>
    <div v-else-if="!table.rows.value.length" class="card">
      <EmptyState :icon="BookOpenIcon" :title="$t('courses.emptyTitle')" :description="$t('courses.emptyDescription')">
        <AppButton :icon="PlusIcon" size="sm" @click="openForm(null)">{{ $t('courses.add') }}</AppButton>
      </EmptyState>
    </div>
    <div v-else class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="course in table.rows.value"
        :key="course.id"
        :class="['card group relative flex flex-col overflow-hidden transition hover:shadow-md', !course.isActive && 'opacity-70']"
      >
        <div class="h-1.5" :style="{ backgroundColor: course.color }" />
        <div class="flex flex-1 flex-col p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="truncate text-base font-semibold text-slate-900">{{ course.name }}</h3>
              <div class="mt-1.5 flex flex-wrap gap-1.5">
                <AppBadge :color="statusColor('level', course.level)">{{ $t(`courses.levels.${course.level}`) }}</AppBadge>
                <AppBadge v-if="!course.isActive">{{ $t('common.inactive') }}</AppBadge>
              </div>
            </div>
            <AppDropdown
              :items="[
                { label: $t('common.edit'), icon: PencilSquareIcon, action: () => openForm(course) },
                { label: $t('common.delete'), icon: TrashIcon, danger: true, action: () => remove(course) },
              ]"
            />
          </div>
          <p class="mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-slate-500">{{ course.description || '—' }}</p>
          <div class="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
            <div>
              <p class="text-lg font-semibold text-slate-900">{{ formatMoney(course.price) }}</p>
              <p class="text-xs text-slate-500">{{ $t('courses.perMonth') }}</p>
            </div>
            <div class="flex gap-4 text-xs text-slate-500">
              <span class="inline-flex items-center gap-1" :title="$t('courses.duration')">
                <ClockIcon class="h-4 w-4 text-slate-400" />{{ $t('courses.months', { count: course.durationMonths }) }}
              </span>
              <span class="inline-flex items-center gap-1" :title="$t('nav.groups')">
                <UserGroupIcon class="h-4 w-4 text-slate-400" />{{ course.groupsCount ?? 0 }}
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>
    <div v-if="table.meta.value && table.meta.value.totalPages > 1" class="card mt-5">
      <AppPagination :meta="table.meta.value" @page="table.setPage" />
    </div>

    <CourseFormModal :open="formOpen" :course="editing" @close="formOpen = false" @saved="table.load()" />
  </div>
</template>
