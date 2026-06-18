---
name: deep_analyze
description: Tabular-data analysis pipeline (CSV/XLSX -> schema profile -> sub-tables -> charts -> insights -> PDF report).
tools: tools.py
---

When the user asks to **analyze**, **summarize**, or **profile** a `.csv` or
`.xlsx` file:

1. Use the file's real path. When the user references a file with `@`, the
   injected `<file_content absolute_path="...">` tag contains the exact
   absolute path — pass that verbatim. Never invent or reconstruct a path, and
   never point at an `analyze/<job_id>/` directory (those are output dirs from
   previous runs, not where the source data lives).
2. Call `deep_analyze(file_path=<absolute path>)` to get a `job_id`.
3. Poll `get_analyze_status(job_id=...)` every few seconds until `status` is
   `done`, `failed`, or `cancelled`. Charts and the final PDF stream as
   artifacts automatically.
4. When `done`, summarize for the user in one paragraph: number of sub-tables,
   charts, and the path to `report.pdf`.

Do not run ad-hoc `bash`/`python` on the data file. Do not call `chart` or
`md_to_pdf` directly — those are internal to `deep_analyze`.

To stop a running job, call `cancel_analyze(job_id=...)`.
