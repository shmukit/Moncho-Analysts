# Data Ops Analyst — ICT Grant Role

**Mission:** High-quality **organizations and products** mapped across grant sectors, plus honest coverage of what Moncho has and can add — on a path to **10 sectors** and **~1M BD data points**.

**Reports to:** Founder. You research and produce JSON/SQL drafts; **founder reviews and injects**. No direct production merges.

---

## Ten priority sectors (grant scope)

All discovery and data work covers these **10 sectors**. Grade each in your Coverage Snapshot (🟢/🟡/🔴).

See [`GRANT_TEN_SECTORS.md`](../docs/onboarding/GRANT_TEN_SECTORS.md) for slugs and landscape counts. Use the [Analyst Dashboard](https://app.moncho.ai/analyst/dashboard) for live org/product coverage — you do **not** need database CLI access.

| # | Sector | Moncho slug(s) | Landscapes (verified) |
|---|--------|----------------|------------------------|
| 1 | Finance / Banking | `financial-services` | 6 |
| 2 | Agriculture | `agri-agro-processing`, `fisheries` | 13, 2 |
| 3 | Education | `k12-education`, `post-secondary-education` | 6, 6 |
| 4 | ICT / ITES | `ict-services` | 5 |
| 5 | Energy | `energy` | 6 |
| 6 | Health | `healthcare` | 15 |
| 7 | Logistics | `port-and-maritime-sector` | 5 (`logistics` slug exists but **0** landscapes) |
| 8 | E-commerce | `retail` | **0** — empty shell; landscape work needed |
| 9 | Sports | `indoor-sports` | 1 |
| 10 | RMG / Textiles | `ready-made-garments-rmg`, `circular-economy-textiles` | 3, 5 |

Do **not** use empty shells `agriculture`, `education`, or `logistics` for mapped work.

---

## Primary goals

### 1. Org and product quality (5 sectors first)

Pick **5 priority sectors** in your Coverage Snapshot (evidence-based). For each:

| Deliverable | Standard |
|-------------|----------|
| **Quality-scored organizations** | Each org scored with [`SCORING_STANDARDS.md`](../docs/reference/SCORING_STANDARDS.md) (five dimensions, 1–5 + rationale). Only map orgs above your agreed threshold. |
| **Quality-scored products** | Name, category, description, source URL, pricing/spec where public. Reject thin listings. |
| **Landscape positioning** | Orgs placed on correct segments via change requests or handoff JSON. |

**Rule:** Unscored or low-score entities do not go on landscapes. Volume without quality is waste.

### 2. Grant alignment (longer arc)

| Grant outcome | Your contribution |
|---------------|-------------------|
| 10 sector landscapes | Depth in 5 first; scaffold + gap register for remaining 5 |
| ~1M BD data points | Identify non-trade gaps (official stats, pricing, org-linked facts); draft seeds for founder review |
| Coverage honesty | Snapshot + updated scorecard for Sep report |

**Out of scope for you:** Bangladesh **trade bulk ingest** (already done in `market_facts`).

---

## Step 1 — Discovery checklist

Save your Coverage Snapshot notes in this workbench (branch + PR) or share the file with founder. Suggested filename: `SECTOR_DEPTH_BASELINE_<YYYY-MM>.md`.

- [ ] Read [`DATABASE_SCHEMA_OVERVIEW.md`](../docs/reference/DATABASE_SCHEMA_OVERVIEW.md)
- [ ] Review [`GRANT_TEN_SECTORS.md`](../docs/onboarding/GRANT_TEN_SECTORS.md) landscape counts
- [ ] Use [Analyst Dashboard](https://app.moncho.ai/analyst/dashboard) to spot-check org/product depth per grant sector
- [ ] Ask founder only if you need a BD `market_facts` summary count (not available as a dashboard CLI)

**Coverage Snapshot must answer:**

1. What coverage you can see on the dashboard per grant sector (orgs, products, landscapes). For national fact totals, ask founder once.
2. **All 10 grant sectors:** landscape status, org count, product count, quality grade (🟢/🟡/🔴).
3. Where org/product scoring is weakest (by sector).
4. Which sectors to deepen first in ~2 months vs scaffold later.

---

## Org scoring rubric

Use [`SCORING_STANDARDS.md`](../docs/reference/SCORING_STANDARDS.md):

1. Innovation & differentiation  
2. Market traction & growth  
3. Competitiveness  
4. Product depth  
5. Social proof & impact  

Document one-line rationale per dimension in research notes. Submit only orgs that pass your sector threshold.

---

## Product scoring rubric

| Criterion | Pass when |
|-----------|-----------|
| Verifiable source | Official site, marketplace listing, or catalog with URL |
| Segment fit | Product category matches landscape segment |
| Completeness | Description + category + (price or spec) where available |
| Evidence | Not duplicate/stale listing; logo or media when possible |

---

## Sector depth rubric (non-trade layers)

Score 0–2 each; ≥7/10 = strong sector readiness:

| Layer | Score 2 when |
|-------|----------------|
| Market size | Official survey facts tagged to sector; sizing memo drafted |
| Product pricing | ≥10 quality-scored products with price/spec evidence |
| Value chain | Stages/gaps documented (reuse `value_chain_*` where exists) |
| Competitive map | Landscape published with **quality-scored** orgs only |

*Trade mapping: already ingested — verify retrieval only, do not re-ingest.*

---

## Step 2 — Default work sequence (customize in 2-month plan)

| Step | Focus |
|------|-------|
| **A. Baseline** | Coverage Snapshot + pick 5 priority sectors |
| **B. Org harvest** | Discover → score → JSON → founder review |
| **C. Product harvest** | Per priority orgs → score → JSON → founder review |
| **D. Landscape map** | Position approved orgs on segments |
| **E. Non-trade facts** | Draft `market_facts` seeds for gaps (founder merges) |
| **F. QA** | Provenance check; gap table for Sep report |

Use workbench `skills/` and `samples/` for discovery and JSON shape. For value-chain or sector playbooks beyond this repo, ask the founder.

---

## Hard rules

- **No direct injection** — all JSON/SQL to founder for review.
- Never edit existing production migration files.
- Ask founder before drafting raw SQL that affects production schema.
- Blocked **>1–2 hours** on AI-assisted work → ask founder.

---

## Status updates (async)

When you ship or block, message founder with:

- Orgs/products scored and handed off (count + sector)
- Sector depth scores
- Draft files pending founder review
- Blockers

---

## Step 3 — Deliverable before full execution

Completed [`TWO_MONTH_PLAN_TEMPLATE.md`](TWO_MONTH_PLAN_TEMPLATE.md) — founder sign-off required.
