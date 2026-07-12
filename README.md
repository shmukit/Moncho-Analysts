# Moncho Analyst Workbench

Welcome to the Moncho Analyst Workbench. This repository contains the tools and instructions required for discovering and submitting market intelligence data to Moncho.ai.

## ICT Division grant — contract analysts (3 months)

If you are joining as **Data Ops** or **GTM Ops** on the Bangladesh ICT grant, start here:

1. [`ICT_GRANT_ONBOARDING.md`](ICT_GRANT_ONBOARDING.md) — shared onboarding steps
2. [`GRANT_TEN_SECTORS.md`](GRANT_TEN_SECTORS.md) — **10 grant sectors** and Moncho slugs
3. [`DATABASE_SCHEMA_OVERVIEW.md`](DATABASE_SCHEMA_OVERVIEW.md) — tables and JSON shapes
4. [`roles/DATA_OPS_ONBOARDING.md`](roles/DATA_OPS_ONBOARDING.md) or [`roles/GTM_OPS_ONBOARDING.md`](roles/GTM_OPS_ONBOARDING.md)
5. [`roles/TWO_MONTH_PLAN_TEMPLATE.md`](roles/TWO_MONTH_PLAN_TEMPLATE.md) — submit after discovery; founder approves
6. [`ANALYST_DISCOVERY_MCP.md`](ANALYST_DISCOVERY_MCP.md) — **IDE discovery MCP** (coverage, duplicates, market_facts)
7. [`MCP_SETUP_AFTER_MERGE.md`](MCP_SETUP_AFTER_MERGE.md) — **post-merge MCP setup** (send to analysts after workbench merge)

Grant KPIs and deeper engineering docs stay with the founder. Use this workbench for day-to-day instructions.

## Repository Contents
- `HANDBOOK.md`: Onboarding guide and operating manual.
- `DATABASE_SCHEMA_OVERVIEW.md`: Analyst-facing DB tables and JSON shapes (ICT grant).
- `SCORING_STANDARDS.md`: Universal organization quality rubric (1–5 dimensions).
- `PRODUCT_ORG_RUBRICS.md`: Production-system rubric reference — universal org rubric, product pass/fail gate, normalization units, and sector depth scoring already used in Moncho.
- `DASHBOARD_WALKTHROUGH.md`: Comprehensive walkthrough of the [Analyst Dashboard](https://app.moncho.ai/analyst/dashboard).
- `instructions.md`: **Read first** — IDE agent entry point and workflow map.
- `analyst_instructions.md`: Role, extraction rules, discovery workflow.
- `scripts/utils/validate-analyst-data.ts`: Canonical validation (handbook path).
- `scripts/submit_data.ts`: Submit JSON to Moncho API (QA-gated).
- `scripts/extraction/`: Discovery, CSV, PDF, enrichment tools.
- `scripts/discovery/`: MCP fallback CLIs (`lookup.ts`, `check-duplicate.ts`) — see [`ANALYST_DISCOVERY_MCP.md`](ANALYST_DISCOVERY_MCP.md).
- `scripts/qa_agent.ts`, `scripts/qa_reviewer.ts`, `scripts/deep_fact_check.ts`: Two-stage automated QA pipeline.
- `skills/`: Analyst skill pack:
  - `research_strategy.md` – how to plan discovery and search.
  - `extraction_logic.md` – how to extract and format JSON.
  - `taxonomy_mapping.md` – how to map sectors/segments using reference taxonomy.
  - `pdf_parsing.md` – how PDF → tables integration works and when to request it.
  - `extraction_toolkit.md` – which extraction script to use (PDF, directory, CSV, discovery, enrichment).
  - `validation_submission.md` – how to validate data and submit change requests safely.
- `samples/`: JSON schemas for Organizations, Products, Landscapes, Experts.
- `.cursor/rules/`: IDE agent contracts (`submit-gate.md`, `qa-reviewer.md`, `discovery-analyst.md`).
- `.cursorrules` / `.antigravityrules`: Pre-configured rules for your IDE to follow.

## Setup
0. **Activate analyst access** at [app.moncho.ai/analyst/apply](https://app.moncho.ai/analyst/apply) (one click, no application wait).
1. **Clone this repository** (or download the zip).
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**  
   Create a `.env` file in the repo root (do not commit it). Add the following variables:

   **Moncho API** (required for submission):
   ```bash
   MONCHO_API_URL="https://app.moncho.ai"
   MONCHO_AUTH_TOKEN="your_copied_api_key_here" # copy from Analyst Dashboard → Workbench Access (see Walkthrough: DASHBOARD_WALKTHROUGH.md#3-managing-workbench-access-api-keys)
   ```

   **Discovery & enrichment APIs** (required for the IDE agent's discovery workflow):
   ```bash
   # Tavily – web search for discovering organizations and content
   TAVILY_API_KEY="your_tavily_api_key"

   # Exa – semantic search for companies, reports, and products
   EXA_API_KEY="your_exa_api_key"

   # Logo.dev – fetch organization/product logo URLs by domain
   LOGO_DEV_API_KEY="your_logo_dev_api_key"
   ```

   **Agentic QA (Stage 2 deep fact-check)** — required only when running `--deep-check`:
   ```bash
   # Anthropic – LLM entailment on rationale claims (uses Tavily/Exa for search)
   ANTHROPIC_API_KEY="your_anthropic_api_key"
   ```

   Get API keys from: [Tavily](https://tavily.com), [Exa](https://exa.ai), [Logo.dev](https://logo.dev), [Anthropic](https://console.anthropic.com). Keep `.env` in `.gitignore`.

4. **Sync reference taxonomy IDs** (required once per clone, and after taxonomy changes):
   ```bash
   npm run reference:sync
   ```
   This writes `data/reference/valid-sector-ids.json` and `valid-segment-ids.json` from the live Moncho API. QA uses these to catch guessed sector/segment IDs.

## Workflow
1. **Agent context**: Have your IDE agent read `instructions.md`, `README.md`, `analyst_instructions.md`, `skills/validation_submission.md`, and `samples/` so it understands schemas and the QA gate.
2. **Discovery** (see `analyst_instructions.md`): Discover orgs → select top by scoring rubrics → fetch logos (Logo.dev) → discover products → select top products → fetch product URLs.
3. **Generate**: Ask the agent to write JSON under `data/pending/` matching `samples/`.
4. **QA (required for humans and IDE agents)**:
   ```bash
   npx tsx scripts/utils/validate-analyst-data.ts data/pending/your-file.json --type organization
   npx tsx scripts/qa_agent.ts --file data/pending/your-file.json --type organization
   ```
   Optional deep fact-check (Tavily/Exa): add `--deep-check` to `qa_agent.ts`.
   Reports land in `data/qa-reports/` (gitignored). Fix every `FAIL` before submit.
5. **Submit** (re-runs Stage 1 mechanical QA automatically; blocks on FAIL):
   ```bash
   npm run submit -- --file data/pending/your_output.json --type organization
   ```
   Do **not** use `--skip-qa` unless an admin ordered it. Cursor rules: `.cursor/rules/submit-gate.md`.

## QA Agent Pipeline

**Full documentation:** [`scripts/README.md`](scripts/README.md) — agentic QA setup, commands, flags, and scale guidance.  
**QA agent contract:** [`.cursor/rules/qa-reviewer.md`](.cursor/rules/qa-reviewer.md)

| Stage | Script | What it does |
|-------|--------|--------------|
| 1 — Mechanical | `scripts/qa_reviewer.ts` | Schema, URLs, duplicates, slugs, landscape/expert ID validation |
| 2 — Agentic | `scripts/deep_fact_check.ts` | Tavily/Exa search + Anthropic LLM entailment on rationales |
| Orchestrator | `scripts/qa_agent.ts` | Runs both stages + unified report + executive summary |

**Reference ID enforcement** (never guess sector/segment IDs):
- `data/reference/valid-sector-ids.json`
- `data/reference/valid-segment-ids.json`
- Refresh with `npm run reference:sync`

**Run examples:**
```bash
# Organizations — full pipeline
npx tsx scripts/qa_agent.ts --file data/pending/test-batch.json --type organization --deep-check

# Landscape — catches fake UUIDs and guessed IDs
npx tsx scripts/qa_agent.ts --file data/pending/test-landscape-real.json --type landscape

# Expert profiles
npx tsx scripts/qa_agent.ts --file data/pending/test-expert-real.json --type expert

# Cost-controlled deep-check
npx tsx scripts/qa_agent.ts --file data/pending/your-file.json --deep-check --only-flagged --sample-rate 0.2

# Verify agent logic (no API keys)
npm run qa:test
```

**Reports in `data/qa-reports/`** (local only, not committed):
- `*-qa-report.json` — mechanical PASS/FLAGGED/FAIL
- `*-factcheck-report.json` — per-claim ai_verified / requires_human_review
- `*-unified-qa-report.json` — merged per-record final status
- `*-executive-summary.json` — what to do next

**Submission format rules**:
- You may send **one organization object** or an **array of organization objects**; the script will submit each object as a separate change request.
- For **new** organizations, **omit** the `id` field (the system will generate one). For **updates**, include the existing organization `id` from the database.
- Keep field names exactly as in `samples/organization_sample.json`; optional fields can be omitted.

## Task Types
1. **Data Review**: Log in to the [Analyst Dashboard](https://app.moncho.ai/analyst/dashboard) to review, curate, and edit existing data (see the [Dashboard Walkthrough](DASHBOARD_WALKTHROUGH.md) for details).
2. **Data Input**: Use this workbench to research and input new data via the API.
