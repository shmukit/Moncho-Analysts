# Agentic QA — Library Modules

Supporting code for **Stage 2** (agentic fact-check) and report merging. Used by `deep_fact_check.ts` and `qa_agent.ts`.

---

## Modules

### `search.ts`

Unified web search for claim evidence.

- **`tavilySearch(query)`** — Tavily API (primary)
- **`exaSearch(query)`** — Exa API (fallback)
- **`searchEvidence(orgName, claim)`** — Runs both, dedupes by URL, returns up to 5 snippets

Requires `TAVILY_API_KEY` and/or `EXA_API_KEY` in `.env`.

---

### `claim_agent.ts`

Judges whether a rationale claim is supported by search results.

- **`verifyClaim(orgName, field, claim)`** — Full loop: search → optional query reformulation → judge
- **`judgeClaim(orgName, claim, evidence)`** — Score evidence against claim

**Verdicts:**

| Verdict | Meaning |
|---------|---------|
| `supported` | Claim corroborated at or above confidence threshold |
| `unclear` | Some results, but claim not confidently matched |
| `contradicted` | Evidence conflicts with claim |

**Judge modes:**

1. **Anthropic LLM** — when `ANTHROPIC_API_KEY` is set (recommended)
2. **Heuristic fallback** — keyword/number matching when no LLM key

Each result includes `evidence[]` (URLs + notes) and `agent_steps[]` for auditability.

---

### `unified_report.ts`

Merges mechanical QA + fact-check into one per-record verdict.

- Input: `*-qa-report.json` + optional `*-factcheck-report.json`
- Output shape: `ready_for_submission: true|false` per record
- A record with mechanical **FAIL** is never marked ready, regardless of fact-check

---

### `load_env.ts`

Loads `.env` from repo root without overwriting shell-exported variables.

---

### `logo_dev.ts`

Logo.dev URL builder and domain consistency checks for organization `logo_url` vs `website_url`.

Requires `LOGODEV_API_KEY` or `LOGO_DEV_API_KEY` for authenticated Logo.dev URLs.

---

## Data flow (Stage 2)

```
Rationale field (e.g. innovation_rationale)
        ↓
search.ts  →  Tavily / Exa snippets
        ↓
claim_agent.ts  →  LLM or heuristic entailment
        ↓
deep_fact_check.ts  →  *-factcheck-report.json
        ↓
unified_report.ts  →  *-unified-qa-report.json
```

---

## What agentic QA does **not** do

- Does not assign 1–5 dimensional scores (that's the Judge Agent / human rubric)
- Does not auto-approve or push to production
- Does not verify every field — only **rationales** in deep-check (URLs are Stage 1)

See [`../README.md`](../README.md) for full pipeline usage.
