import { create } from 'zustand';
import type { ChartSuggestion, DataColumn } from '../types';

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'doughnut' | 'scatter';
export type NumberFormat = 'plain' | 'thousands' | 'percent' | 'currency';

export interface ChartEditState {
  activeSuggestionIdx: number;
  chartType: ChartType;
  xField: string;
  yFields: string[];
  title: string;
  axisLabels: { x?: string; y?: string };
  seriesLabels: Record<string, string>;
  seriesColors: Record<string, string>;
  legend: boolean;
  grid: boolean;
  numberFormat: NumberFormat;
}

interface ChartsStore {
  states: Record<string, ChartEditState>;
  initFromSuggestion: (
    messageId: string,
    suggestions: ChartSuggestion[],
    columns: DataColumn[],
    idx: number
  ) => void;
  update: (messageId: string, partial: Partial<ChartEditState>) => void;
  reset: (messageId: string) => void;
}

const DEFAULT_COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316'];

function buildState(suggestions: ChartSuggestion[], _columns: DataColumn[], idx: number): ChartEditState {
  const s = suggestions[idx] ?? suggestions[0];
  const seriesColors: Record<string, string> = {};
  const seriesLabels: Record<string, string> = {};
  s.y.forEach((y, i) => {
    seriesColors[y] = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
    seriesLabels[y] = y;
  });
  return {
    activeSuggestionIdx: idx,
    chartType: s.chart_type,
    xField: s.x,
    yFields: [...s.y],
    title: s.title ?? '',
    axisLabels: {},
    seriesLabels,
    seriesColors,
    legend: true,
    grid: true,
    numberFormat: 'plain',
  };
}

export const useChartsStore = create<ChartsStore>((set) => ({
  states: {},
  initFromSuggestion: (messageId, suggestions, columns, idx) =>
    set((state) => ({
      states: { ...state.states, [messageId]: buildState(suggestions, columns, idx) },
    })),
  update: (messageId, partial) =>
    set((state) => {
      const prev = state.states[messageId];
      if (!prev) return state;
      return { states: { ...state.states, [messageId]: { ...prev, ...partial } } };
    }),
  reset: (messageId) =>
    set((state) => {
      const { [messageId]: _drop, ...rest } = state.states;
      return { states: rest };
    }),
}));
