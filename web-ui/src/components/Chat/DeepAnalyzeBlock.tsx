import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message, DeepAnalyzePhase, DeepAnalyzePhaseStatus } from '../../types';

interface Props {
  message: Message;
}

const PHASES: { key: DeepAnalyzePhase; label: string }[] = [
  { key: 'load',    label: 'Load'    },
  { key: 'plan',    label: 'Plan'    },
  { key: 'extract', label: 'Extract' },
  { key: 'render',  label: 'Render'  },
  { key: 'insight', label: 'Insight' },
  { key: 'report',  label: 'Report'  },
];

const STATUS_COLORS = {
  running:   'text-amber-400',
  done:      'text-emerald-400',
  error:     'text-red-400',
  cancelled: 'text-text-400',
} as const;

const STATUS_LABELS = {
  running:   'Analyzing…',
  done:      'Complete',
  error:     'Error',
  cancelled: 'Cancelled',
} as const;

function phaseClass(status: DeepAnalyzePhaseStatus | undefined): string {
  switch (status) {
    case 'done':
      return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
    case 'running':
      return 'bg-amber-500/15 border-amber-500/40 text-amber-300';
    default:
      return 'bg-bg-200/40 border-border-300/15 text-text-400';
  }
}

function phaseIcon(status: DeepAnalyzePhaseStatus | undefined) {
  if (status === 'done') {
    return (
      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (status === 'running') {
    return (
      <span className="inline-block w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
    );
  }
  return (
    <span className="inline-block w-2 h-2 rounded-full bg-current opacity-30 flex-shrink-0" />
  );
}

function ItemRow({ name, status, error, suffix }: { name: string; status: 'done' | 'failed'; error?: string; suffix?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1 text-xs font-mono">
      {status === 'done' ? (
        <svg className="w-3 h-3 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3 h-3 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span className={`flex-1 truncate ${status === 'done' ? 'text-text-200' : 'text-text-400 line-through'}`}>{name}</span>
      {suffix && <span className="text-text-500 flex-shrink-0">{suffix}</span>}
      {status === 'failed' && error && (
        <span className="text-red-400/80 text-[10px] truncate max-w-[16ch]" title={error}>{error}</span>
      )}
    </div>
  );
}

export function DeepAnalyzeBlock({ message }: Props) {
  const {
    da_job_id,
    da_status = 'running',
    da_phases = {},
    da_load_rows,
    da_load_cols,
    da_plan_subtables,
    da_plan_charts,
    da_subtables = [],
    da_charts = [],
    da_insights = [],
    da_report_path,
    da_error,
    da_failed_phase,
  } = message;

  const [openInsight, setOpenInsight] = useState<string | null>(null);

  const doneCount = PHASES.filter(p => da_phases[p.key] === 'done').length;
  const statusKey: keyof typeof STATUS_LABELS =
    da_status === 'cancelled' ? 'cancelled' :
    da_status === 'error' ? 'error' :
    da_status === 'done' ? 'done' : 'running';

  return (
    <div className="bg-bg-000 border border-border-300/15 rounded-lg overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border-300/10">
        <svg className="w-4 h-4 text-accent-main-100 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-text-300">deep analyze</span>
            <span className={`text-xs font-mono font-semibold ${STATUS_COLORS[statusKey]}`}>
              {STATUS_LABELS[statusKey]}
            </span>
          </div>
          {(da_load_rows != null || da_load_cols != null) && (
            <p className="text-xs text-text-400 font-mono mt-0.5">
              {da_load_rows != null && <span>{da_load_rows.toLocaleString()} rows</span>}
              {da_load_rows != null && da_load_cols != null && <span> · </span>}
              {da_load_cols != null && <span>{da_load_cols} cols</span>}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 text-xs font-mono text-text-400">
          <span>{doneCount}/{PHASES.length}</span>
          {da_job_id && <span className="text-text-500 opacity-50 truncate max-w-[16ch]">{da_job_id}</span>}
        </div>
      </div>

      {/* Status stripe */}
      <div className={
        da_status === 'done' ? 'h-0.5 bg-emerald-500/60' :
        da_status === 'error' ? 'h-0.5 bg-red-500/60' :
        da_status === 'cancelled' ? 'h-0.5 bg-text-500/40' :
        'h-0.5 bg-bg-200'
      }>
        {da_status === 'running' && (
          <div
            className="h-full bg-accent-main-100 transition-all duration-500"
            style={{ width: `${Math.max((doneCount / PHASES.length) * 100, 3)}%` }}
          />
        )}
      </div>

      {/* Phase pills */}
      <div className="px-4 py-3 flex flex-wrap gap-1.5">
        {PHASES.map(p => {
          const st = da_phases[p.key];
          return (
            <div
              key={p.key}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono ${phaseClass(st)}`}
            >
              {phaseIcon(st)}
              <span>{p.label}</span>
            </div>
          );
        })}
      </div>

      {/* Error message */}
      {da_status === 'error' && da_error && (
        <div className="mx-4 mb-3 px-3 py-2 text-xs text-red-400 font-mono bg-red-500/5 border border-red-500/30 rounded-md">
          {da_failed_phase && <span className="font-semibold mr-1">{da_failed_phase}:</span>}
          {da_error}
        </div>
      )}

      {/* Sub-tables */}
      {da_subtables.length > 0 && (
        <div className="mx-4 mb-3 border border-border-300/10 rounded-md overflow-hidden">
          <div className="px-3 py-1.5 bg-bg-200/40 flex items-center justify-between">
            <span className="text-xs font-semibold text-text-200 font-mono">Sub-tables</span>
            <span className="text-xs text-text-500 font-mono">
              {da_subtables.filter(s => s.status === 'done').length}/{da_plan_subtables ?? da_subtables.length}
            </span>
          </div>
          <div className="divide-y divide-border-300/10">
            {da_subtables.map((s, i) => (
              <ItemRow
                key={i}
                name={s.name}
                status={s.status}
                error={s.error}
                suffix={s.status === 'done' ? `${s.rows.toLocaleString()} rows` : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      {da_charts.length > 0 && (
        <div className="mx-4 mb-3 border border-border-300/10 rounded-md overflow-hidden">
          <div className="px-3 py-1.5 bg-bg-200/40 flex items-center justify-between">
            <span className="text-xs font-semibold text-text-200 font-mono">Charts</span>
            <span className="text-xs text-text-500 font-mono">
              {da_charts.filter(c => c.status === 'done').length}/{da_plan_charts ?? da_charts.length}
            </span>
          </div>
          <div className="divide-y divide-border-300/10">
            {da_charts.map((c, i) => (
              <ItemRow key={i} name={c.name} status={c.status} error={c.error} />
            ))}
          </div>
        </div>
      )}

      {/* Insights (expandable markdown) */}
      {da_insights.length > 0 && (
        <div className="mx-4 mb-3 border border-border-300/10 rounded-md overflow-hidden">
          <div className="px-3 py-1.5 bg-bg-200/40 flex items-center justify-between">
            <span className="text-xs font-semibold text-text-200 font-mono">Insights</span>
            <span className="text-xs text-text-500 font-mono">
              {da_insights.filter(i => i.status === 'done').length}/{da_insights.length}
            </span>
          </div>
          <div className="divide-y divide-border-300/10">
            {da_insights.map((ins, i) => {
              const key = `${i}-${ins.name}`;
              const isOpen = openInsight === key;
              const canOpen = ins.status === 'done' && !!ins.md;
              return (
                <div key={i}>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-1 text-xs font-mono hover:bg-bg-100/40 transition-colors text-left disabled:cursor-default"
                    onClick={() => canOpen && setOpenInsight(isOpen ? null : key)}
                    disabled={!canOpen}
                  >
                    {ins.status === 'done' ? (
                      <svg className="w-3 h-3 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={`flex-1 truncate ${ins.status === 'done' ? 'text-text-200' : 'text-text-400 line-through'}`}>
                      {ins.name}
                    </span>
                    {canOpen && (
                      <svg
                        className={`w-3 h-3 text-text-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                    {ins.status === 'failed' && ins.error && (
                      <span className="text-red-400/80 text-[10px] truncate max-w-[16ch]" title={ins.error}>{ins.error}</span>
                    )}
                  </button>
                  {isOpen && ins.md && (
                    <div className="px-3 pb-3 prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          p({ children }) { return <p className="text-xs text-text-200 mb-1.5 leading-relaxed">{children}</p>; },
                          ul({ children }) { return <ul className="list-disc pl-4 space-y-0.5 mb-1.5">{children}</ul>; },
                          li({ children }) { return <li className="text-xs text-text-200">{children}</li>; },
                          strong({ children }) { return <strong className="font-semibold text-text-100">{children}</strong>; },
                          h3({ children }) { return <h3 className="text-text-100 text-sm font-semibold mt-2 mb-1">{children}</h3>; },
                        }}
                      >
                        {ins.md}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Final report */}
      {da_report_path && (
        <div className="mx-4 mb-4 flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
          <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs font-mono text-emerald-300 truncate" title={da_report_path}>
            Report: {da_report_path}
          </span>
        </div>
      )}
    </div>
  );
}
