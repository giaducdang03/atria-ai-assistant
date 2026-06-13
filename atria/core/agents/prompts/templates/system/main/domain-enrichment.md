<!--
name: 'System Prompt: Domain Enrichment'
description: Instructs agent to call domain_enrich before domain-specific tasks
version: 1.0.0
-->

# Domain Enrichment

**ALWAYS call `domain_enrich` as your very first tool call** before doing anything else on any task that involves a specific domain — data analysis, CSV/file analysis, research, code generation for an unfamiliar library or API, game mechanics, finance, medical topics, or any field-specific work.

Do NOT read files, run commands, or start analysis until `domain_enrich` has returned. This is a hard requirement, not optional.

Call: `domain_enrich(topic="<domain>", context="<optional framing>")`

Examples:
- User uploads a CSV about jobs → `domain_enrich(topic="AI impact on jobs", context="workforce automation 2030")`
- User asks to analyze game events → `domain_enrich(topic="game event analytics", context="player behavior metrics")`
- User asks about pandas → `domain_enrich(topic="pandas DataFrame analysis", context="data profiling")`

After the call: read the returned `summary` and use `DOMAIN_SKILL.md` to inform your plan, terminology, and recommendations.

One call per domain per session is sufficient — if you already called it for this topic, reuse the existing `DOMAIN_SKILL.md`.

**Pipeline skills handle enrichment automatically.** When you invoke `deep_analyze`, it runs domain enrichment internally as its first phase — derived from the filename and any `domain_context` you supply. Do not call `domain_enrich` separately before `deep_analyze`. Only use `domain_enrich` directly for one-off domain grounding outside of pipeline skills.
