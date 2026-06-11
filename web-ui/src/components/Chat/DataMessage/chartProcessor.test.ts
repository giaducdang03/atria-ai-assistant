import { describe, it, expect } from 'vitest';
import { processChart } from './chartProcessor';
import type { ChartEditState } from '../../../stores/charts';
import type { DataColumn } from '../../../types';

const columns: DataColumn[] = [
  { name: 'region', type: 'string' },
  { name: 'sales', type: 'number' },
  { name: 'units', type: 'number' },
];

const rows = [
  { region: 'N', sales: 100, units: 10 },
  { region: 'S', sales: 200, units: 20 },
];

function baseState(overrides: Partial<ChartEditState> = {}): ChartEditState {
  return {
    activeSuggestionIdx: 0,
    chartType: 'bar',
    xField: 'region',
    yFields: ['sales'],
    title: '',
    axisLabels: {},
    seriesLabels: { sales: 'sales' },
    seriesColors: { sales: '#3b82f6' },
    legend: true,
    grid: true,
    numberFormat: 'plain',
    ...overrides,
  };
}

describe('processChart', () => {
  it('produces basic bar chart shape', () => {
    const r = processChart(rows, columns, baseState());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.chart.labels).toEqual(['N', 'S']);
    expect(r.chart.datasets).toHaveLength(1);
    expect(r.chart.datasets[0].label).toBe('sales');
    expect(r.chart.datasets[0].data).toEqual([100, 200]);
    expect(r.chart.datasets[0].backgroundColor).toBe('#3b82f6');
    expect(r.chart.datasets[0].fill).toBe(false);
  });

  it('uses seriesLabels for dataset label', () => {
    const r = processChart(
      rows,
      columns,
      baseState({ seriesLabels: { sales: 'Revenue (USD)' } })
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.chart.datasets[0].label).toBe('Revenue (USD)');
  });

  it('sets fill=true for area chart', () => {
    const r = processChart(rows, columns, baseState({ chartType: 'area' }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.chart.datasets[0].fill).toBe(true);
  });

  it('renders multiple series', () => {
    const r = processChart(
      rows,
      columns,
      baseState({
        yFields: ['sales', 'units'],
        seriesLabels: { sales: 'sales', units: 'units' },
        seriesColors: { sales: '#3b82f6', units: '#ef4444' },
      })
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.chart.datasets).toHaveLength(2);
    expect(r.chart.datasets[1].data).toEqual([10, 20]);
  });

  it('returns ok:false on empty rows', () => {
    const r = processChart([], columns, baseState());
    expect(r.ok).toBe(false);
  });

  it('returns ok:false on missing x field', () => {
    const r = processChart(rows, columns, baseState({ xField: '' }));
    expect(r.ok).toBe(false);
  });

  it('returns ok:false on no y fields', () => {
    const r = processChart(rows, columns, baseState({ yFields: [] }));
    expect(r.ok).toBe(false);
  });
});
