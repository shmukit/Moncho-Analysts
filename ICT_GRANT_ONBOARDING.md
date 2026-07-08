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

Every Coverage Snapshot, org harvest, and content plan must reference these **10 sectors**.

Sector slugs and landscape counts: [`GRANT_TEN_SECTORS.md`](GRANT_TEN_SECTORS.md). Browse live coverage in the [Analyst Dashboard](https://app.moncho.ai/analyst/dashboard).

| # | Sector | Moncho slug(s) | Landscapes |
|---|--------|----------------|------------|
| 1 | Finance / Banking | `financial-services` | 6 |
| 2 | Agriculture | `agri-agro-processing`, `fisheries` | 13, 2 |
| 3 | Education | `k12-education`, `post-secondary-education` | 6, 6 |
| 4 | ICT / ITES | `ict-services` | 5 |
| 5 | Energy | `energy` | 6 |
| 6 | Health | `healthcare` | 15 |
| 7 | Logistics | `port-and-maritime-sector` | 5 |
| 8 | E-commerce | `retail` | **0** (empty shell) |
| 9 | Sports | `indoor-sports` | 1 |
| 10 | RMG / Textiles | `ready-made-garments-rmg`, `circular-economy-textiles` | 3, 5 |

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
| GitHub | This workbench repo ([Moncho-Analysts](https://github.com/shmukit/Moncho-Analysts)). Create a branch and open a PR; do not push to `main`. |
| Secrets | Founder shares `.env` via secure channel only |
| Async comms | WhatsApp (or agreed channel) — no fixed sync calendar |

**Data Ops:** use the Analyst Dashboard for live data. No database CLI access required.  
**GTM:** optional; no extra tooling required beyond what Moncho already has.

---

## 4. What we need from you (Day 0)

- [ ] Signed contract
- [ ] Bank account details
- [ ] Confirm timezone / async availability
- [ ] Confidentiality: grant data, API keys, unreleased product — no public posts without founder review

---

## 5. Onboarding steps

### Step 1 — Access and orientation

1. Contract + bank details.
2. Moncho login; analyst profile; save API key.
3. Clone **this** workbench repo; Cursor + `.env` (never commit).
4. Read this file + [`GRANT_TEN_SECTORS.md`](GRANT_TEN_SECTORS.md) + your role doc + [`DATABASE_SCHEMA_OVERVIEW.md`](DATABASE_SCHEMA_OVERVIEW.md).
5. Skim [`HANDBOOK.md`](HANDBOOK.md).

### Step 2 — Discovery (before big execution)

**Goal:** What Moncho has today · what is achievable in ~2 months.

| Data Ops | GTM Ops |
|----------|---------|
| BD `market_facts` and sector coverage | LinkedIn JSON under `sample-data/` (import substitution, agri VC if present), newsletter list |
| Org/product depth per grant sector | Import + agri series briefs; carousel/reel readiness |
| Gaps: official stats, pricing, VC, competitive maps | Channel baseline; kill/scale hypotheses |

**Data Ops discovery** (no database CLI — use the app):

- [Analyst Dashboard](https://app.moncho.ai/analyst/dashboard) for live orgs, products, and sector coverage
- Sector status in [`GRANT_TEN_SECTORS.md`](GRANT_TEN_SECTORS.md)
- Schema shapes in [`DATABASE_SCHEMA_OVERVIEW.md`](DATABASE_SCHEMA_OVERVIEW.md)
- Ask founder only if a national fact count or export is missing from the dashboard

**Deliverable:** **Coverage Snapshot** (2–4 pages) — **one row per grant sector (all 10)**, facts, gaps, depth grade, blockers.

*Note: Bangladesh trade data is already ingested. Trade bulk is not a Data Ops workstream.*

### Step 3 — Your 2-month plan (founder approves)

Use [`roles/TWO_MONTH_PLAN_TEMPLATE.md`](roles/TWO_MONTH_PLAN_TEMPLATE.md): outcomes, step milestones, metrics, risks, Sep report section.

### Step 4 — Execute approved plan

- Async updates when something ships or blocks.
- **No direct production injection.** All JSON and SQL files go to founder for review; founder merges.
- Data Ops: hand off drafts via PR or file to founder; never edit existing production migrations yourself.
- GTM: founder spot-checks public copy before publish (first tranche).

### Step 5 — Grant checkpoint prep

Help draft your sections for the September ICT progress report. Founder owns the final template and submission.

---

## 6. Role split

| Area | Data Ops | GTM Ops | Founder |
|------|----------|---------|---------|
| Org/product quality + sector mapping | **Owner** | — | Reviews all JSON/SQL before merge |
| BD official stats / pricing / VC gaps | **Owner** | — | Merges production data |
| Newsletter / LinkedIn / reels / student access | — | **Owner** | Approves public claims |
| ICT progress report | Data sections | Usage/content (if any) | Final edit |

---

## 7. Rules

1. **Quality over volume** — scored orgs/products on landscapes beat unscored bulk.
2. **Provenance** — source URL on every fact and org/product field you assert.
3. **No scope creep** — new sector or channel → flag founder first.
4. **Blocker rule** — if AI-assisted work is stuck **>1–2 hours**, message founder same day.
5. **Students** — self-serve university email only; no managed cohort.

---

## 8. Docs in this workbench (start here)

| Doc | Use |
|-----|-----|
| [`GRANT_TEN_SECTORS.md`](GRANT_TEN_SECTORS.md) | **10 grant sectors** — slugs and Moncho mapping |
| [`DATABASE_SCHEMA_OVERVIEW.md`](DATABASE_SCHEMA_OVERVIEW.md) | Tables and JSON shapes |
| [`SCORING_STANDARDS.md`](SCORING_STANDARDS.md) | Org quality rubric |
| [`DASHBOARD_WALKTHROUGH.md`](DASHBOARD_WALKTHROUGH.md) | Analyst dashboard |
| [`roles/DATA_OPS_ONBOARDING.md`](roles/DATA_OPS_ONBOARDING.md) | Data Ops role |
| [`roles/GTM_OPS_ONBOARDING.md`](roles/GTM_OPS_ONBOARDING.md) | GTM Ops role |
| [`roles/TWO_MONTH_PLAN_TEMPLATE.md`](roles/TWO_MONTH_PLAN_TEMPLATE.md) | Plan for founder approval |

Longer engineering / grant internal docs are **not** in this repo. Ask the founder when you need them.

---

*Last updated: 2026-07-08*
