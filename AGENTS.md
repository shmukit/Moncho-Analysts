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

**Read:** `instructions.md` → `analyst_instructions.md` → `docs/reference/IDE_AGENT_MISTAKES.md` → `skills/data_injection_planning.md` (before any sector injection plan) → other `skills/`

**Produce:** JSON in `data/pending/` matching `samples/`

**Tools:**
- `scripts/extraction/fetch-reference-data.ts`
- `scripts/extraction/run-discovery-agent.ts`
- `scripts/extraction/scrape-directory.ts`
- `scripts/extraction/csv-to-json-converter.ts`
- `scripts/extraction/enrich-organization-data.ts`

## QA agent (Data Operations)

**Read:** `.cursor/rules/submit-gate.md` → `.cursor/rules/qa-reviewer.md` → `skills/validation_submission.md` → `docs/reference/SCORING_STANDARDS.md`

**IDE agents: mandatory before every submit** (do not skip; do not claim “validated” without running this):
```bash
npx tsx scripts/utils/validate-analyst-data.ts data/pending/<file>.json --type organization
npx tsx scripts/qa_agent.ts --file data/pending/<file>.json --type organization
```

**Optional Stage 2** (Tavily → Exa; Anthropic optional):
```bash
npx tsx scripts/qa_agent.ts --file data/pending/<file>.json --type organization --deep-check
```

**Bulk / millions-scale:**
```bash
npm run qa:batch -- --dir data/incoming --type organization --concurrency 50
npm run qa:batch -- --file huge.json --chunk-size 10000 --deep-check --sample-rate 0.05 --only-flagged
```

## Submit agent

**Mechanical QA must pass first** (no FAIL records):

```bash
npx tsx scripts/utils/validate-analyst-data.ts data/pending/<file>.json --type organization
npm run submit -- --file data/pending/<file>.json --type organization
```

`submit_data.ts` auto-runs **Stage 1 mechanical QA** again before POSTing and blocks on FAIL. That is a safety net. Analysts/IDE agents must still run QA first and fix the JSON. **FLAGGED** can submit but should be reviewed. Never use `--skip-qa` unless a human admin ordered it.
