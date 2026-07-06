# ICT Division Grant — Contract Analyst Onboarding

**Contract:** 3 months · **Planning horizon:** first ~2 months (you propose; founder approves)  
**Roles:** Data Ops Analyst · GTM Ops Analyst (optional / experimental)  
**Checkpoint:** September 2026 progress report to ICT Division

---

## 1. Grant goals (what Moncho owes ICT Division)

| Outcome | Jun 2027 target |
|---------|-----------------|
| **10 Bangladesh sector landscapes** | Maps, orgs, segments, key facts live |
| **~1 million BD data points** | ≥1,000,000 rows in `market_facts` and related tables, `country=BD` |
| **Two-sided platform** | Analyst workbench + consumer Sherpa usable |

## 2. Ten priority sectors (all analyst work)

Every Coverage Snapshot, org harvest, and content plan must reference these **10 sectors**:

| # | Sector | Moncho slug(s) |
|---|--------|----------------|
| 1 | Finance / Banking | `financial-services` |
| 2 | Agriculture | `agri-agro-processing`, `fisheries` |
| 3 | Education | `k12-education`, `post-secondary-education` |
| 4 | ICT / ITES | `ict-services` |
| 5 | Energy | `energy` |
| 6 | Health | `healthcare` |
| 7 | Logistics | `port-and-maritime-sector` |
| 8 | E-commerce | `retail` |
| 9 | Sports | `indoor-sports` |
| 10 | RMG / Textiles | `ready-made-garments-rmg`, `circular-economy-textiles` |

Full table with target slugs and notes: [`GRANT_TEN_SECTORS.md`](GRANT_TEN_SECTORS.md)  
Grant plan: [`PROJECT_PLAN.md`](https://github.com/shmukit/Moncho-V1/blob/main/docs/07-projects/bangladesh-ict-division-research-grant/PROJECT_PLAN.md)

September report frames work as **Phase 1 in progress**, not finished.

---

## 3. What you get (Day 0)

| Item | Notes |
|------|-------|
| Company email | Login for Moncho app |
| Cursor IDE | Team seat |
| LLM API | Company pool — never commit to git |
| Contract | Signed before work starts |
| Bank details | You submit; salary per contract |

**Also:**

| Item | Purpose |
|------|---------|
| Moncho app + analyst dashboard | [app.moncho.ai/analyst/apply](https://app.moncho.ai/analyst/apply) → Workbench API key |
| GitHub | Data Ops: `Moncho-V1` (branch/PR). GTM: workbench + docs as needed |
| Secrets | Founder shares `.env` via secure channel only |
| Async comms | WhatsApp (or agreed channel) — no fixed sync calendar |

**Data Ops:** read-only DB access for audit scripts only if founder grants.  
**GTM:** optional; no extra tooling required beyond what Moncho already has.

---

## 4. What we need from you (Day 0)

- [ ] Signed contract
- [ ] Bank account details
- [ ] Confirm timezone / async availability
- [ ] Confidentiality: grant data, API keys, unreleased product — no public posts without founder review

---

## 4. Onboarding steps

### Step 1 — Access and orientation

1. Contract + bank details.
2. Moncho login; analyst profile; save API key.
3. Clone repo; Cursor + `.env` (never commit).
4. Read this file + [`GRANT_TEN_SECTORS.md`](GRANT_TEN_SECTORS.md) + your role doc + [`DATABASE_SCHEMA_OVERVIEW.md`](DATABASE_SCHEMA_OVERVIEW.md).
5. Skim [`HANDBOOK.md`](HANDBOOK.md) and grant [`PROJECT_PLAN.md`](https://github.com/shmukit/Moncho-V1/blob/main/docs/07-projects/bangladesh-ict-division-research-grant/PROJECT_PLAN.md).

### Step 2 — Discovery (before big execution)

**Goal:** What Moncho has today · what is achievable in ~2 months.

| Data Ops | GTM Ops |
|----------|---------|
| BD `market_facts` and sector coverage | LinkedIn JSON (`bd-import-substitution`, agri VC), newsletter list |
| Org/product depth per grant sector | Import + agri series briefs; carousel/reel readiness |
| Gaps: official stats, pricing, VC, competitive maps | Channel baseline; kill/scale hypotheses |

**Data Ops commands** (repo root):

```bash
npm run db:info
npm run sectors:audit-ontology
npx tsx scripts/tests/sherpa-pipeline-audit.ts --country Bangladesh
npx tsx scripts/tests/backfill-status.ts
```

**Deliverable:** **Coverage Snapshot** (2–4 pages) — **one row per grant sector (all 10)**, facts, gaps, depth grade, blockers.

*Note: Bangladesh trade data is already ingested. Trade bulk is not a Data Ops workstream.*

### Step 3 — Your 2-month plan (founder approves)

Use [`roles/TWO_MONTH_PLAN_TEMPLATE.md`](roles/TWO_MONTH_PLAN_TEMPLATE.md): outcomes, step milestones, metrics, risks, Sep report section.

### Step 4 — Execute approved plan

- Async updates when something ships or blocks.
- **No direct production injection.** All JSON and SQL files go to founder for review; founder merges.
- Data Ops: new migration files only (never edit existing) — see [`AGENTS.md`](https://github.com/shmukit/Moncho-V1/blob/main/AGENTS.md).
- GTM: founder spot-checks public copy before publish (first tranche).

### Step 5 — Grant checkpoint prep

Support [`PROGRESS_REPORT_TEMPLATE.md`](https://github.com/shmukit/Moncho-V1/blob/main/docs/07-projects/bangladesh-ict-division-research-grant/PROGRESS_REPORT_TEMPLATE.md).

---

## 5. Role split

| Area | Data Ops | GTM Ops | Founder |
|------|----------|---------|---------|
| Org/product quality + sector mapping | **Owner** | — | Reviews all JSON/SQL before merge |
| BD official stats / pricing / VC gaps | **Owner** | — | Merges production data |
| Newsletter / LinkedIn / reels / student access | — | **Owner** | Approves public claims |
| ICT progress report | Data sections | Usage/content (if any) | Final edit |

---

## 6. Rules

1. **Quality over volume** — scored orgs/products on landscapes beat unscored bulk.
2. **Provenance** — source URL on every fact and org/product field you assert.
3. **No scope creep** — new sector or channel → flag founder first.
4. **Blocker rule** — if AI-assisted work is stuck **>1–2 hours**, message founder same day.
5. **Students** — self-serve university email only; no managed cohort.

---

## 7. Key docs

| Doc | Use |
|-----|-----|
| [`GRANT_TEN_SECTORS.md`](GRANT_TEN_SECTORS.md) | **10 grant sectors** — slugs and Moncho mapping |
| [`DATABASE_SCHEMA_OVERVIEW.md`](DATABASE_SCHEMA_OVERVIEW.md) | Tables and JSON shapes (start here) |
| [`SCORING_STANDARDS.md`](SCORING_STANDARDS.md) | Org quality rubric |
| [`PROJECT_PLAN.md`](https://github.com/shmukit/Moncho-V1/blob/main/docs/07-projects/bangladesh-ict-division-research-grant/PROJECT_PLAN.md) | Grant KPIs |
| [`BD_IMPORT_SUBSTITUTION_LINKEDIN_SERIES.md`](https://github.com/shmukit/Moncho-V1/blob/main/docs/03-product-and-design/BD_IMPORT_SUBSTITUTION_LINKEDIN_SERIES.md) | GTM: import substitution series |
| [`BD_EXPORT_VALUE_CHAIN_ANALYSIS_PLAYBOOK.md`](../03-product-and-design/BD_EXPORT_VALUE_CHAIN_ANALYSIS_PLAYBOOK.md) | GTM: agri VC series context |
| [`BD_MARKET_SIZING_DATA_ASSESSMENT.md`](../03-product-and-design/BD_MARKET_SIZING_DATA_ASSESSMENT.md) | BD capability today |
| [`DATABASE_AGENT_REFERENCE.md`](https://github.com/shmukit/Moncho-V1/blob/main/docs/02-architecture-and-tech/DATABASE_AGENT_REFERENCE.md) | Full table index (Data Ops) |
| [`AGENTS.md`](https://github.com/shmukit/Moncho-V1/blob/main/AGENTS.md) | Repo rules |

---

*Last updated: 2026-07-06*
