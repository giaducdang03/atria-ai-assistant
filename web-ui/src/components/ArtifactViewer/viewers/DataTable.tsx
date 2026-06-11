interface Props {
  columns: string[];
  rows: (string | number | null | undefined)[][];
  truncatedFrom?: number;
  maxRows?: number;
}

const DEFAULT_MAX = 5000;

export function DataTable({ columns, rows, truncatedFrom, maxRows = DEFAULT_MAX }: Props) {
  const capped = rows.slice(0, maxRows);
  return (
    <div className="flex flex-col h-full">
      {truncatedFrom !== undefined && truncatedFrom > maxRows && (
        <div className="px-3 py-1.5 text-[13px] font-mono text-block-coral border-b border-hairline-soft bg-surface-soft/70">
          Showing {maxRows.toLocaleString()} of {truncatedFrom.toLocaleString()} rows
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <table className="text-[13px] font-mono w-max min-w-full border-collapse">
          <thead className="sticky top-0 bg-canvas backdrop-blur z-10">
            <tr>
              {columns.map((c, i) => (
                <th
                  key={i}
                  className="text-left px-2 py-1 border-b border-hairline text-ink/80 whitespace-nowrap"
                >
                  {c || `col${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {capped.map((row, ri) => (
              <tr key={ri} className="hover:bg-surface-soft/60">
                {columns.map((_, ci) => (
                  <td
                    key={ci}
                    className="px-2 py-0.5 border-b border-hairline-soft text-ink whitespace-nowrap"
                  >
                    {row[ci] == null ? '' : String(row[ci])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
