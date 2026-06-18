# Atria — Technical Specification

> AI-powered command-line coding assistant with a compound (multi-agent) architecture, context-engineering layer, multi-provider LLM support, a Textual TUI, and a React/FastAPI web UI.
>
> This document is a feature-and-flow specification intended for documentation indexing (Context7). It describes **what each feature does**, **the step-by-step flow**, and **which technologies are used**. File references point at the source of truth.

- **Package**: `atria` (version 0.1.7), Python ≥ 3.10
- **Entry point**: `atria` → `atria.cli:main`
- **License**: MIT
- **Repo layout**: `atria/` (Python package), `web-ui/` (React frontend), `tests/`, `schema.sql`, `Dockerfile`, `docker-compose*.yml`

---

## Product Introduction

**Atria** is a production-grade, AI-powered coding assistant that lives in your terminal and your browser. It pairs a reasoning **ReAct agent** with a fleet of **specialized subagents** and a deep **context-engineering layer**, so it can explore a codebase, plan changes, edit files, run commands, review pull requests, audit security, generate web apps, and operate across messaging channels — all while staying provider-agnostic and keeping the developer in control through an explicit approval system.

Unlike a thin LLM wrapper, Atria is a **compound AI system**: the model decides each step (no hard-coded conversation flow), the context layer keeps long sessions coherent under token pressure, and a strategy memory lets the agent improve over time. It ships with two first-class front-ends (a Textual TUI and a React/FastAPI web app), a sandboxed Docker runtime for untrusted execution, and an extensible plugin/skill/MCP ecosystem.

### Who it's for
- **Individual developers** who want an agentic coding copilot in the terminal with full tool access and undo-safety.
- **Teams** who want a self-hostable web UI (Docker + Postgres), multi-session collaboration, and messaging-channel integrations.
- **Power users / researchers** who want provider freedom (8+ LLM providers), MCP tool extensibility, and custom subagents/skills.

### Highlighted Features

- **🧠 Compound multi-agent architecture** — One main ReAct agent plus **10 specialized subagents** (Code-Explorer, Planner, PR-Reviewer, Security-Reviewer, Web-Generator, Web-Clone, Data-Extractor, Visualizer, Project-Init, Ask-User), dispatched in parallel via a single `spawn_subagent` call.

- **🔌 Multi-provider, zero lock-in** — Works with **Anthropic, OpenAI, Azure, Fireworks, Groq, Mistral, DeepInfra, OpenRouter** (and more) behind a unified adapter, with **automatic API-key rotation**, per-status cooldowns, and reasoning-model awareness (o1/o3/gpt-5).

- **🎯 Per-workflow model binding** — Assign different models to **execution, thinking, critique, compaction, and vision** independently — cheap models for routine work, frontier models for hard reasoning.

- **📚 Context engineering that survives long sessions** — **Staged compaction** (warn → mask → prune → aggressive-mask → LLM-summarize at 70→99% token usage), observation masking, history archiving, and an **artifact index** so the agent never loses track of files it touched.

- **🧩 ACE Playbook (self-improving strategy memory)** — Accumulates reusable strategies with **embedding-based semantic retrieval**, effectiveness/recency scoring, and a Reflector→Curator loop that updates the playbook after every task.

- **🛠️ 25+ built-in tools** — File ops, fuzzy **edit** (9-pass matching), **bash** with security gating, **git**, web search/fetch/screenshot, **browser automation** (Playwright), **VLM** image analysis, PDF in/out, Jupyter notebooks, charts, scheduling, memory, and todos.

- **🔍 AST + LSP code intelligence** — Symbol-level navigation and refactoring (`find_symbol`, `find_referencing_symbols`, `rename_symbol`, `replace_symbol_body`) across **~35 language servers**, plus `ast-grep` structural search.

- **✅ Safety & control by default** — Interactive **approval system** (single / approve-all / glob patterns), **Plan mode** (read-only planning before execution), and a **shadow-git snapshot** engine for perfect per-step undo without touching your real repository.

- **🔗 MCP integration** — Dynamic tool discovery via the **Model Context Protocol** (stdio/http/sse), with token-efficient `search_tools` so only relevant external tools enter the context.

- **💻 Two first-class UIs** — A polished **Textual TUI** (mode/autonomy/thinking toggles, slash commands, inline approvals) and a **React + FastAPI web app** with real-time WebSocket streaming, multi-session management, a Monaco-based artifact viewer, and charts.

- **🐳 Sandboxed Docker runtime** — Local and **remote containerized execution** (host client ↔ in-container FastAPI server) for isolating untrusted code; one-command `docker compose` stack (Postgres 16 + Adminer + app).

- **📨 Channel adapter framework** — A unified `InboundMessage`/`OutboundMessage` abstraction with a message router, per-channel reset policies, and workspace selection — ready for **Telegram / WhatsApp** and future channels.

- **🧱 Extensible everywhere** — **Plugins** (marketplace + install), in-process & shell **hooks** across the full lifecycle, **skills** (lazy-loaded markdown + optional tools) discovered from project/user/builtin scopes, and named **personas** to reshape the agent's behavior on demand.

- **📊 Built-in research & analysis pipelines** — Background multi-stage skills that stream artifacts: **`deep_research`** (MECE taxonomy → review → section synthesis → Markdown report), **`deep_analyze`** (CSV/XLSX → profile → charts → PDF report), and **`domain_enrich`** (web-grounded `DOMAIN_SKILL.md` before specialized tasks).

- **📎 Smart context injection** — `@mention` files/folders are expanded into structured XML-tagged context (text, truncated, directory tree, PDF) with **multimodal image blocks** for vision, plus a conversation/project-scoped **artifacts** system surfaced in the web viewer.

- **💾 Durable, multi-tenant persistence** — Dual session backend (JSON files **and** PostgreSQL), users/projects/conversations/artifacts schema, topic auto-titling, and session fork/resume.

### Why Atria

- **Agentic, not scripted** — the LLM reasons and chooses actions each turn; control flow is never hard-coded.
- **Long-running and coherent** — context engineering keeps multi-hour sessions on track under token limits.
- **You stay in control** — nothing destructive happens without approval, and every step is undoable.
- **Yours to run and extend** — self-hostable, provider-agnostic, and open to plugins, skills, MCP servers, and custom agents.

> **Maturity note.** Most highlighted capabilities are shipped (see `ROADMAP.md`). In progress: remote web-UI sessions, a proactive background agent loop, and Telegram/WhatsApp channel integrations (adapter skeletons are in place).

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Entry Points & CLI](#3-entry-points--cli)
4. [Runtime Services (Config, Modes, Approval)](#4-runtime-services-config-modes-approval)
5. [Agent Layer (ReAct Loop & Dual Agents)](#5-agent-layer-react-loop--dual-agents)
6. [Subagent System](#6-subagent-system)
7. [Prompt Composition System](#7-prompt-composition-system)
8. [LLM Provider Layer](#8-llm-provider-layer)
9. [Tool Layer (Registry & Catalog)](#9-tool-layer-registry--catalog)
10. [LSP & Symbol (AST) Tools](#10-lsp--symbol-ast-tools)
11. [Context Engineering (Compaction, Memory, Retrieval)](#11-context-engineering)
12. [ACE Playbook (Strategy Memory)](#12-ace-playbook-strategy-memory)
13. [Session Persistence & History](#13-session-persistence--history)
14. [MCP Integration](#14-mcp-integration)
15. [Textual TUI](#15-textual-tui)
16. [Web UI (FastAPI + React)](#16-web-ui-fastapi--react)
17. [Docker Runtime](#17-docker-runtime)
18. [Channel Adapter Framework](#18-channel-adapter-framework)
19. [Plugins, Hooks & Skills](#19-plugins-hooks--skills)
20. [Database Schema](#20-database-schema)
21. [Authentication](#21-authentication)
22. [Personas (Agent Customization)](#22-personas-agent-customization)
23. [Built-in Skill Pipelines](#23-built-in-skill-pipelines)
24. [@Mention File Injection & Artifacts](#24-mention-file-injection--artifacts)

---

## 1. System Overview

Atria is a **compound AI system**: a main ReAct agent with full tool access, plus a fleet of specialized subagents. It layers context engineering (compaction, strategy memory, retrieval), a rich tool catalog (file/bash/git/web/vision/AST), multi-provider LLM routing, and two front-ends (terminal TUI and web app).

```
Entry Point (cli/main.py)
      |
UI Layer ── ui_textual/ (Textual TUI) ── web/ (FastAPI + React)
      |
Agent Layer (core/agents/)
  ├─ main_agent/ ........ ReAct agent, full tool access
  ├─ subagents/ ......... 10 specialized agents (Task tool dispatch)
  └─ prompts/ ........... modular prompt composition
      |
Tool Layer (core/context_engineering/tools/)
  ├─ registry.py ........ discovery + dispatch
  ├─ handlers/ .......... file/process/web/git/memory/session/...
  └─ implementations/ ... bash, edit, write, browser, vlm, pdf, ...
      |
Context Engineering (core/context_engineering/)
  ├─ compaction.py ...... staged compaction (70%→99%)
  ├─ memory/ ............ ACE playbook, embeddings, reflection
  ├─ retrieval/ ......... indexer, retriever, token monitor
  ├─ history/ ........... sessions, snapshots, undo
  └─ mcp/ ............... Model Context Protocol integration
      |
Runtime Services (core/runtime/)
  ├─ config.py .......... hierarchical config
  ├─ mode_manager.py .... Normal / Plan modes
  └─ approval/ .......... operation approval
      |
Infrastructure
  ├─ docker/ ............ sandboxed local/remote execution
  ├─ channels/ .......... Telegram/WhatsApp adapter framework
  ├─ plugins/, hooks/, skills/ ... extensibility
  └─ db/, auth/ ......... Postgres persistence + users
```

### Design principles (from `CLAUDE.md`)

- **No hard-coded conversation branching**: the LLM decides the next step each turn; control flow is agentic, not static if/else.
- **Prompts never use tables** — prose/bullets only (tables parse poorly for LLMs).
- **Code style**: 100-char lines (Black + Ruff), type hints on public APIs (mypy strict), Google-style docstrings.

---

## 2. Technology Stack

### Backend (Python)
- **CLI**: `argparse` (stdlib)
- **Terminal UI**: `textual` (≥0.60), `rich`, `prompt-toolkit`
- **Web backend**: `fastapi`, `uvicorn`, WebSockets, `passlib[bcrypt]`, `itsdangerous` (signed cookies)
- **LLM transport**: `httpx` (custom client with retry/backoff)
- **Agent framework**: custom ReAct loop (`pydantic-ai` patterns), `pydantic` v2 for models/validation
- **Tokenization / context**: `tiktoken`
- **MCP**: `fastmcp` (≥3.0)
- **Browser automation**: `playwright`; **web crawl**: `crawl4ai`; **web search**: `duckduckgo-search`
- **AST search**: `ast-grep-cli`; **LSP**: `solidlsp`-style servers (`pathspec`, `overrides`)
- **Vision/media**: `pillow`; **PDF in**: `pypdf`; **PDF out**: `weasyprint`, `markdown`
- **Data/plots**: `pandas`, `matplotlib`, `seaborn`, `openpyxl` (Excel)
- **Git**: `gitpython` + git CLI
- **Database**: `sqlalchemy[asyncio]` (2.0) + `asyncpg` (PostgreSQL 16)
- **Process mgmt**: `psutil`, `pexpect` (Docker shell sessions)
- **Datasets**: `datasets` (SWE-bench loading)
- **Dev tooling**: `pytest`, `pytest-asyncio`, `black`, `ruff`, `mypy`

### Frontend (`web-ui/`)
- **React 18.3** + **React Router v7** + **Vite 5** + **TypeScript 5.4**
- **State**: **Zustand 4.5** (per-session state slices)
- **Styling**: **Tailwind CSS 3.4**
- **Rendering**: `react-markdown`, `@monaco-editor/react` (code), `chart.js` + `react-chartjs-2`, `motion` (Framer Motion), `lucide-react` (icons)

### Infrastructure
- **Docker** (Python 3.12 slim, `uv` for deps), **docker-compose** (Postgres 16 + Adminer + Atria app)

---

## 3. Entry Points & CLI

**Source**: `cli/main.py::main()`, `cli/non_interactive.py`, `cli/{config,mcp,run}_commands.py`

The CLI uses **argparse** with subparsers. The bare `atria` command launches the interactive Textual TUI.

### Global flags
- `--version, -V`
- `--working-dir, -d PATH` — set working directory
- `--prompt, -p TEXT` — execute a single prompt non-interactively, then exit
- `--continue, -c` — resume the most recent session for the current directory
- `--resume, -r [ID]` — resume a specific session or pick interactively
- `--verbose, -v` — detailed logging
- `--dangerously-skip-permissions` — auto-approve all operations

### Subcommands
- **`config`** → `setup` (interactive wizard), `show` — handler `cli/config_commands.py`
- **`mcp`** → `list`, `get <name>`, `add <name> <cmd> [args] [--env K=V] [--no-auto-start]`, `enable/disable <name>`, `remove <name>` — handler `cli/mcp_commands.py`
- **`run ui`** → starts the web UI (`--ui-port` default 8080, `--ui-host` default 127.0.0.1) — handler `cli/run_commands.py`

### Standalone web server — `atria/serve.py`
Besides `atria run ui`, a dedicated entry point `serve.py::main()` (`python -m atria.serve`) starts only the FastAPI web server, **Postgres-backed**: it builds `ConfigManager`, a `PgSessionManager` (via `get_sessionmaker()`), `ModeManager`, `ApprovalManager`, `UndoManager`, `MCPManager`, and `PgUserStore`, finds an available port (`web/port_utils.find_available_port`, up to 10 attempts), verifies the built UI static files exist, then `start_server(...)` in a thread. Used for headless/server deployments (no browser auto-open).

### Flow: bare prompt vs subcommand (`main.py:284-337`)
- `atria "hello"` → launches TUI **with an initial message** (not non-interactive).
- `atria -p "hello"` → **non-interactive**: creates a temp session, runs once via `_run_non_interactive()`, deletes the temp session (not persisted), prints output.
- If config is missing on startup, the setup wizard runs first (`atria.setup.run_setup_wizard`).

### Non-interactive flow (`cli/non_interactive.py`)
1. Build managers: Config, Mode (NORMAL), Approval (auto-approve if flagged), Undo, Session.
2. Initialize tools and build the runtime suite (tool registry + agents).
3. `agent.run_sync(prompt, deps, message_history)`.
4. Persist user+assistant messages with metadata (thinking trace, token usage) — then discard the temp session.

---

## 4. Runtime Services (Config, Modes, Approval)

### Hierarchical config — `core/runtime/config.py::ConfigManager`
Priority (high → low): **project `.atria/settings.json` → user `~/.atria/settings.json` → env vars → defaults**.

Load flow (`load_config()`):
1. Parse JSON (with comment stripping).
2. Substitute `{env:VAR}` and `{file:path}` placeholders.
3. Merge global + project instructions.
4. Build an `AppConfig` (pydantic), auto-setting `max_context_tokens` to ~80% of the model context length.

Also loads: `ATRIA.md` context files (global → project → subdirs) and **custom agents** (JSON + markdown with YAML frontmatter).

`AppConfig` highlights: per-workflow model slots (`model`, `model_thinking`, `model_vlm`, `model_critique`, `model_compact`), `PermissionConfig` (per-tool enable/allow/deny regex), `OperationConfig` (show_diffs, backup_before_edit, max_file_size).

### Modes — `core/runtime/mode_manager.py::ModeManager`
`OperationMode` enum: **NORMAL** (execute with approvals) and **PLAN** (planning only, no execution).
- Plan storage for the auto-execute workflow: `store_plan()`, `get_pending_plan()`, `has_pending_plan()`, `clear_plan()`.
- `needs_approval()` performs smart danger detection for bash (`rm -rf /`, `sudo`, `chmod -R 777`, fork bombs, `curl|bash`, `mkfs`, `fdisk`, …).
- Toggle via `/mode` slash command or **Shift+Tab** in the TUI.

### Approval system — `core/runtime/approval/manager.py::ApprovalManager`
1. `request_approval(operation, preview, command, …)` shows an interactive `prompt-toolkit` menu: **1** approve once, **2** approve all remaining (sets `auto_approve_remaining`), **3** deny + give feedback.
2. Glob/pattern auto-approval: `add_glob_pattern("*.py")`, session-scoped rules cleared on session switch.
3. Batch approval: `request_batch_approval()` summarizes pending ops.
4. Returns `ApprovalResult{approved, choice, edited_content, apply_to_all, cancelled}`.

### Error recovery & monitoring — `core/runtime/monitoring/`
- `error_handler.py` provides interactive recovery when an operation fails: the user can **Retry / Skip / Cancel / Edit** (`ErrorAction` enum), returning an `ErrorResult{action, should_retry, should_cancel, edited_params}`. "Edit" lets the user fix tool parameters and re-run.
- `task_monitor.py` tracks per-operation status/interrupt signals (`should_interrupt()`), surfaced as UI spinners and consumed by the HTTP/MCP layers to abort in-flight work.

---

## 5. Agent Layer (ReAct Loop & Dual Agents)

**Source**: `core/agents/main_agent/` (`agent.py`, `run_loop.py`, `llm_calls.py`, `http_clients.py`)

The main agent is composed of mixins: `RunLoopMixin` (the loop), `LlmCallsMixin` (LLM calls), `HttpClientMixin` (provider clients).

### ReAct loop — `RunLoopMixin.run_sync()`
1. **Message setup**: wrap in `ValidatedMessageList`, inject the (cacheable) system prompt, append the user request.
2. **Per-iteration**:
   - Drain injected messages (thread-safe queue, used by the WebSocket UI to inject mid-run).
   - **Context compaction** if near the token limit (`ContextCompactor`).
   - **VLM routing**: switch to the vision model if messages contain images.
   - **LLM API call** with `tools` and `tool_choice: "auto"`; **3× retry** on 429/500/502/503 with backoff `[2s,5s,10s]`. Optional dynamic system part for Anthropic prompt caching.
3. **Parse response** → content + `tool_calls`; record token usage for cost tracking.
4. **Execute tools**:
   - **Parallel path**: if ≥2 tools and **all are read-only/parallelizable** (`read_file`, `search`, `list_files`, `fetch_url`, `web_search`, `analyze_image`, …) and none is `task_complete`, run via `ThreadPoolExecutor` (max 5 workers); UI spinners fire upfront, results stream as each completes.
   - **Sequential path**: for writes, `task_complete`, or mixed tools. Enforces **explore-first** (blocks non-exempt subagents until Code-Explorer has run).
5. **Completion**: explicit `task_complete` tool returns immediately; otherwise an **implicit completion** path nudges the agent (up to 3 nudges) if the last tool failed or todos are incomplete, then returns cleaned content. Interrupts (ESC / WebSocket) return `interrupted=True`.

Three LLM call types (`llm_calls.py`): `call_thinking_llm()` (reasoning only, routes to `model_thinking`), `call_critique_llm()` (critiques a thinking trace, routes to `model_critique`), `call_llm()` (action phase with tools, routes to VLM model when images present).

### Dual-agent / Plan mode
Rather than a separate process, planning is realized two ways:
- **Plan mode** restricts the toolset to read-only (tool-schema filtering via `allowed_tools`), and the **Planner subagent** generates a written plan that the user approves before execution.
- **Two-part prompts** for caching: a **stable** (cacheable) part — identity, policies, tool descriptions — and a **dynamic** (`cacheable=False`) part — scratchpad, reminders, task context (`prompts/composition.py::compose_two_part`).

---

## 6. Subagent System

**Source**: `core/agents/subagents/` (`agents/*`, `manager/*`, `task_tool.py`, `specs.py`)

Subagents are spawned via the **`spawn_subagent`** tool. Each receives a fresh prompt (no conversation history) and a filtered toolset defined by its `SubAgentSpec`.

### The 10 subagents (`subagents/agents/`)
- **ask-user** — UI-only; gathers user input via structured JSON questions (no tools/LLM).
- **Code-Explorer** — deep codebase analysis; tools: `read_file`, `search`, `list_files`, `find_symbol`, `find_referencing_symbols`.
- **Planner** — explores the codebase and writes an implementation plan (planning tools + `write_file`, `edit_file`).
- **PR-Reviewer** — analyzes a GitHub PR for correctness/style/security.
- **Security-Reviewer** — vulnerability audit with severity scoring.
- **Project-Init** — project scaffolding / boilerplate generation.
- **Web-Clone** — clones a website to static HTML/CSS/JS.
- **Web-Generator** — builds React/TypeScript/Tailwind apps (`write_file`, `edit_file`, `run_command`, `list_files`, `read_file`).
- **Data-Extractor** — extracts structured data from documents/logs (PDF/DOC support).
- **Visualizer** — generates diagrams/charts/visual outputs.

### `spawn_subagent` tool (`task_tool.py`)
Parameters: `description` (3–5 words), `prompt` (full context), `subagent_type` (enum), optional `model` override, `run_in_background` (returns a `task_id`), `resume` (continue a prior subagent session). **Parallelism**: issuing multiple `spawn_subagent` calls in one response runs them concurrently.

### Execution flow (`manager/execution.py::execute_subagent`)
1. Fire `SubagentStart` hook.
2. `ask-user` is special-cased to a UI panel (no LLM).
3. If the spec has a `docker_config` and Docker is available → **`_execute_with_docker()`**: extract input files (`@file`, quoted paths, arXiv IDs), run the agent in an isolated container, copy outputs back (when `copy_back_recursive`).
4. Otherwise run locally; instantiate the compiled subagent with its filtered tools and call `run_sync(task)` (a nested ReAct loop).
5. Fire `SubagentStop` hook, return the result to the main agent.

`SubAgentManager` mixins: `RegistrationMixin` (compile specs), `DockerMixin` (availability, file extraction), `ExecutionMixin` (run, ask-user, async/parallel).

---

## 7. Prompt Composition System

**Source**: `core/agents/prompts/` (`composition.py`, `renderer.py`, `variables.py`, `reminders.py`, `loader.py`) + `prompts/templates/`

System prompts are assembled from **modular markdown sections** with priorities and runtime conditions.

- **`PromptComposer.register_section(name, file_path, condition, priority, cacheable)`** — register a section.
- **`compose(context)`** — filter by condition, sort by priority, load + join.
- **`compose_two_part(context)`** — split into a cacheable stable part and a dynamic part (Anthropic prompt caching with `cache_control: ephemeral`).

Default section priority order (`create_default_composer`): identity/policies (10–30: mode_awareness, security_policy, tone_and_style), interaction (40–50: interaction_pattern, available_tools, tool_selection), code-quality/workflows (55–75: code_quality, read_before_edit, error_recovery, and conditional `subagent_guide`/`git_workflow`/`task_tracking`), context-awareness (85–95: output_awareness, scratchpad *(dynamic)*, code_references, system_reminders *(dynamic)*).

- **Renderer** (`renderer.py`): loads a template, strips frontmatter, substitutes `${VAR}` / `${OBJ.prop}`.
- **Variables** (`variables.py`): tool-name refs, agent counts (`EXPLORE_AGENT_COUNT=3`, `PLAN_AGENT_COUNT=1`).
- **Reminders** (`reminders.py`): section-delimited `reminders.md` providing runtime nudges (e.g., `implicit_completion_nudge`, `failed_tool_nudge`, `explore_first_nudge`, `incomplete_todos_nudge`).

Template tree: `templates/system/main/*.md`, `templates/system/thinking/*.md`, `templates/subagents/*.md`, `templates/tools/*.md`, plus `docker/`, `memory/`, `generators/`.

---

## 8. LLM Provider Layer

**Source**: `core/agents/components/api/` (`base_adapter.py`, `http_client.py`, `auth_rotation.py`, `configuration.py`, `schema_adapter.py`)

- **Multi-provider**: Anthropic, OpenAI, Azure, Fireworks, Groq, Mistral, DeepInfra, OpenRouter, Gemini/xAI. A `ProviderAdapter` ABC converts internal payloads ↔ provider formats and normalizes responses to OpenAI Chat-Completions shape.
- **HTTP client** (`http_client.py`): `httpx` with tuned timeouts (connect 10s / read 300s), 3× retry on 429/503 + transient errors with exponential backoff honoring `Retry-After`; interrupt-aware; normalizes Anthropic image blocks → `image_url` data URIs.
- **Auth rotation** (`auth_rotation.py`): `AuthProfileManager` rotates multiple API keys per provider; per-status cooldowns (429→30s, 401/402→300s, 403→600s, 500→60s) with `mark_success`/`mark_failure`.
- **Per-workflow model binding**: independent models for execution / thinking / critique / compaction / vision (from `AppConfig`).
- **Schema adaptation** (`schema_adapter.py`): provider-specific tool-schema fixes — strip `additionalProperties`/`$schema` for Gemini, flatten `anyOf/oneOf` for Mistral, drop native `web_search` for xAI; pass-through for OpenAI/Anthropic/OpenRouter.
- **Reasoning models**: detects o1/o3/o4/gpt-5 to use `max_completion_tokens` and skip `temperature`.

---

## 9. Tool Layer (Registry & Catalog)

**Source**: `core/context_engineering/tools/` (`registry.py`, `middleware.py`, `param_normalizer.py`, `result_sanitizer.py`, `handlers/*`, `implementations/*`)

### Registry & dispatch — `registry.py::ToolRegistry`
1. **Registration**: instantiates handlers (file, process, web, git, schedule, memory, session, symbol/LSP, MCP) and maps tool names → handlers; skill-provided tools wrapped via `_make_skill_handler()`.
2. **Execution** (`execute_tool`): run `PRE_TOOL_USE` hooks (may block/modify args) → `normalize_params()` (camelCase→snake_case, path resolution, whitespace strip) → build `ToolExecutionContext` (mode/approval/undo/task/session managers) → dispatch to handler → run `POST_TOOL_USE`/`POST_TOOL_USE_FAILURE` hooks → **sanitize/truncate** result.
3. **Result sanitizer** (`result_sanitizer.py`): per-tool size caps with head/tail/head_tail strategies (e.g., `run_command` 8K tail, `read_file` 15K head, `git` head_tail).

### Tool catalog (grouped)
- **File ops**: `read_file`, `list_files`
- **File mutation**: `write_file`, `edit_file` (fuzzy multi-pass), `apply_patch`, `insert_before_symbol`, `insert_after_symbol`
- **Search**: `search` (text or AST mode), `find_symbol`, `find_referencing_symbols`
- **Process/bash**: `run_command`, `list_processes`, `get_process_output`, `kill_process`
- **Refactor (AST/LSP)**: `replace_symbol_body`, `rename_symbol`
- **Web/network**: `fetch_url` (deep crawl), `web_search`, `capture_web_screenshot`, `open_browser`, `browser` (Playwright automation)
- **Vision/media**: `analyze_image` (VLM), `chart`, `md_to_pdf`, `capture_screenshot`
- **Documents**: `read_pdf`, `notebook_edit` (Jupyter)
- **Memory**: `memory_search`, `memory_write` (`.atria/memory/*.md`, `ATRIA.md`)
- **Session**: `list_sessions`, `get_session_history`, `list_subagents`
- **Subagent/parallel**: `spawn_subagent`, `get_subagent_output`, `batch_tool`
- **Task mgmt**: `write_todos`, `update_todo`, `complete_todo`, `list_todos`, `clear_todos`, `task_complete`, `present_plan`
- **User interaction**: `ask_user`, `send_message`
- **Data export to UI**: `send_image`, `send_data`
- **Artifacts**: `list_artifact_images` (by scope: conversation/project/both), `read_artifact_image` (returns base64 data-URI) — backed by `handlers/artifacts_handler.py` + `db/repositories/artifact_repo.py`; supports PNG/JPG/GIF/WebP/SVG, 10 MB cap, with path-traversal guards
- **Skill pipelines** (from built-in skills): `deep_research`/`get_research_status`, `deep_analyze`/`get_analyze_status`/`cancel_analyze`, `domain_enrich` (see §23)
- **Git**: `git` (status/diff/log/branch/commit/push/pull)
- **Scheduling**: `schedule` (cron-like)
- **Discovery/meta**: `search_tools` (token-efficient MCP discovery), `invoke_skill`, `list_agents`
- **MCP (dynamic)**: `mcp__<server>__<tool>`

### Bash security — `implementations/bash_tool/security.py`
Whitelist of safe dev commands; regex blocking of dangerous patterns; approval gating for non-whitelisted commands; `shlex`-based path extraction for `rm/mv/cp/chmod/chown/ln`; output truncation (30K display / 15K LLM) and activity-based timeouts (60s idle / 600s max). Background processes tracked for polling.

### Edit tool — `implementations/edit_tool/`
A **9-pass fuzzy matching chain** (`replacers.py`): exact → line-trimmed → block-anchor → whitespace-normalized → indentation-flexible → escape-normalized → trimmed-boundary → context-aware → multi-occurrence. Generates a unified **diff preview** before writing; per-file locks serialize concurrent edits; optional `.bak` backup and `dry_run`.

---

## 10. LSP & Symbol (AST) Tools

**Source**: `core/context_engineering/tools/lsp/` + `symbol_tools/`

- **Symbol tools**: `find_symbol`, `find_referencing_symbols`, `insert_before_symbol`, `insert_after_symbol`, `replace_symbol_body`, `rename_symbol` — delegate to `SymbolRetriever` over the Language Server Protocol (JSON-RPC).
- **~35+ language servers** configured (`lsp/language_servers/`): Python (pyright/jedi), TypeScript/JS (typescript-language-server/vtsls), Go (gopls), Rust (rust-analyzer), Java (eclipse-jdtls), C/C++ (clangd), C# (csharp/omnisharp), Ruby (ruby-lsp/solargraph), PHP (intelephense), Kotlin, Swift (sourcekit), Elixir, Clojure, Scala (metals), Haskell, Lua, Bash, Dart, Erlang, Perl, R, Terraform, Rego, Julia, Fortran, Elm, Nix, YAML, Markdown (marksman), AL, Zig.
- **Flow** (`find_symbol`): detect workspace root + language → lazily start/connect the server → `workspace/symbol` request → parse into `Symbol` objects → extract body from file lines.
- **AST text search** uses `ast-grep` (`search` with `type="ast"`).

---

## 11. Context Engineering

**Source**: `core/context_engineering/compaction.py`, `retrieval/*`, `context_picker/*`

### Staged compaction (`compaction.py::ContextCompactor`)
Progressive optimization keyed to token usage:
- **70%** — warning logged, tracking begins.
- **80%** — **observation masking**: replace old tool results with `[ref: tool_id]` placeholders, keep the last ~6 intact.
- **85%** — **fast pruning**: strip old tool outputs while protecting the last ~40K tokens (zero LLM cost).
- **90%** — **aggressive masking**: keep only the last 3 tool results.
- **99%** — **full LLM compaction**: archive history to `~/.atria/scratch/{session}/history_archive_*.md`, summarize the middle, inject an **artifact index** (created/modified/read/deleted files) so workspace awareness survives compaction.

Token accounting via `retrieval/token_monitor.py::ContextTokenMonitor` (tiktoken; calibrated by real API usage).

### Retrieval & context assembly
- **Indexer** (`retrieval/indexer.py`): generates a concise `ATRIA.md` (overview, structure, key files, deps), token-bounded; detects project type.
- **Retriever** (`retrieval/retriever.py`): `EntityExtractor` pulls files/functions/classes/intents from the user message; `ContextRetriever` finds relevant code (direct mention → grep → suggestions).
- **Context Picker** (`context_picker/picker.py`): single entry point assembling system prompt + file injections + history + playbook strategies into an `AssembledContext`, with a per-piece `ContextReason` (source, relevance, tokens) for traceability; decisions logged via a tracer.

### Message integrity
- `message_pair_validator.py` detects/repairs malformed tool-call/result pairs (missing result, orphaned result, consecutive same-role) before API calls.
- `validated_message_list.py` enforces structural invariants.
- `memory/conversation_summarizer.py` maintains incremental episodic summaries (regenerates after 5 new messages).

---

## 12. ACE Playbook (Strategy Memory)

**Source**: `core/context_engineering/memory/` (`playbook.py`, `embeddings.py`, `selector.py`, `delta.py`, `roles.py`, `reflection/reflector.py`)

A native **Agentic Context Engine** that accumulates reusable strategies and retrieves them semantically.

- **Playbook** of `Bullet` items `{id, section, content, helpful, harmful, neutral, timestamps}`; `as_context(query, max_strategies=30)` returns the top-K rather than dumping all.
- **Embeddings** (`embeddings.py`): `EmbeddingCache` (in-memory + disk, sha256 keys), `cosine_similarity` via numpy.
- **Selector** (`selector.py`): hybrid score = effectiveness (0.6) + recency (0.4) + optional semantic; effectiveness = `(helpful + 0.5·neutral) / total`; recency = exponential decay.
- **Delta updates** (`delta.py`): `DeltaOperation` (ADD/UPDATE/TAG/REMOVE) batched and applied atomically.
- **Reflector + Curator** (`roles.py`, `reflection/reflector.py`): after each response, the **Reflector** extracts learnable patterns and tags bullets helpful/harmful; the **Curator** turns reflections into a `DeltaBatch` applied to the playbook.

**Loop**: respond → reflect → curate (delta) → apply → retrieve top-K for the next turn.

---

## 13. Session Persistence & History

**Source**: `core/context_engineering/history/` (`session_manager/`, `snapshot.py`, `topic_detector.py`, `undo_manager.py`)

- **Dual backend**: JSON files at `~/.atria/sessions/{8-char-id}/session.json` (project-scoped by directory hash) **and** PostgreSQL via `session_manager/pg_manager.py::PgSessionManager` (async SQLAlchemy). Operations: create/load/save (incremental append)/list/`fork_session`/`load_transcript`.
- **Snapshots** (`snapshot.py`): a **shadow git repo** at `~/.atria/snapshot/{project_id}/` captures per-step tree hashes for perfect undo without touching the real repo; `track`/`patch`/`revert`/`restore`/`undo_last`. `.gitignore` synced to the shadow's `info/exclude`.
- **Undo manager** (`undo_manager.py`): records file ops to `operations.jsonl`, paired with snapshots for atomic rollback.
- **Topic detector** (`topic_detector.py`): a background thread runs a lightweight LLM call per user message to detect topic shifts and auto-update the session title (no-op without an API key).

---

## 14. MCP Integration

**Source**: `core/context_engineering/mcp/` (`config.py`, `models.py`, `manager/*`, `handler.py`)

Dynamic tool discovery via the **Model Context Protocol** (built on `fastmcp`).

- **Config**: global `~/.atria/mcp.json` merged with project `./.mcp.json` (project wins); `${VAR}` expansion in args/env/url/headers.
- **Models**: `MCPServerConfig{command, args, env, url, headers, enabled, auto_start, transport}` — transports: **stdio**, **http**, **sse**.
- **Manager** (`manager/manager.py`): thread-safe with a background event loop; mixins for transport, connection lifecycle, and server config; per-server locks; stderr suppression during connect.
- **Discovery**: on connect, fetch tool schemas; tools become callable as `mcp__{server}__{tool}`. `search_tools` enables **token-efficient discovery** — only matched tools are injected into LLM context; first use auto-discovers.
- **Handler** (`handler.py`): `McpToolHandler.execute()` parses the `server/tool` name, calls `call_tool_sync()`, is interrupt-aware, returns `{success, output, error?, interrupted?}`.

---

## 15. Textual TUI

**Source**: `ui_textual/` (`chat_app.py`, `runner.py`, `controllers/`, `managers/`, `screens/`, `widgets/`, `renderers/`, `formatters/`)

A full terminal chat interface built on **Textual** (Rich under the hood).

- **Widgets**: `ConversationLog` (markdown + tool calls + thinking + spinners), `ChatTextArea` (input + autocomplete), `AnimatedWelcomePanel`, `StatusBar` (model/mode/dir), `TodoPanel` (Ctrl+T), `DebugPanel` (Ctrl+D).
- **Key bindings**: **Shift+Tab** cycle mode (Normal→Plan→Auto), **Ctrl+Shift+A** cycle autonomy (Manual→Semi→Auto), **Esc** interrupt, **Ctrl+G** session picker, **Ctrl+Shift+T** cycle thinking level, **Ctrl+O** toggle output expansion.
- **Controllers** drive distinct flows: approval prompt (Yes / Yes & don't ask / No), ask-user, plan approval, autocomplete popup (slash commands), model picker, agent/skill creators, spinner.
- **Managers**: console buffer bridge, message history, tool-summary, spinner service, interrupt manager, session history.

**Flows**: `TextualRunner` boots the runtime → `create_chat_app(on_message=…)`; a user message calls back into the agent runner, whose console output is bridged into `ConversationLog`. Tool approvals surface as an inline overlay; slash `/` triggers the autocomplete popup from a `SlashCommand` registry.

### Slash commands (REPL)
`/mode`, `/help`, `/init`, `/clear`, `/compact`, `/models`, `/mcp` (list/status/view/connect/disconnect/enable/disable/tools/test/reload/debug), `/agents`, `/skills`, `/plugins`, `/sound`, `/exit` — handlers in `repl/commands/` (each extends `CommandHandler`). The `repl/react_executor/` runs the reason→act→observe loop with doom-loop detection and safe read-only parallelization.

---

## 16. Web UI (FastAPI + React)

**Backend source**: `web/` (`server.py`, `state.py`, `websocket.py`, `agent_executor.py`, `protocol.py`, `routes/`, `dependencies/`)

- **FastAPI + Uvicorn**; CORS allows the Vite dev origins (`5173`, `3000`); signed-cookie auth (JWT-style via `itsdangerous`/`passlib`). Lifespan registers the event loop, creates ORM tables, and wires the WebSocket manager.
- **REST routes**: `auth` (login/logout/me), `chat` (query/messages/approve/ask_user_response/plan_approval_response), `sessions` (list/create/get/bridge-info/delete), `config` (get/providers/update), `mcp` (servers/tools/call), `commands`, `projects`, `artifacts`, `fs` (tree/read/write). SPA fallback serves `index.html`.
- **WebSocket** (`/ws`, `websocket.py::WebSocketManager`): `connect`/`disconnect`/`broadcast`. Client→server types: `query`, `approve`, `ask_user_response`, `plan_approval_response`, `ping`. Server→client types (`protocol.py`): `tool_call`, `tool_result`, `approval_required/resolved`, `message_chunk/complete`, `status_update`, `plan_content`, `thinking_block`, `deep_research_*`, `error`.
- **Agent execution** (`agent_executor.py`): runs the blocking ReAct agent in a `ThreadPoolExecutor`; async WS broadcasts are scheduled onto the main loop with `asyncio.run_coroutine_threadsafe`. Supports **bridge mode** (route web messages into a running TUI session) and concurrent sessions.
- **Shared state** (`state.py::WebState`): managers, authenticated users, WS clients, pending approvals/ask-user/plan approvals, autonomy & thinking levels, running sessions, per-session injection queues.

**Frontend source**: `web-ui/` (React 18 + Vite + Zustand + Tailwind)
- **Routing**: `/login`, `/chat`, `/codewiki` with an `AuthGuard`.
- **Zustand stores**: `chat` (per-session messages/loading/pending dialogs/queued messages), `artifacts`, `projects`, `charts`, `fileChanges`, `toast`, `fileExplorer`.
- **Components**: chat (`MessageList`, `InputBox`, `ToolCallMessage`, `ApprovalDialog`, `AskUserDialog`, `PlanApprovalDialog`, `ThinkingBlock`, `DeepResearchBlock`, `DataMessage`), artifact viewer (`MonacoViewer`, `MarkdownViewer`, `CsvViewer`/`ExcelViewer`, `PdfViewer`, `ImageViewer`, `HtmlViewer`), settings (model + MCP), layout (sidebar/topbar).
- **Transport** (`src/api/`): REST `client.ts` + reconnecting `websocket.ts` (ping/pong heartbeat, exponential backoff, tab-visibility reconnect). Flow: send via `POST /api/chat/query` (202) then stream updates over WS; messages filtered per session for multi-tab support.

---

## 17. Docker Runtime

**Source**: `core/docker/` + `Dockerfile`, `docker-compose*.yml`

Two-tier sandboxed execution (host client ↔ in-container server), following a SWE-ReX-style protocol.
- **LocalRuntime** (`local_runtime.py`): runs inside the container; persistent bash sessions via `pexpect`; `create_session`/`run_in_session`/`read_file`/`write_file`.
- **RemoteRuntime** (`remote_runtime.py`): host-side `httpx` client mirroring LocalRuntime; retries, 30s HTTP buffer, app-error deserialization (status 511).
- **FastAPI server** (`server.py`): in-container on port 8000, `X-API-Key` auth, endpoints `/is_alive`, `/create_session`, `/run_in_session`, `/close_session`, `/read_file`, `/write_file`.
- **BashSession** (`session.py`): `pexpect` shell with custom `PS1`; exit codes extracted via unique-marker regex.
- **DockerToolHandler** (`tool_handler.py`): routes tool calls to the runtime, translating host↔container paths.

**Compose stack** (`docker-compose.yml`): `db` (postgres:16-alpine, healthcheck), `adminer` (port 8081), `atria` (port 8080, volume `atria_data:/root/.atria`). Dev overrides (`docker-compose.dev.yml`) hot-reload `./atria`. Dockerfile: Python 3.12 slim, `uv` deps, layered caching (deps / playwright / tiktoken), entrypoint generates `settings.json` from `ATRIA_MODEL` / `ATRIA_API_BASE_URL`.

---

## 18. Channel Adapter Framework

**Source**: `core/channels/` (`base.py`, `router.py`, `telegram.py`, `whatsapp.py`, `mock.py`, `reset_policies.py`, `workspace_selector.py`)

A unified messaging abstraction (multi-channel, currently with Telegram/WhatsApp skeletons).
- **Models**: `InboundMessage` (channel→agent) and `OutboundMessage` (agent→channel) with `MessageAttachment`s, thread IDs, parse modes, and provenance.
- **`ChannelAdapter`** ABC: `start()`/`send()`/`stop()`.
- **MessageRouter** (`router.py`): resolves/creates a session by `(channel, user_id, thread_id)`, applies the **reset policy**, runs **workspace selection** for first-time users, dispatches to the agent, and routes the reply back.
- **Reset policies** (`reset_policies.py`): `idle` (Telegram 60m / WhatsApp 30m / Discord 120m), `daily` (Slack 4:00 UTC), `never` (Web/CLI).
- **Workspace selector** (`workspace_selector.py`): prompts new users to pick a project directory; validates numeric choice or absolute path.

---

## 19. Plugins, Hooks & Skills

**Source**: `core/plugins/`, `core/hooks/`, `core/skills.py`, `core/skill_tools.py`, `skills/builtin/`

### Hooks (`core/hooks/`)
Lifecycle `HookEvent`s: `SESSION_START`, `USER_PROMPT_SUBMIT`, `PRE_TOOL_USE`, `POST_TOOL_USE`, `POST_TOOL_USE_FAILURE`, `SUBAGENT_START`, `SUBAGENT_STOP`, `STOP`, `PRE_COMPACT`, `SESSION_END`.
- **Config** loaded from global + project `settings.json` (`HookConfig` → event → `HookMatcher` regex → `HookCommand`s).
- **Executor** runs commands as subprocesses with JSON stdin; exit code **2 = block**, others logged.
- **Manager** runs hooks sequentially, short-circuiting on block; `run_hooks_async()` fires in a thread pool.
- **Plugin hooks** (`plugin_hooks.py`): in-process Python hooks (~100× faster than shell), discovered from `~/.atria/plugins/` and `.atria/plugins/`, with `on_pre_tool_use`/`on_post_tool_use` that can block or modify args/results.

### Plugins (`core/plugins/`)
Multi-scope (user/project) plugin loading with JSON registries. `PluginManager` mixins: `MarketplaceMixin`, `InstallerMixin`, `BundleMixin`. Flow: add marketplace (git) → discover plugin → `install_plugin()` (resolve scope dir, copy, update registry) → extract/index skills → enable/disable.

### Skills (`core/skills.py`)
Lazy-loaded markdown modules with optional executable tools. Discovery priority: project `.atria/skills/` → user `~/.atria/skills/` → builtin `atria/skills/builtin/`. YAML frontmatter (`name`, `description`, `namespace`). `SkillLoader.build_skills_index()` lists skills in the system prompt; the agent loads content via `invoke_skill`. Skill-provided tools register via `SkillToolLoader` (`SKILL.md` declaring `tools.py`, whose `register(ctx)` returns `ToolSpec`s), receiving a `SkillToolContext` (web_search, broadcaster, subagent_dispatcher, llm_chat/vision). Builtin skills: **deep_research**, **deep_analyze**, **domain_enrich** — see §23 for their pipelines.

### Events bus (`core/events/`)
Thread-safe pub/sub (`EventBus`, `get_bus()`) with typed `Event`s (agent/tool/file/session/context/MCP/permission/UI) and wildcard subscriptions. Reserved for future unified event handling.

### Other infra
- **Git worktrees** (`core/git/worktree.py`): isolated branches under `~/.atria/data/worktree/{name}` (create/list/remove/reset).
- **Workspace** (`core/workspace/manager.py`): slugified path helpers + sandbox boundary checks.
- **File watcher** (`core/file_watcher.py`): optional `watchdog` observer publishing `FILE_EXTERNAL_CHANGE`, with self-write suppression.
- **Formatters** (`core/formatters/manager.py`): auto-detects black/isort/prettier/gofmt/rustfmt/clang-format/shfmt and formats by file type.

---

## 20. Database Schema

**Source**: `schema.sql` (PostgreSQL 16); ORM models in `core/db/`

Tables:
- **users** — `id, email (unique), password_hash, display_name, role, failed_login_attempts, locked_until, is_active, email_verified, created_at, is_deleted`
- **projects** — `id, user_id, title, workspace_path, pinned, domain_id, created_at, is_deleted`
- **conversations** — `id, project_id, user_id, title, mode (cli|web|slack), status, working_directory, created_at, is_deleted`
- **messages** — `id, conversation_id, role (user|assistant|tool), mode, blocks (JSON), created_at, is_deleted`
- **artifacts** — `id, conversation_id, project_id, type, title, payload_ref, preview (JSON), pinned, created_at, is_deleted`
- **pending_reviews** — `id, request_id (unique), kind, session_id, user_id, request_data (JSON), resolved, response_data (JSON), created_at`

Async repositories (SQLAlchemy `AsyncSession`) for conversations/messages/users; auto-provisions a default user/project on first session.

---

## 21. Authentication

**Source**: `core/auth/` (`user_store.py`, `pg_user_store.py`, `credentials.py`)

- **UserStore** (JSON, `~/.atria/users.json`) and **PgUserStore** (async PostgreSQL) — both expose `get_by_email/username/id`, `create_user`, `update_user`. Passwords hashed with bcrypt (`passlib`).
- **CredentialStore** (`credentials.py`): secure `~/.atria/auth.json` (mode 0600) for API keys / OAuth tokens; **env var takes priority** over stored values (e.g., `OPENAI_API_KEY`); atomic temp-file writes.
- **Web auth**: signed-cookie tokens (`itsdangerous`), FastAPI dependency `require_authenticated_user()`, falling back to an anonymous local user when no token is present.

---

## 22. Personas (Agent Customization)

**Source**: `core/personas/` (`manager.py`)

Personas let users swap the agent's behavior by name without touching config. A `Persona` is a named system prompt (`{name, system_prompt, is_built_in, created_at}`) persisted as JSON in `~/.atria/personas/*.json`.

- **`PersonaManager`** CRUD: `list_personas()`, `get_persona(name)`, `save_persona()`, `delete_persona()`, `duplicate_persona(source, new_name)`.
- All file access is **path-traversal guarded** (resolved paths must stay inside the personas dir).
- Complements the existing custom-agent loading in `ConfigManager` (§4): personas customize the *main* agent's voice/behavior; custom agents define additional subagents.

---

## 23. Built-in Skill Pipelines

**Source**: `skills/builtin/` — each skill is a folder with a `SKILL.md` manifest (`tools: tools.py`) whose `register(ctx)` returns `ToolSpec`s wired into the tool registry (§9, §19). These are full multi-stage pipelines, not single calls. They run in the background and stream **artifacts** (charts, PDFs, reports) to the UI as they complete.

### `deep_research` — multi-source research report
- **Tools**: `deep_research(topic=...)`, `get_research_status(job_id=...)`.
- **Flow**: generate a **MECE taxonomy** of the topic → **pause for user review/acceptance** → background pipeline synthesizes report sections in parallel, streaming each as it finishes → final report saved as Markdown.
- Internals: `engine.py`, `pipeline.py`, `taxonomy.py`, `synthesis.py`, `jobs.py`, `persistence.py`, `schemas.py`, `prompts.py`.
- For simple factual lookups, the agent is instructed to use `web_search` instead.

### `deep_analyze` — tabular data analysis (CSV/XLSX → PDF)
- **Tools**: `deep_analyze(file_path=...)` → `job_id`; `get_analyze_status(job_id=...)`; `cancel_analyze(job_id=...)`.
- **Flow**: resolve/validate the file → **schema profiling** → derive **sub-tables** → generate **charts** → synthesize **insights** → render a **PDF report** (`report.pdf`). Charts and the PDF stream as artifacts automatically.
- The agent must **not** run ad-hoc `bash`/`python` on the data file, nor call `chart`/`md_to_pdf` directly — those are internal to the pipeline.
- Internals: `dataloader.py`, `profiler.py`, `explore.py`, `planning.py`, `pipeline.py`, `engine.py`, `synthesis.py`, `validation.py`, `persistence.py`, `jobs.py`, `schemas.py`, plus a test suite under `tests/`.

### `domain_enrich` — domain grounding before specialized tasks
- **Tool**: `domain_enrich(topic=..., context=...)`.
- **Flow**: web search + LLM synthesis → writes a **`DOMAIN_SKILL.md`** artifact to the working directory and returns a short `summary`. The agent reads it to ground terminology, methods, and recommendations before domain-specific work (data analysis, unfamiliar libraries/APIs, finance, medicine, game mechanics, etc.).
- **Two-step grounding** is reinforced by a dedicated system-prompt section `templates/system/main/domain-enrichment.md`: skim the user's data/instructions first, then call `domain_enrich` with an informed topic + context. One call per domain per session (reuse the existing `DOMAIN_SKILL.md` afterward).
- Internals: `engine.py`, `search.py`, `tools.py`.

---

## 24. @Mention File Injection & Artifacts

### @mention file injection — `repl/file_content_injector.py`
When a user message references files with `@`, the **`FileContentInjector`** expands them into structured, XML-tagged context before the LLM call, returning an `InjectionResult{text_content, image_blocks, errors}`:
- **Text files** → `<file_content>`; **large files** → head/tail `<file_truncated>`; **directories** → `<directory_listing>` tree; **PDFs** → extracted `<pdf_content>`.
- **Images** → base64 **multimodal blocks** for vision models (routed to the VLM model, §5/§8).
- Failed references are collected as `errors` rather than aborting the turn.

### Artifacts subsystem
Artifacts are generated/uploaded files (images, code, reports, charts, PDFs) tracked in the `artifacts` table (§20) via `db/repositories/artifact_repo.py` and `models/artifact.py`, scoped to a **conversation** or a **project**.
- The agent discovers and reads them through the `list_artifact_images` / `read_artifact_image` tools (§9), enforcing supported formats (PNG/JPG/GIF/WebP/SVG), a 10 MB size cap, and path-traversal protection.
- Pipeline skills (§23) and tools like `chart`, `md_to_pdf`, and `send_image`/`send_data` emit artifacts that stream to the web UI's artifact viewer (§16) in real time.

---

## Appendix — Key Flows at a Glance

**Single request (TUI/CLI)**: user message → ContextPicker assembles context → ReAct loop (LLM → tools → observe) with approvals → compaction if needed → reflect/curate playbook → persist session + snapshot.

**Subagent task**: main agent calls `spawn_subagent` → SubagentStart hook → (Docker or local) nested ReAct with filtered tools → result returned → SubagentStop hook.

**Web request**: `POST /api/chat/query` (202) → agent runs in ThreadPoolExecutor → WS broadcasts (`tool_call`/`tool_result`/`approval_required`/`message_chunk`) → Zustand store updates → React re-renders; approvals/ask-user/plan handled via WS round-trips.

**Context compaction**: token monitor crosses 70/80/85/90/99% → warn → mask → prune → aggressive mask → LLM summarize + archive + artifact index.
