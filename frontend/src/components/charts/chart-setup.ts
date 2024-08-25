import {
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip);

Chart.defaults.font.family = 'Inter, ui-sans-serif, system-ui, sans-serif';
Chart.defaults.font.size = 11;
Chart.defaults.color = '#64748b';
// Static charts: no entry animation, so numbers are readable immediately and re-renders don't flicker.
Chart.defaults.animation = false;

export const BRAND = '#4f46e5';
export const BRAND_FILL = 'rgba(79, 70, 229, 0.08)';

/** Shared, recessive axis/grid styling and a crisp tooltip. */
export function baseOptions(format: (value: number) => string): ChartOptions<'bar' | 'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        titleFont: { weight: 600 },
        callbacks: { label: (ctx) => format(Number(ctx.parsed.y)) },
        filter: (item) => item.parsed.y !== null,
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#f1f5f9' },
        ticks: { maxTicksLimit: 5, callback: (value) => format(Number(value)) },
      },
    },
  };
}
