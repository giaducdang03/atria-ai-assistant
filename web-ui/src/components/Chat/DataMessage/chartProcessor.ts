// Pure-function adapter: rows + edit state → Chart.js dataset shape.

import type { ChartEditState } from '../../../stores/charts';
import type { DataColumn } from '../../../types';

export interface ProcessedChart {
  labels: any[];
  datasets: Array<{
    label: string;
    data: any[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }>;
}

export type ProcessorResult =
  | { ok: true; chart: ProcessedChart }
  | { ok: false; error: string };

export function processChart(
  rows: Record<string, any>[],
  _columns: DataColumn[],
  state: ChartEditState
): ProcessorResult {
  try {
    if (!state.xField) return { ok: false, error: 'No x-axis field selected' };
    if (!state.yFields || state.yFields.length === 0) {
      return { ok: false, error: 'No y-axis fields selected' };
    }

    const safeRows = rows ?? [];
    if (safeRows.length === 0) {
      return { ok: false, error: 'No data to display' };
    }

    const labels = safeRows.map((r) => r[state.xField]);
    const datasets = state.yFields.map((y) => {
      const color = state.seriesColors[y];
      return {
        label: state.seriesLabels[y] ?? y,
        data: safeRows.map((r) => r[y]),
        backgroundColor: color,
        borderColor: color,
        fill: state.chartType === 'area',
      };
    });

    return { ok: true, chart: { labels, datasets } };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}
