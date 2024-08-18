<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import { useDays } from '@/composables/useDays';
import { useForm, useRules } from '@/composables/useForm';
import { useToast } from '@/composables/useToast';
import { schedulesService } from '@/services/schedules.service';
import { useLookupsStore } from '@/stores/lookups';
import type { Schedule } from '@/types/models';

/** Create/edit a weekly lesson slot. `groupId` fixes the group (from the group page). */
const props = defineProps<{ open: boolean; slot?: Schedule | null; groupId?: string; defaultRoom?: string | null }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const { t } = useI18n();
const toast = useToast();
const rules = useRules();
const lookups = useLookupsStore();
const { dayOptions } = useDays();
const isEdit = computed(() => !!props.slot);

const { values, errors, submitting, submit, reset } = useForm(
  { groupId: null as string | null, dayOfWeek: 1 as number | null, startTime: '09:00', endTime: '10:30', room: '' },
  {
    groupId: [rules.required()],
    dayOfWeek: [rules.required()],
    startTime: [rules.required()],
    endTime: [rules.required(), rules.after('startTime', 'validation.timeRange')],
  },
);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    if (!props.groupId) lookups.loadGroups().catch(() => undefined);
    const s = props.slot;
    reset(
      s
        ? { groupId: s.groupId, dayOfWeek: s.dayOfWeek, startTime: s.startTime.slice(0, 5), endTime: s.endTime.slice(0, 5), room: s.room || '' }
        : { groupId: props.groupId ?? null, room: props.defaultRoom || '' },
    );
  },
);

async function onSubmit() {
  await submit(async () => {
    const data = {
      dayOfWeek: Number(values.dayOfWeek),
      startTime: values.startTime,
      endTime: values.endTime,
      room: values.room || undefined,
    };
    if (isEdit.value) await schedulesService.update(props.slot!.id, data);
    else await schedulesService.create({ ...data, groupId: values.groupId! });
    toast.success(t('schedule.saved'));
    emit('saved');
    emit('close');
  });
}
</script>

<template>
  <AppModal :open="open" size="sm" :title="isEdit ? $t('schedule.editSlot') : $t('schedule.addSlot')" @close="emit('close')">
    <form id="slot-form" class="grid grid-cols-2 gap-4" novalidate @submit.prevent="onSubmit">
      <AppSelect
        v-if="!groupId && !isEdit"
        v-model="values.groupId"
        class="col-span-2"
        :options="lookups.groupOptions()"
        :label="$t('fields.group')"
        placeholder="—"
        required
        :error="errors.groupId"
      />
      <AppSelect v-model="values.dayOfWeek" class="col-span-2" :options="dayOptions()" :label="$t('schedule.day')" required />
      <AppInput v-model="values.startTime" type="time" :label="$t('schedule.start')" required :error="errors.startTime" />
      <AppInput v-model="values.endTime" type="time" :label="$t('schedule.end')" required :error="errors.endTime" />
      <AppInput v-model="values.room" class="col-span-2" :label="$t('fields.room')" />
    </form>
    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">{{ $t('common.cancel') }}</AppButton>
      <AppButton type="submit" form="slot-form" :loading="submitting">{{ $t('common.save') }}</AppButton>
    </template>
  </AppModal>
</template>
