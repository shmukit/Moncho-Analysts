# Moncho Analyst Workbench

Welcome to the Moncho Analyst Workbench. This repository contains the tools and instructions required for discovering and submitting market intelligence data to Moncho.ai.

## Repository layout

**Root (start here)**
- `README.md`, `AGENTS.md`, `instructions.md`, `analyst_instructions.md` — agent entry points
- `.cursorrules` / `.cursor/rules/` — IDE contracts (submit gate, QA, discovery)
- `skills/`, `samples/`, `roles/`, `scripts/`, `data/`, `test/`

**Docs** — see [`docs/README.md`](docs/README.md)
- `docs/onboarding/` — handbook, ICT grant, sectors, dashboard, MCP setup
- `docs/reference/` — schema, scoring, product rubrics, IDE agent mistakes
- `docs/discovery/` — discovery MCP guide

## ICT Division grant — contract analysts (3 months)

If you are joining as **Data Ops** or **GTM Ops** on the Bangladesh ICT grant, start here:

1. [`docs/onboarding/ICT_GRANT_ONBOARDING.md`](docs/onboarding/ICT_GRANT_ONBOARDING.md) — shared onboarding steps
2. [`docs/onboarding/GRANT_TEN_SECTORS.md`](docs/onboarding/GRANT_TEN_SECTORS.md) — **10 grant sectors** and Moncho slugs
3. [`docs/reference/DATABASE_SCHEMA_OVERVIEW.md`](docs/reference/DATABASE_SCHEMA_OVERVIEW.md) — tables and JSON shapes
4. [`roles/DATA_OPS_ONBOARDING.md`](roles/DATA_OPS_ONBOARDING.md) or [`roles/GTM_OPS_ONBOARDING.md`](roles/GTM_OPS_ONBOARDING.md)
5. [`roles/TWO_MONTH_PLAN_TEMPLATE.md`](roles/TWO_MONTH_PLAN_TEMPLATE.md) — submit after discovery; founder approves
6. [`docs/discovery/ANALYST_DISCOVERY_MCP.md`](docs/discovery/ANALYST_DISCOVERY_MCP.md) — **IDE discovery MCP**
7. [`docs/onboarding/MCP_SETUP_AFTER_MERGE.md`](docs/onboarding/MCP_SETUP_AFTER_MERGE.md) — post-merge MCP setup

Grant KPIs and deeper engineering docs stay with the founder. Use this workbench for day-to-day instructions.

## Tools and pipeline

- `scripts/utils/validate-analyst-data.ts` — mechanical QA (required before submit)
- `scripts/qa_agent.ts`, `scripts/qa_reviewer.ts`, `scripts/deep_fact_check.ts` — QA pipeline
- `scripts/submit_data.ts` — submit JSON (QA-gated)
- `scripts/extraction/`, `scripts/discovery/` — discovery helpers
- `skills/validation_submission.md` — submit ritual for IDE agents
- `samples/` — JSON schemas for Organizations, Products, Landscapes, Experts

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
1. **Agent context**: Have your IDE agent read `instructions.md`, `README.md`, `docs/reference/IDE_AGENT_MISTAKES.md`, `analyst_instructions.md`, `skills/validation_submission.md`, and `samples/` so it understands schemas and the QA gate.
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
1. **Data Review**: Log in to the [Analyst Dashboard](https://app.moncho.ai/analyst/dashboard) to review, curate, and edit existing data (see the [Dashboard Walkthrough](docs/onboarding/DASHBOARD_WALKTHROUGH.md) for details).
2. **Data Input**: Use this workbench to research and input new data via the API.
