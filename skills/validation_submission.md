## Skill: Validation, QA Review & Submission

Use this skill **every time** you are about to submit data. IDE agents must treat QA as mandatory, not optional.

---

### 1. When to use this skill

- After you have a draft JSON file matching one of the `samples/*.json` schemas.
- Before **every** call to `npm run submit` / `scripts/submit_data.ts`.
- When fixing feedback from reviewers about bad fields, missing slugs, or broken URLs.

---

### 2. What happens automatically vs what you must run

| Action | Automatic? | Notes |
|--------|------------|--------|
| Stage 1 mechanical QA on `npm run submit` | **Yes** | `submit_data.ts` calls `validate-analyst-data.ts` → `qa_reviewer.ts`. Blocks if any record **FAIL**s. |
| Running QA in the IDE before submit | **You / IDE agent must do this** | So you can fix FAIL/FLAGGED rows before wasting a submit. |
| Stage 2 deep fact-check (`--deep-check`) | **No** | Optional. Needs `TAVILY_API_KEY` and/or `EXA_API_KEY` (+ optional `ANTHROPIC_API_KEY`). |
| Senior Analyst / Admin approval in the app | Separate | Change requests still go through `/analyst/review`. |

**Never use `--skip-qa`** unless a human admin explicitly told you to.

---

### 3. File shape & naming

- **Top-level shape**: one object or an array of objects. Each object becomes its own change request.
- **Schema**: must follow the matching sample in `samples/`.
- **IDs**: omit `id` for new records; include existing `id` for updates.
- **Naming**: `data/pending/YYYY-MM-DD-topic-YOURNAME.json`

---

### 4. Mandatory QA workflow (run this in the IDE)

```bash
# 1) Mechanical QA (required — no API keys needed)
npx tsx scripts/utils/validate-analyst-data.ts data/pending/your-file.json --type organization

# 2) Full orchestrator (recommended) — same Stage 1 + reports under data/qa-reports/
npx tsx scripts/qa_agent.ts --file data/pending/your-file.json --type organization

# 3) Optional Stage 2 claim fact-check (Tavily → Exa, optional Anthropic)
npx tsx scripts/qa_agent.ts --file data/pending/your-file.json --type organization --deep-check
```

**Statuses:**
- **PASS** — ok to submit (Senior Analyst may still spot-check).
- **FLAGGED** — submit is allowed by the gate, but fix or annotate reasons first when possible.
- **FAIL** — **do not submit**. Fix the JSON and re-run QA until FAIL count is 0.

Reports (gitignored): `data/qa-reports/<basename>-qa-report.json`, `*-unified-qa-report.json`, `*-executive-summary.json`, and `*-factcheck-report.json` when deep-check ran.

If more than ~15% of a batch FAILs, stop and escalate to a Senior Analyst instead of grinding record-by-record.

---

### 5. Taxonomy & reference checks

- Prefer live IDs: `npm run reference:sync` (writes `data/reference/valid-sector-ids.json` and `valid-segment-ids.json`).
- Slugs must be kebab-case and come from reference taxonomy / dashboard — never invent `FinTech` or `P2P Lending`.
- If unknown: leave sector/segment empty; do not guess numeric IDs like `2` or `201`.

---

### 6. Submission (only after mechanical QA is green)

```bash
npm run submit -- --file data/pending/your-file.json --type organization
```

Adjust `--type` as needed: `organization`, `product`, `landscape`, `expert`.

Requires `.env`: `MONCHO_API_URL`, `MONCHO_AUTH_TOKEN`.

Submit creates **change requests**, not live DB rows.

---

### 7. External tools by stage

| Stage | Tools |
|-------|--------|
| Stage 1 mechanical | Plain HTTPS checks of your URLs only. No Tavily/Exa. |
| Stage 2 `--deep-check` | **Tavily** first, **Exa** fallback; optional **Anthropic** entailment judge. |
| Discovery (separate) | Tavily, Exa, Logo.dev — for research, not for the submit gate. |

---

### 8. Checklist (copy-paste)

```markdown
Validation & Submission Checklist
- [ ] JSON matches the correct sample schema in `samples/`
- [ ] Sector/segment slugs or IDs come from reference data (not guessed)
- [ ] All required URLs are real `https://...` links
- [ ] Rationales have concrete facts (number/date/%/named entity)
- [ ] `validate-analyst-data.ts` exit code 0 (zero FAIL records)
- [ ] Reviewed `data/qa-reports/*-executive-summary.json` human_review_queue
- [ ] Optional: `--deep-check` for high-stakes batches
- [ ] `.env` has MONCHO_API_URL and MONCHO_AUTH_TOKEN
- [ ] Submitted with `npm run submit` (no `--skip-qa`)
```
