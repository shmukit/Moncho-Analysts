# IDE Agent: Read This First

Before running any workflow, read and use these repo assets so the agent understands context, skills, and intent.

## Required reading (in order)

| Asset | Purpose |
|-------|---------|
| **This file** | Entry point and workflow map |
| [`README.md`](README.md) | Setup, env vars, npm scripts |
| [`analyst_instructions.md`](analyst_instructions.md) | Role, extraction rules, discovery workflow |
| [`HANDBOOK.md`](HANDBOOK.md) | Onboarding, Mission 1, dashboard workflow |
| [`SCORING_STANDARDS.md`](SCORING_STANDARDS.md) | 5-dimension scoring rubrics (1–5) |
| [`skills/`](skills/) | Research, extraction, validation, taxonomy |
| [`samples/`](samples/) | Target JSON schemas — **never invent field names** |
| [`.cursorrules`](.cursorrules) | IDE system rules (analyst + QA) |

## Your role

You are a **Market Intelligence Analyst** for Moncho.ai. Discover, extract, and format high-quality market data (Organizations, Products, Landscapes, Experts) into structured JSON.

## Extraction rules

1. **Schema first** — match exact shapes in `samples/`.
2. **Top-level shape** — one object or an array; submit script batches each object.
3. **Sector/segment IDs** — use exact IDs from reference data (`scripts/extraction/fetch-reference-data.ts`). If unknown, leave `sector_id` / `segment_ids` empty; do not guess `2` or `201`.
4. **Organization type** — optional; only official values (`public`, `private`, `ngo`, etc.).
5. **Record IDs** — omit `id` for new records; include existing `id` for updates.
6. **Source verification** — every data point verified from **at least two sources** (reports, websites, news). Document sources in rationales or `source_urls` when available.
7. **No SQL** — JSON files only.
8. **De-duplication** — check against existing DB export if provided (`data/exports/`).

## Discovery workflow

1. Discover organizations (search: Tavily, Exa, web research).
2. Select top orgs using `SCORING_STANDARDS.md` (score 1–5 per dimension + one-line rationale each).
3. Fetch logo URLs via Logo.dev (`LOGODEV_API_KEY`) using the org's real domain.
4. Discover products per org.
5. Select top products; apply scoring rubrics.
6. Resolve canonical product/page URLs.
7. Extract into `samples/` schemas → validate → submit.

## Standard workflow (IDE agent)

```
Plan → Discovery → Extract JSON → Mechanical QA (required) → optional deep-check → Submit
```

| Step | Command |
|------|---------|
| Reference taxonomy | `npm run reference:sync` (or `fetch-reference-data.ts`) |
| Discovery | `npx tsx scripts/extraction/run-discovery-agent.ts --sector EdTech --location Vietnam` |
| Mechanical QA (required) | `npx tsx scripts/utils/validate-analyst-data.ts data/pending/your-file.json --type organization` |
| Full orchestrator | `npx tsx scripts/qa_agent.ts --file data/pending/your-file.json --type organization` |
| Deep fact-check (optional) | add `--deep-check` (needs Tavily/Exa; Anthropic optional) |
| Bulk QA | `npm run qa:batch -- --dir data/pending --type organization --concurrency 50` |
| Submit (after zero FAIL) | `npm run submit -- --file data/pending/your-file.json --type organization` |

### IDE agent hard rules before submit

1. **Always** run mechanical QA in the terminal and read `data/qa-reports/*-executive-summary.json`.
2. **Never** call `npm run submit` while any record status is `FAIL`.
3. **Never** pass `--skip-qa` unless a human admin ordered it.
4. `npm run submit` re-runs Stage 1 automatically (safety net). You still must QA first so you can fix the file.
5. Follow [`skills/validation_submission.md`](skills/validation_submission.md).

## Organization schemas (two valid formats)

**Slug-based** (handbook / onboarding) — see `samples/organization_slug_sample.json`:
- `sector_slug`, `segment_slugs[]`, `hq_country_slug`
- All **5 rationales** required for Judge Agent

**ID-based** (dashboard) — see `samples/organization_sample.json`:
- `sector_id`, `segment_ids[]`, `country_id`

## Data flow & approvals

- Every submission creates a **Change Request**, not a direct DB entry.
- Senior Analyst reviews → Admin clicks **Apply** → live database.
- Reputation stats update only after final approval.

## QA agent (Data Operations)

The automated QA layer reviews JSON **before** Senior Analyst review in the app:

- **Stage 1 (always / submit gate)** — schema, live URL checks, duplicates, slugs, rationale quality. No Exa/Tavily keys required.
- **Stage 2 (`--deep-check`, optional)** — Tavily first, Exa fallback, optional Anthropic entailment on rationales.

`npm run submit` blocks on Stage 1 FAIL. Analysts and IDE agents must still run QA locally first.

See [`.cursor/rules/qa-reviewer.md`](.cursor/rules/qa-reviewer.md) and [`skills/validation_submission.md`](skills/validation_submission.md).
