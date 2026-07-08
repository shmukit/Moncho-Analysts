# Moncho Analyst Workbench

Welcome to the Moncho Analyst Workbench. This repository contains the tools and instructions required for discovering and submitting market intelligence data to Moncho.ai.

## ICT Division grant — contract analysts (3 months)

If you are joining as **Data Ops** or **GTM Ops** on the Bangladesh ICT grant, start here:

1. [`ICT_GRANT_ONBOARDING.md`](ICT_GRANT_ONBOARDING.md) — shared onboarding steps
2. [`GRANT_TEN_SECTORS.md`](GRANT_TEN_SECTORS.md) — **10 grant sectors** and Moncho slugs
3. [`DATABASE_SCHEMA_OVERVIEW.md`](DATABASE_SCHEMA_OVERVIEW.md) — tables and JSON shapes
4. [`roles/DATA_OPS_ONBOARDING.md`](roles/DATA_OPS_ONBOARDING.md) or [`roles/GTM_OPS_ONBOARDING.md`](roles/GTM_OPS_ONBOARDING.md)
5. [`roles/TWO_MONTH_PLAN_TEMPLATE.md`](roles/TWO_MONTH_PLAN_TEMPLATE.md) — submit after discovery; founder approves

Grant KPIs and deeper engineering docs stay with the founder. Use this workbench for day-to-day instructions.

## Repository Contents
- `HANDBOOK.md`: Onboarding guide and operating manual.
- `DATABASE_SCHEMA_OVERVIEW.md`: Analyst-facing DB tables and JSON shapes (ICT grant).
- `SCORING_STANDARDS.md`: Organization quality rubric (1–5 dimensions).
- `DASHBOARD_WALKTHROUGH.md`: Comprehensive walkthrough of the [Analyst Dashboard](https://app.moncho.ai/analyst/dashboard).
- `instructions.md`: **Read first** — IDE agent entry point and workflow map.
- `analyst_instructions.md`: Role, extraction rules, discovery workflow.
- `scripts/utils/validate-analyst-data.ts`: Canonical validation (handbook path).
- `scripts/submit_data.ts`: Submit JSON to Moncho API (QA-gated).
- `scripts/extraction/`: Discovery, CSV, PDF, enrichment tools.
- `skills/`: Analyst skill pack:
  - `research_strategy.md` – how to plan discovery and search.
  - `extraction_logic.md` – how to extract and format JSON.
  - `taxonomy_mapping.md` – how to map sectors/segments using reference taxonomy.
  - `pdf_parsing.md` – how PDF → tables integration works and when to request it.
  - `extraction_toolkit.md` – which extraction script to use (PDF, directory, CSV, discovery, enrichment).
  - `validation_submission.md` – how to validate data and submit change requests safely.
- `samples/`: JSON schemas for Organizations, Products, Landscapes, Experts.
- `.cursorrules`: IDE system rules (analyst + QA).

## Setup
0. **Activate analyst access** at [app.moncho.ai/analyst/apply](https://app.moncho.ai/analyst/apply) (one click, no application wait).
1. **Clone this repository** (or download the zip).
2. **Install dependencies**:
   ```bash
   npm install ts-node typescript
   ```
3. **Configure Environment**  
   Create a `.env` file in the repo root (do not commit it). Add the following variables for APIs used by the discovery workflow:

   **Moncho API** (required for submission):
   ```bash
   MONCHO_API_URL="https://app.moncho.ai"
   MONCHO_AUTH_TOKEN="your_copied_api_key_here" # copy from Analyst Dashboard → Workbench Access (see Walkthrough: DASHBOARD_WALKTHROUGH.md#3-managing-workbench-access-api-keys)
   ```

   **Discovery & enrichment APIs** (required for the IDE agent’s discovery workflow):
   ```bash
   # Tavily – web search for discovering organizations and content
   TAVILY_API_KEY="your_tavily_api_key"

   # Exa – semantic search for companies, reports, and products
   EXA_API_KEY="your_exa_api_key"

   # Logo.dev – fetch organization/product logo URLs by domain
   LOGO_DEV_API_KEY="your_logo_dev_api_key"
   ```

   Get API keys from: [Tavily](https://tavily.com), [Exa](https://exa.ai), [Logo.dev](https://logo.dev). Keep `.env` in `.gitignore`.

## Workflow
1. **Agent context**: Have your IDE agent read `README.md`, `analyst_instructions.md`, and the `skills/` and `samples/` files so it understands context, intent, and schemas.
2. **Discovery** (see `analyst_instructions.md`): Discover orgs → select top by scoring rubrics → fetch logos (Logo.dev) → discover products → select top products → fetch product URLs.
3. **Generate**: Ask the agent to generate a JSON file matching the format in `samples/`.
4. **Validate**: Ensure the JSON is valid and accurate.
5. **Validate** (handbook path):
   ```bash
   npx tsx scripts/utils/validate-analyst-data.ts data/pending/your-file.json --type organization
   ```
6. **QA Review** (full pipeline):
   ```bash
   npm install
   npx tsx scripts/qa_agent.ts --file data/pending/your-file.json --type organization
   npx tsx scripts/qa_agent.ts --file data/pending/your-file.json --type organization --deep-check
   ```
   Reports are written to `data/qa-reports/`. Fix any `FAIL` records before submitting.
7. **Submit**:
   ```bash
   npm run submit -- --file data/pending/your_output.json --type organization
   ```

## QA Agent Pipeline (Version 3)

Full two-stage automated QA per `MonchoQAAgent/Version3/README.md`:

| Stage | Script | What it does |
|-------|--------|--------------|
| 1 — Mechanical | `scripts/qa_reviewer.ts` | Schema, URLs, duplicates, slugs, **exact landscape/expert ID validation** |
| 2 — Agentic | `scripts/deep_fact_check.ts` | Tavily/Exa search + Anthropic LLM entailment on rationales |
| Orchestrator | `scripts/qa_agent.ts` | Runs both stages + **unified report** + executive summary |

**Reference ID enforcement** (never guess sector/segment IDs):
- `data/reference/valid-sector-ids.json`
- `data/reference/valid-segment-ids.json`

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

**Reports in `data/qa-reports/`:**
- `*-qa-report.json` — mechanical PASS/FLAGGED/FAIL
- `*-factcheck-report.json` — per-claim ai_verified / requires_human_review
- `*-unified-qa-report.json` — **merged per-record final status**
- `*-executive-summary.json` — what to do next

   **Submission format rules**:
   - You may send **one organization object** or an **array of organization objects**; the script will submit each object as a separate change request.
   - For **new** organizations, **omit** the `id` field (the system will generate one). For **updates**, include the existing organization `id` from the database.
   - Keep field names exactly as in `samples/organization_sample.json`; optional fields can be omitted.

## Task Types
1. **Data Review**: Log in to the [Analyst Dashboard](https://app.moncho.ai/analyst/dashboard) to review, curate, and edit existing data (see the [Dashboard Walkthrough](DASHBOARD_WALKTHROUGH.md) for details).
2. **Data Input**: Use this workbench to research and input new data via the API.
