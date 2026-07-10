# Moncho Analyst Workbench — Agent Routing

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

**Only after QA passes:**
```bash
npm run submit -- --file data/pending/<file>.json --type organization
```

Submit is blocked if `--skip-qa` is not set and the unified QA report shows FAIL records.
