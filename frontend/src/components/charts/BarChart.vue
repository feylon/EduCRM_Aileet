<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { BRAND, baseOptions } from './chart-setup';

const props = withDefaults(
  defineProps<{ labels: string[]; values: number[]; label: string; format?: (value: number) => string; height?: number }>(),
  { format: (value: number) => String(value), height: 260 },
);

const data = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: props.label,
      data: props.values,
      backgroundColor: BRAND,
      hoverBackgroundColor: '#4338ca',
      borderRadius: 4,
      borderSkipped: 'bottom' as const,
      maxBarThickness: 28,
    },
  ],
}));

const options = computed(() => baseOptions(props.format) as never);
</script>

<template>
  <div :style="{ height: `${height}px` }" role="img" :aria-label="label">
    <Bar :data="data" :options="options" />
  </div>
</template>
