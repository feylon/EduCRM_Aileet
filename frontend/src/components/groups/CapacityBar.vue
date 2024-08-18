<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ count: number; max: number }>();
const percent = computed(() => Math.min(100, Math.round((props.count / Math.max(props.max, 1)) * 100)));
</script>

<template>
  <div class="w-28">
    <div class="mb-1 flex justify-between text-xs">
      <span class="font-medium text-slate-900">{{ count }}/{{ max }}</span>
      <span class="text-slate-400">{{ percent }}%</span>
    </div>
    <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div
        :class="['h-full rounded-full', percent >= 100 ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-500' : 'bg-emerald-500']"
        :style="{ width: `${percent}%` }"
      />
    </div>
  </div>
</template>
