<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import { BRAND, BRAND_FILL, baseOptions } from './chart-setup';

const props = withDefaults(
  defineProps<{
    labels: string[];
    values: (number | null)[];
    label: string;
    format?: (value: number) => string;
    height?: number;
    max?: number;
  }>(),
  { format: (value: number) => String(value), height: 220 },
);

const data = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: props.label,
      data: props.values,
      borderColor: BRAND,
      backgroundColor: BRAND_FILL,
      borderWidth: 2,
      fill: true,
      tension: 0.35,
      cubicInterpolationMode: 'monotone' as const,
      spanGaps: false,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBorderWidth: 2,
      pointHoverBorderColor: '#fff',
      pointHoverBackgroundColor: BRAND,
    },
  ],
}));

const options = computed(() => {
  const options = baseOptions(props.format);
  if (props.max !== undefined) (options.scales!.y as { max?: number }).max = props.max;
  return options as never;
});
</script>

<template>
  <div :style="{ height: `${height}px` }" role="img" :aria-label="label">
    <Line :data="data" :options="options" />
  </div>
</template>
