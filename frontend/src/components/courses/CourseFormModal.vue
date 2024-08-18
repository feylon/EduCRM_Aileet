<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppToggle from '@/components/ui/AppToggle.vue';
import { useForm, useRules } from '@/composables/useForm';
import { useToast } from '@/composables/useToast';
import { coursesService, type CoursePayload } from '@/services/courses.service';
import { useLookupsStore } from '@/stores/lookups';
import type { Course } from '@/types/models';

const props = defineProps<{ open: boolean; course?: Course | null }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const { t } = useI18n();
const toast = useToast();
const rules = useRules();
const lookups = useLookupsStore();
const isEdit = computed(() => !!props.course);

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#64748b'];

const { values, errors, submitting, submit, reset } = useForm(
  {
    name: '',
    description: '',
    price: null as number | null,
    durationMonths: 6 as number | null,
    lessonsPerWeek: 3 as number | null,
    level: 'beginner',
    color: COLORS[0],
    isActive: true,
  },
  {
    name: [rules.required(), rules.minLength(2), rules.maxLength(150)],
    price: [rules.required(), rules.min(0)],
    durationMonths: [rules.required(), rules.min(1), rules.max(60)],
    lessonsPerWeek: [rules.required(), rules.min(1), rules.max(7)],
  },
);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    const c = props.course;
    reset(
      c
        ? {
            name: c.name,
            description: c.description || '',
            price: c.price,
            durationMonths: c.durationMonths,
            lessonsPerWeek: c.lessonsPerWeek,
            level: c.level,
            color: c.color,
            isActive: c.isActive,
          }
        : {},
    );
  },
);

const levelOptions = computed(() =>
  ['beginner', 'elementary', 'intermediate', 'advanced'].map((value) => ({ value, label: t(`courses.levels.${value}`) })),
);

async function onSubmit() {
  await submit(async () => {
    const data = { ...values, description: values.description || undefined } as CoursePayload;
    if (isEdit.value) await coursesService.update(props.course!.id, data);
    else await coursesService.create(data);
    toast.success(isEdit.value ? t('courses.updated') : t('courses.created'));
    lookups.invalidate('courses');
    emit('saved');
    emit('close');
  });
}
</script>

<template>
  <AppModal :open="open" :title="isEdit ? $t('courses.editTitle') : $t('courses.createTitle')" @close="emit('close')">
    <form id="course-form" class="space-y-4" novalidate @submit.prevent="onSubmit">
      <AppInput v-model="values.name" :label="$t('courses.name')" required :error="errors.name" />
      <AppTextarea v-model="values.description" :label="$t('courses.description')" :rows="2" />
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppInput v-model="values.price" type="number" min="0" step="10000" :label="$t('courses.price')" required :error="errors.price" />
        <AppSelect v-model="values.level" :options="levelOptions" :label="$t('courses.level')" />
        <AppInput v-model="values.durationMonths" type="number" min="1" :label="$t('courses.duration')" required :error="errors.durationMonths" />
        <AppInput v-model="values.lessonsPerWeek" type="number" min="1" max="7" :label="$t('courses.lessonsPerWeek')" required :error="errors.lessonsPerWeek" />
      </div>
      <div>
        <p class="form-label">{{ $t('courses.color') }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="color in COLORS"
            :key="color"
            type="button"
            :aria-label="color"
            :class="['h-8 w-8 rounded-full ring-offset-2 transition', values.color === color ? 'ring-2 ring-slate-900' : 'hover:scale-110']"
            :style="{ backgroundColor: color }"
            @click="values.color = color"
          />
        </div>
      </div>
      <div class="rounded-lg border border-slate-200 p-4">
        <AppToggle v-model="values.isActive" :label="$t('courses.activeLabel')" :description="$t('courses.activeHint')" />
      </div>
    </form>
    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton type="submit" form="course-form" :loading="submitting">{{ isEdit ? $t('common.save') : $t('common.create') }}</AppButton>
    </template>
  </AppModal>
</template>
