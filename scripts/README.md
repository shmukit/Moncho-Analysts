# Moncho Agentic QA System

Automated **Data Operations QA** for analyst JSON submissions. This folder contains the live pipeline that reviews organizations, products, landscapes, and experts **before** they reach human reviewers or production.

The system has two stages:

| Stage | Script | What it does |
|-------|--------|--------------|
| **1 — Mechanical** | `qa_reviewer.ts` | Schema, live URL checks, duplicates, slugs, rationale quality, two-source warnings |
| **2 — Agentic** | `deep_fact_check.ts` | Web search (Tavily/Exa) + LLM entailment on rationale claims |
| **Orchestrator** | `qa_agent.ts` | Runs both stages and writes unified + executive reports |
| **Bulk** | `qa_batch.ts` | Scale QA across folders or large chunked JSON files |

See also: [`lib/README.md`](lib/README.md) for agentic internals, [`utils/README.md`](utils/README.md) for the validation entrypoint, and [`../.cursor/rules/qa-reviewer.md`](../.cursor/rules/qa-reviewer.md) for the QA agent contract.

---

## Quick start

From repo root:

```bash
npm install
```

### Single file — mechanical only (fast, no API cost)

```bash
npx tsx scripts/qa_agent.ts --file data/pending/your-file.json --type organization
```

### Single file — full agentic QA

```bash
npx tsx scripts/qa_agent.ts --file data/pending/your-file.json --type organization --deep-check
```

### Handbook validation path (required before submit)

```bash
npx tsx scripts/utils/validate-analyst-data.ts data/pending/your-file.json --type organization
```

### Bulk / large batches

```bash
npm run qa:batch -- --dir data/pending --type organization --concurrency 50
npm run qa:batch -- --file data/pending/huge.json --chunk-size 10000 --deep-check --sample-rate 0.1 --only-flagged
```

### Mock tests (no API keys)

```bash
npm run qa:test
```

---

## Environment variables

Create `.env` in the repo root (never commit it):

```env
# Stage 2 agentic fact-check (search)
TAVILY_API_KEY=...
EXA_API_KEY=...

# Stage 2 LLM judge (recommended)
ANTHROPIC_API_KEY=...

# Submission (separate from QA)
MONCHO_API_URL=https://app.moncho.ai
MONCHO_AUTH_TOKEN=...
```

Stage 1 mechanical QA runs **without** any API keys.

---

## Output

Reports are written to `data/qa-reports/`:

| File | Contents |
|------|----------|
| `*-qa-report.json` | Mechanical PASS / FLAGGED / FAIL per record |
| `*-factcheck-report.json` | Per-claim verdicts (`supported`, `unclear`, `contradicted`) |
| `*-unified-qa-report.json` | Merged `ready_for_submission` per record |
| `*-executive-summary.json` | Recommended next actions |
| `batch-rollup-*.json` | Bulk run summary (`qa_batch.ts`) |

### Status meanings

| Status | Meaning |
|--------|---------|
| **PASS** | Mechanically clean — can proceed (subject to optional deep-check) |
| **FLAGGED** | Fixable issues (missing rationales, two-source warning, etc.) |
| **FAIL** | Hard block — dead URL, duplicate, bad schema, guessed IDs |

Exit code `1` when any record **FAIL**s — this is intentional (submission gate).

---

## `qa_agent.ts` flags

```bash
npx tsx scripts/qa_agent.ts \
  --file data/pending/file.json \
  --type organization|product|landscape|expert|auto \
  --deep-check \
  --only-flagged \
  --sample-rate 0.25 \
  --confidence-threshold 0.75 \
  --concurrency 50 \
  --deep-concurrency 10 \
  --out data/qa-reports/
```

| Flag | Default | Purpose |
|------|---------|---------|
| `--deep-check` | off | Enable Stage 2 agentic fact-check |
| `--only-flagged` | off | Deep-check only FLAGGED mechanical records |
| `--sample-rate` | 1.0 | Fraction of claims to deep-check (use `0.05`–`0.2` at scale) |
| `--confidence-threshold` | 0.75 | Min confidence for `ai_verified` |
| `--concurrency` | 15 | Parallel URL checks (Stage 1) |
| `--deep-concurrency` | 10 | Parallel claim checks (Stage 2) |

---

## Supported record types

| `--type` | Sample schema |
|----------|---------------|
| `organization` | `samples/organization_slug_sample.json` or `organization_sample.json` |
| `product` | `samples/product_sample.json` (bundle: `products` + `product_media`) |
| `landscape` | `samples/landscape_sample.json` |
| `expert` | `samples/expert_sample.json` |

Reference ID lists (never guess IDs):

- `data/reference/valid-sector-ids.json`
- `data/reference/valid-segment-ids.json`
- `data/reference/taxonomy.json`

---

## End-to-end analyst workflow

```
Discover / extract JSON  →  data/pending/
        ↓
validate-analyst-data.ts  (mechanical gate)
        ↓
qa_agent.ts [--deep-check]  (agentic QA)
        ↓
Fix FAIL / review FLAGGED
        ↓
submit_data.ts  (re-runs mechanical QA via validate-analyst-data unless --skip-qa)
```

---

## Scripts in this folder

| File | Role |
|------|------|
| `qa_agent.ts` | **Main entry** — orchestrates full QA pipeline |
| `qa_reviewer.ts` | Stage 1 mechanical reviewer |
| `deep_fact_check.ts` | Stage 2 agentic claim verification |
| `qa_batch.ts` | Bulk / chunked QA for large datasets |
| `submit_data.ts` | Submit change requests (mechanical QA gate) |
| `lib/` | Search, claim judge, unified report builder |
| `utils/` | Canonical validation CLI |
| `extraction/` | Discovery/enrichment tools (see `extraction/README_EXTRACTION.md`) |

---

## Realistic scale expectations

| Layer | Throughput | Cost |
|-------|------------|------|
| **Mechanical QA** | High — URL dedup + 50+ concurrent checks | Free |
| **Agentic deep-check** | Limited — ~1 search + 1 LLM call per claim | API usage |

For millions of records: run mechanical QA on **100%**, deep-check on a **sample** (`--sample-rate 0.05`–`0.1`, `--only-flagged`).

---

## Test fixtures

| File | Expected outcome |
|------|------------------|
| `data/pending/qa-user-test-all-pass.json` | PASS: 3 |
| `data/pending/qa-user-test.json` | Mix of PASS / FLAGGED / FAIL |
| `data/pending/test-batch.json` | Mostly FAIL (intentional) |
