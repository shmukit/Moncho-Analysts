# Moncho Analyst Workbench — Agent Routing

## Environment (required)

Every analyst needs a `.env` in the repo root (never commit it). Minimum for submit + reference sync:

```bash
MONCHO_API_URL="https://app.moncho.ai"
MONCHO_AUTH_TOKEN="your_api_key_from_dashboard"   # Analyst Dashboard → Workbench Access
```

`MONCHO_AUTH_TOKEN` is **required** for `npm run submit`, authenticated reference fallback, and discovery MCP. Copy it from [Analyst Dashboard → Workbench Access](https://app.moncho.ai/analyst/dashboard).

Optional for discovery / agentic QA: `TAVILY_API_KEY`, `EXA_API_KEY`, `LOGO_DEV_API_KEY`, `ANTHROPIC_API_KEY` (see `README.md`).

## Git branches (required)

- **Never commit or push directly to `main`.**
- Create a branch from latest `main`, then open a PR.
- **Naming:** `<type>/<short-kebab-description>` — lowercase, hyphens only.
  - `feat/` — new capability (e.g. `feat/analyst-discovery-mcp`, `feat/qa-agent`)
  - `fix/` — bugfix
  - `docs/` — documentation only
- Avoid personal or vague names (`sami`, `qaagent`, `my-branch`).

**GitHub Desktop:** Current Branch → New Branch → e.g. `feat/edtech-harvest-jan` from `main`. Short walkthrough: [Managing branches in GitHub Desktop](https://docs.github.com/en/desktop/contributing-and-collaborating-using-github-desktop/managing-branches) (includes video).

## Analyst agent (discovery & extraction)

**Read:** `instructions.md` → `analyst_instructions.md` → `skills/`

**Produce:** JSON in `data/pending/` matching `samples/`

**Tools:**
- `scripts/extraction/fetch-reference-data.ts`
- `scripts/extraction/run-discovery-agent.ts`
- `scripts/extraction/scrape-directory.ts`
- `scripts/extraction/csv-to-json-converter.ts`
- `scripts/extraction/enrich-organization-data.ts`

## QA agent (Data Operations)

**Read:** `.cursor/rules/qa-reviewer.md` → `SCORING_STANDARDS.md`

**Run before every submit:**
```bash
npx tsx scripts/utils/validate-analyst-data.ts data/pending/<file>.json --type organization
npx tsx scripts/qa_agent.ts --file data/pending/<file>.json --type organization --deep-check
```

**Bulk / millions-scale:**
```bash
npm run qa:batch -- --dir data/incoming --type organization --concurrency 50
npm run qa:batch -- --file huge.json --chunk-size 10000 --deep-check --sample-rate 0.05 --only-flagged
```

## Submit agent

**Mechanical QA must pass first** (no FAIL records in the mechanical report):

```bash
npx tsx scripts/utils/validate-analyst-data.ts data/pending/<file>.json --type organization
npm run submit -- --file data/pending/<file>.json --type organization
```

`submit_data.ts` auto-runs **Stage 1 mechanical QA** (`validate-analyst-data.ts` → `qa_reviewer.ts`) before POSTing. Submit is blocked when any record **FAIL**s. **FLAGGED** records are allowed through but should be reviewed.

For the **full pipeline** (Stage 2 deep-check + unified report), run manually before submit when the quality bar matters:

```bash
npx tsx scripts/qa_agent.ts --file data/pending/<file>.json --type organization --deep-check
```

`--skip-qa` bypasses the mechanical gate (admin emergency only).
