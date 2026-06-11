import { forwardRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Scatter } from 'react-chartjs-2';
import type { ChartType, NumberFormat } from '../../../stores/charts';
import type { ProcessedChart } from './chartProcessor';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});
const thouFmt = new Intl.NumberFormat('en-US');

function formatValue(v: number | null | undefined, fmt: NumberFormat): string {
  if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) return '';
  const n = typeof v === 'number' ? v : Number(v);
  if (isNaN(n)) return String(v);
  switch (fmt) {
    case 'thousands':
      return thouFmt.format(n);
    case 'percent':
      return `${(n * 100).toFixed(2)}%`;
    case 'currency':
      return usdFmt.format(n);
    case 'plain':
    default:
      return String(n);
  }
}

interface ChartViewProps {
  chart: ProcessedChart;
  chartType: ChartType;
  title: string;
  axisLabels: { x?: string; y?: string };
  legend: boolean;
  grid: boolean;
  numberFormat: NumberFormat;
}

export const ChartView = forwardRef<any, ChartViewProps>(function ChartView(
  { chart, chartType, title, axisLabels, legend, grid, numberFormat },
  ref
) {
  const data = useMemo(
    () => ({
      labels: chart.labels,
      datasets: chart.datasets,
    }),
    [chart]
  );

  const isCircular = chartType === 'pie' || chartType === 'doughnut';

  const options = useMemo<any>(() => {
    const base: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: title
          ? { display: true, text: title, color: '#e5e7eb' }
          : { display: false },
        legend: { display: legend, labels: { color: '#cbd5e1' } },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const lbl = ctx.dataset?.label ? `${ctx.dataset.label}: ` : '';
              const raw = ctx.parsed?.y ?? ctx.parsed ?? ctx.raw;
              return `${lbl}${formatValue(raw as number, numberFormat)}`;
            },
          },
        },
      },
    };
    if (!isCircular) {
      base.scales = {
        x: {
          title: axisLabels.x
            ? { display: true, text: axisLabels.x, color: '#cbd5e1' }
            : { display: false },
          grid: { display: grid, color: 'rgba(148,163,184,0.12)' },
          ticks: { color: '#94a3b8' },
        },
        y: {
          title: axisLabels.y
            ? { display: true, text: axisLabels.y, color: '#cbd5e1' }
            : { display: false },
          grid: { display: grid, color: 'rgba(148,163,184,0.12)' },
          ticks: {
            color: '#94a3b8',
            callback: (val: any) => formatValue(val as number, numberFormat),
          },
        },
      };
    }
    return base;
  }, [title, legend, grid, axisLabels.x, axisLabels.y, numberFormat, isCircular]);

  // scatter expects {x,y} points
  const scatterData = useMemo(() => {
    if (chartType !== 'scatter') return data;
    return {
      datasets: chart.datasets.map((ds) => ({
        ...ds,
        data: ds.data.map((y, i) => ({ x: chart.labels[i], y })),
      })),
    };
  }, [chartType, chart, data]);

  const chartProps: any = { ref: ref as any, data, options };
  return (
    <div style={{ height: 360 }} className="w-full">
      {chartType === 'bar' && <Bar key="bar" {...chartProps} />}
      {chartType === 'line' && <Line key="line" {...chartProps} />}
      {chartType === 'area' && <Line key="area" {...chartProps} />}
      {chartType === 'pie' && <Pie key="pie" {...chartProps} />}
      {chartType === 'doughnut' && <Doughnut key="doughnut" {...chartProps} />}
      {chartType === 'scatter' && (
        <Scatter key="scatter" ref={ref as any} data={scatterData as any} options={options} />
      )}
    </div>
  );
});
