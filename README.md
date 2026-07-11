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
- `IDE_AGENT_MISTAKES.md`: **Living mistakes registry for IDE agents** — wrong patterns, symptoms, correct approach, examples. Skim before discovery/submit; append after rejected change requests.
- `DATABASE_SCHEMA_OVERVIEW.md`: Analyst-facing DB tables and JSON shapes (ICT grant).
- `SCORING_STANDARDS.md`: Universal organization quality rubric (1–5 dimensions).
- `PRODUCT_ORG_RUBRICS.md`: Production-system rubric reference — universal org rubric, product pass/fail gate, normalization units, and sector depth scoring already used in Moncho.
- `DASHBOARD_WALKTHROUGH.md`: Comprehensive walkthrough of the [Analyst Dashboard](https://app.moncho.ai/analyst/dashboard).
- `instructions.md`: Core system prompt and guidelines for your AI agent.
- `skills/`: Analyst skill pack:
  - `research_strategy.md` – how to plan discovery and search.
  - `extraction_logic.md` – how to extract and format JSON.
  - `taxonomy_mapping.md` – how to map sectors/segments using reference taxonomy.
  - `pdf_parsing.md` – how PDF → tables integration works and when to request it.
  - `extraction_toolkit.md` – which extraction script to use (PDF, directory, CSV, discovery, enrichment).
  - `validation_submission.md` – how to validate data and submit change requests safely.
- `scripts/submit_data.ts`: Utility to submit your JSON output to the Moncho API.
- `scripts/discovery/`: MCP fallback CLIs (`lookup.ts`, `check-duplicate.ts`) — see [`ANALYST_DISCOVERY_MCP.md`](ANALYST_DISCOVERY_MCP.md).
- `samples/`: Standardized JSON formats for Organizations, Landscapes, and Experts.
- `.cursorrules` / `.antigravityrules`: Pre-configured rules for your IDE to follow.

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
1. **Agent context**: Have your IDE agent read `README.md`, `IDE_AGENT_MISTAKES.md`, `analyst_instructions.md`, and the `skills/` and `samples/` files so it understands context, intent, and schemas.
2. **Discovery** (see `analyst_instructions.md`): Discover orgs → select top by scoring rubrics → fetch logos (Logo.dev) → discover products → select top products → fetch product URLs.
3. **Generate**: Ask the agent to generate a JSON file matching the format in `samples/`.
4. **Validate**: Ensure the JSON is valid and accurate.
5. **Submit**:
   ```bash
   npx ts-node scripts/submit_data.ts --file your_output.json --type organization
   ```

   **Submission format rules**:
   - You may send **one organization object** or an **array of organization objects**; the script will submit each object as a separate change request.
   - For **new** organizations, **omit** the `id` field (the system will generate one). For **updates**, include the existing organization `id` from the database.
   - Keep field names exactly as in `samples/organization_sample.json`; optional fields can be omitted.

## Task Types
1. **Data Review**: Log in to the [Analyst Dashboard](https://app.moncho.ai/analyst/dashboard) to review, curate, and edit existing data (see the [Dashboard Walkthrough](DASHBOARD_WALKTHROUGH.md) for details).
2. **Data Input**: Use this workbench to research and input new data via the API.
