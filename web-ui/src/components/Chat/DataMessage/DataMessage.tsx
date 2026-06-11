import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { Message } from '../../../types';
import { useChartsStore } from '../../../stores/charts';
import { processChart } from './chartProcessor';
import { EditPanel } from './EditPanel';

// chart.js + react-chartjs-2 is ~120 kB gzip — load it only when an assistant
// turn actually renders a chart, not on every cold start.
const ChartView = lazy(() => import('./ChartView').then(m => ({ default: m.ChartView })));

export function DataMessage({ message }: { message: Message }) {
  const messageId = message.data_message_id ?? '';
  const columns = message.data_columns ?? [];
  const rows = message.data_rows ?? [];
  const suggestions = message.data_suggestions ?? [];

  const initFromSuggestion = useChartsStore((s) => s.initFromSuggestion);
  const state = useChartsStore((s) => (messageId ? s.states[messageId] : undefined));

  useEffect(() => {
    if (!messageId) return;
    const current = useChartsStore.getState().states[messageId];
    if (!current && suggestions.length > 0) {
      initFromSuggestion(messageId, suggestions, columns, 0);
    }
  }, [messageId, suggestions, columns, initFromSuggestion]);

  const [editOpen, setEditOpen] = useState(false);
  const chartRef = useRef<any>(null);

  const processed = useMemo(() => {
    if (!state) return null;
    return processChart(rows, columns, state);
  }, [rows, columns, state]);

  if (!messageId || !state) {
    return (
      <div className="my-3 rounded-lg border border-border-300/15 bg-bg-100 px-3 py-2 text-sm text-text-300">
        Loading data…
      </div>
    );
  }

  const resetState = () => {
    if (suggestions.length > 0) {
      initFromSuggestion(messageId, suggestions, columns, state.activeSuggestionIdx);
    }
  };

  return (
    <div className="my-3 relative">
      <div className="rounded-lg border border-border-300/15 bg-bg-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border-300/15">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-text-000 truncate">
              {message.data_title || state.title || 'Data'}
            </span>
            {message.data_warning && (
              <span
                className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30"
                title={message.data_warning}
              >
                {message.data_warning}
              </span>
            )}
          </div>
          <button
            onClick={() => setEditOpen((o) => !o)}
            className="px-2 py-1 text-xs rounded border border-border-300/15 text-text-100 hover:bg-bg-200"
          >
            {editOpen ? 'Close' : 'Edit'}
          </button>
        </div>

        {/* Suggestion chip bar */}
        {suggestions.length > 1 && (
          <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-border-300/15 bg-bg-000/40">
            {suggestions.map((s, i) => {
              const active = state.activeSuggestionIdx === i;
              return (
                <button
                  key={i}
                  onClick={() =>
                    initFromSuggestion(messageId, suggestions, columns, i)
                  }
                  className={
                    'px-2 py-0.5 text-[11px] rounded-full border ' +
                    (active
                      ? 'bg-accent-main-100/15 border-accent-main-100/40 text-accent-main-100'
                      : 'border-border-300/15 text-text-300 hover:bg-bg-200')
                  }
                  title={s.reason}
                >
                  {s.chart_type}
                  {s.reason ? ` · ${s.reason}` : ''}
                </button>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="p-3">
          {processed && processed.ok === false ? (
            <div className="flex items-center justify-between gap-3 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              <span>{processed.error}</span>
              <button
                onClick={resetState}
                className="px-2 py-1 text-xs rounded border border-amber-500/30 hover:bg-amber-500/10"
              >
                Reset
              </button>
            </div>
          ) : processed && processed.ok ? (
            <Suspense fallback={<div className="h-64 w-full skeleton-shimmer rounded-md" aria-label="Loading chart" />}>
              <ChartView
                ref={chartRef}
                chart={processed.chart}
                chartType={state.chartType}
                title={state.title}
                axisLabels={state.axisLabels}
                legend={state.legend}
                grid={state.grid}
                numberFormat={state.numberFormat}
              />
            </Suspense>
          ) : null}
        </div>
      </div>

      {/* Edit popover (anchored under the Edit button, right-aligned) */}
      {editOpen && (
        <div className="absolute right-2 top-12 z-20">
          <EditPanel
            messageId={messageId}
            columns={columns}
            chartRef={chartRef}
            onClose={() => setEditOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
