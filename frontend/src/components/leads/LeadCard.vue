<script setup lang="ts">
import { CalendarIcon, PhoneIcon } from '@heroicons/vue/20/solid';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppDropdown, { type DropdownItem } from '@/components/ui/AppDropdown.vue';
import type { Lead } from '@/types/models';
import { formatDateTime, fullName } from '@/utils/format';

defineProps<{ lead: Lead; actions: DropdownItem[] }>();
const emit = defineEmits<{ open: [] }>();

const isOverdue = (lead: Lead) => !!lead.nextContactAt && new Date(lead.nextContactAt) < new Date() && ['new', 'contacted', 'trial'].includes(lead.status);
</script>

<template>
  <article class="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow" @click="emit('open')">
    <div class="flex items-start justify-between gap-2">
      <p class="text-sm font-medium text-slate-900">{{ lead.fullName }}</p>
      <AppDropdown :items="actions" />
    </div>
    <p class="mt-0.5 flex items-center gap-1 text-xs tabular-nums text-slate-500"><PhoneIcon class="h-3.5 w-3.5" />{{ lead.phone }}</p>
    <div class="mt-2 flex flex-wrap gap-1">
      <AppBadge>{{ $t(`leads.sources.${lead.source}`) }}</AppBadge>
      <AppBadge v-if="lead.course" color="indigo">{{ lead.course.name }}</AppBadge>
    </div>
    <div class="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
      <span v-if="lead.nextContactAt" :class="['inline-flex items-center gap-1', isOverdue(lead) ? 'font-semibold text-rose-600' : '']">
        <CalendarIcon class="h-3.5 w-3.5" />{{ formatDateTime(lead.nextContactAt) }}
      </span>
      <span v-if="lead.assignedTo" class="truncate">{{ fullName(lead.assignedTo) }}</span>
    </div>
  </article>
</template>
