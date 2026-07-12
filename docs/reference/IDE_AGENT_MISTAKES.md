# IDE agent mistakes registry (Analyst Workbench)

**Last updated:** 2026-07-11  
**Owner:** Founder / Data Ops leads  
**Repo:** [Moncho-Analysts](https://github.com/shmukit/Moncho-Analysts) (this workbench)  
**Purpose:** Living list of **recurring mistakes IDE coding agents make** while discovering, scoring, and submitting Moncho data. Prune aggressively — keep short and current.

This is the analyst-repo twin of Moncho platform `IDE_AGENT_MISTAKES.md`. It covers **workbench behavior only** (no Next.js, no migrations, no Sherpa).

---

## How to use this doc

| Audience | Action |
|----------|--------|
| **IDE agents (before any research or JSON)** | Skim **Active** for scoring, taxonomy, products, MCP, submission. Follow **Correct approach**; do not repeat **Wrong pattern**. |
| **Analysts (after a bad PR / rejected change request)** | Add a row to **Active** with date, what the agent did, what the reviewer rejected, and the fix. |
| **Founder (after a guard lands in docs/scripts)** | Move the row to **Resolved**, or delete if the skill doc already makes it obvious. |

**Do not** paste full sector plans here. Link the PR or a short note. **Do not** invent Moncho-V1 paths analysts cannot open.

### Required agent reading order

1. `README.md` (repo root)
2. **This file** (`docs/reference/IDE_AGENT_MISTAKES.md`)
3. `analyst_instructions.md`
4. `docs/reference/SCORING_STANDARDS.md` + `docs/reference/PRODUCT_ORG_RUBRICS.md`
5. `skills/taxonomy_mapping.md` + relevant skills
6. `samples/*` for the entity you are submitting
7. `docs/discovery/ANALYST_DISCOVERY_MCP.md` / `docs/onboarding/MCP_SETUP_AFTER_MERGE.md` when looking up live data

---

## Domain indexes (link, don't copy)

| Area | Canonical doc |
|------|----------------|
| Org scoring (5 dims) | [`SCORING_STANDARDS.md`](SCORING_STANDARDS.md) |
| Product gate + normalization | [`PRODUCT_ORG_RUBRICS.md`](PRODUCT_ORG_RUBRICS.md) |
| Sector / landscape / segment IDs | [`skills/taxonomy_mapping.md`](../../skills/taxonomy_mapping.md) · `GET /api/reference/taxonomy` |
| Grant sector slugs | [`GRANT_TEN_SECTORS.md`](../onboarding/GRANT_TEN_SECTORS.md) |
| Discovery MCP / CLI | [`ANALYST_DISCOVERY_MCP.md`](../discovery/ANALYST_DISCOVERY_MCP.md) |
| JSON shapes | [`samples/`](../../samples/) · [`DATABASE_SCHEMA_OVERVIEW.md`](DATABASE_SCHEMA_OVERVIEW.md) |
| Validation / submit | [`skills/validation_submission.md`](../../skills/validation_submission.md) |

---

## Active — scoring and rubrics

| ID | Wrong pattern | Symptom / cost | Correct approach |
|----|---------------|----------------|------------------|
| A-01 | **Invent a parallel org rubric** — rename dims to Capability / Catalog / Value-chain boxes, score out of 25, invent Tier A/B/C | Founder cannot compare to Dashboard / judge agent; two scoring systems in one cohort | Score **only** the five dims in `SCORING_STANDARDS.md` (Innovation, Traction, Competitiveness, Product depth, Social proof). Put sector checklists **inside one-line rationales**, not as a new total. |
| A-02 | **Copy org dims onto products** — score a lab test or solar module with Innovation / Traction / Social proof | Nonsense quality scores; Products/Prices scatter meaningless | Use product **pass/fail gate** in `PRODUCT_ORG_RUBRICS.md`, then a justified Quality Score 1–5. Prefer landscape **product template** attributes when founder provides one (e.g. diagnostics test, solar hardware). |
| A-03 | **Invent sector-specific “approved” rubrics** — write ICT/agri/energy scoring as if production | Analysts follow unapproved rules; rework after founder review | Production = universal docs only. Propose template attributes in the sector plan for **founder sign-off**; do not treat hypotheses as law. |
| A-04 | **Set org quality = average of product scores** | Commodity SKUs inflate/deflate EPCs and labs incorrectly | Score orgs independently. Products **inform** Product depth rationale; they do not roll up into org score. |
| A-05 | **Worked examples that fail your own bar** — publish sample scores below the submit threshold you wrote | Agents copy failing examples into submissions | Recalibrate examples or lower the bar. Every sample in a plan must pass the stated rule. |

### Example (A-01)

**Wrong — do not do this:**

```text
D1 Capability 5 + D2 Traction 4 + D3 Value chain 5 + D4 Catalog 4 + D5 Credibility 4 = 22/25 Tier A
```

**Correct:**

```text
Innovation: 4 — ISO 15189 lab + home collection product (cite URL)
Market traction: 3 — 4 named BD centres (cite locations page)
Competitiveness: 4 — …
Product depth: 5 — priced test menu with N named panels (cite menu URL)
Social proof: 4 — ILAC / named partner (cite)
Overall: 4.0 / 5
```

---

## Active — taxonomy and scope

| ID | Wrong pattern | Symptom / cost | Correct approach |
|----|---------------|----------------|------------------|
| T-01 | **Guess `sector_id` / `segment_id` / slugs** — invent `2`, `201`, or cute new slugs | Change request rejected; orphans in review queue | Fetch `GET {MONCHO_API_URL}/api/reference/taxonomy` or run `scripts/extraction/fetch-reference-data.ts`. If unknown, **omit** IDs and use descriptive fields only. |
| T-02 | **Create new landscapes or segments in a plan** — “we need `residential-energy`” as if you can insert it | Plan blocked; taxonomy drift | Map to **closest existing** slug. Flag gaps for founder in research notes. Never invent taxonomy rows. |
| T-03 | **Map by association label, not what is sold** — SREDA “EPC” or trade-association name → wrong landscape | Orgs land on Policy/Finance or wrong segment | Map by **product/program deployed** (see sector plan examples). Multi-segment is OK when evidenced. |
| T-04 | **Use empty-shell grant slugs as live sectors** — e.g. treat `retail` / `logistics` as mapped when landscapes = 0 | Discovery against nothing; fake coverage | Read `GRANT_TEN_SECTORS.md`. Use verified Moncho slugs with landscapes (e.g. `port-and-maritime-sector` for logistics grant work). |
| T-05 | **Whole-sector spray** — “inject healthcare” across 15 landscapes in one PR | Thin junk everywhere; no scatter plot value | Lock **one landscape** (e.g. `diagnostics-testing`) + named segments until founder expands scope. |

### Example (T-01)

**Wrong:**

```json
{ "sector_id": 6, "segment_ids": [201, 202] }
```

**Correct:** resolve from taxonomy, then:

```json
{ "sector_slug": "healthcare", "segment_slugs": ["lab-testing-diagnostics"] }
```

Or omit IDs/slugs if unresolved — never guess numbers.

---

## Active — products and pricing

| ID | Wrong pattern | Symptom / cost | Correct approach |
|----|---------------|----------------|------------------|
| P-01 | **Scrape entire menus / global catalogs** — hundreds of SKUs per org | Unreviewable PRs; no normalization; noise | Cap first pass: **5–15 flagship SKUs** per org (or founder-set N). Prefer priced + comparable units. |
| P-02 | **Skip normalization** — store raw MRP only | Products/Prices scatter incomparable | Fill unit per `PRODUCT_ORG_RUBRICS.md` Part 3 (per test, per W, per seat, …). Spec-only allowed when price gated; still set the unit. |
| P-03 | **Aggregator / third-party price pages as source** | Unverifiable; stale; policy reject | Official org/lab/product URL only. |
| P-04 | **Attach global manufacturer SKUs to a local reseller** without local listing | BD landscape polluted with EU/CN brochure depth | Model must appear on the **local entity** site (or approved local catalog). Enrichment lists (e.g. SREDA NEM) are specs-only after site confirmation. |
| P-05 | **Category-only “products”** — “Inverters”, “Lab Tests” with no model/test name | Fake catalog depth; D4/quality theater | Reject until a **named** test, panel, or model exists. |
| P-06 | **Products before org gate** — harvest SKUs for every directory row | Wasted extraction on Tier-reject orgs | Score / eligibility-filter orgs first; products only for orgs that clear the agreed bar. |

### Example (P-02) — energy

**Wrong:** `"price": 45000, "currency": "BDT"` with no unit for a 550W panel.

**Correct:** price + `variant_value` / unit so normalized price = BDT per W (or document spec-only + `rated_power_w: 550`).

### Example (P-02) — diagnostics

**Wrong:** package price with no sense of per-test vs per-panel.

**Correct:** named panel + BDT price + normalization note (`per panel` or `per test` with assay count when published).

---

## Active — sources, MCP, and market facts

| ID | Wrong pattern | Symptom / cost | Correct approach |
|----|---------------|----------------|------------------|
| M-01 | **Treat association directories as complete sector truth** — BSREA / one PDF list = all orgs | Missing major actors; biased map | Directory = **start list**. Triangulate website + Dashboard dedupe. Note coverage gaps. |
| M-02 | **Dump PDF extraction on founder as “the plan”** | No market intelligence; ops theater | For `market_facts`, list **5–10 concrete** rows: metric, year, country, source URL, sector/landscape slug. |
| M-03 | **Skip duplicate check** | Duplicate orgs/products; reviewer churn | Use Discovery MCP / `scripts/discovery/check-duplicate.ts` / Dashboard before JSON. |
| M-04 | **Commit `.env` or paste API keys into chat/PRs** | Key leak; rotate cost | Keep `MONCHO_AUTH_TOKEN` and search keys local only. |
| M-05 | **Ignore MCP rate limits / invent DB credentials** | 429 loops; security fail | Read-only API + MCP only. Back off on 429. Never ask for Supabase keys. |

---

## Active — JSON, validation, submission

| ID | Wrong pattern | Symptom / cost | Correct approach |
|----|---------------|----------------|------------------|
| S-01 | **Generate SQL or “migrations”** | Out of scope; dangerous | JSON change requests only via `scripts/submit_data.ts` / Dashboard. |
| S-02 | **Invent `id` for new orgs/products** | Collisions / reject | Omit `id` on create; include real `id` only when updating. |
| S-03 | **Submit without `validate_data.ts` / schema match** | Noise in review queue | Match `samples/*`; run validate; then submit. |
| S-04 | **Fabricate websites, prices, or certifications** | Trust destroyer; ban risk | Missing evidence → omit field or reject candidate. Never invent URLs. |
| S-05 | **Push straight to `main`** | Breaks shared workbench | Branch + PR. Founder merges. |

---

## Active — planning and agent process

| ID | Wrong pattern | Symptom / cost | Correct approach |
|----|---------------|----------------|------------------|
| X-01 | **Sector plan without founder-locked landscape/segments** | Meeting thrash; wrong harvest | First section of any plan: sector slug, landscape slug(s), segment slug list, “no new taxonomy”. |
| X-02 | **Claim “done” without Dashboard / MCP verification** | Ghost coverage | After submit, confirm change request visible; after research, cite live coverage lookup. |
| X-03 | **Ignore this registry after an incident** | Same reject twice | Add a row the same day a change request is rejected for an agent mistake. |

---

## Resolved (prune quarterly)

| ID | Was | Fixed | Guard |
|----|-----|-------|-------|
| — | _(none yet in workbench registry)_ | — | Add rows when founder documents a closed loop |

---

## Adding a new entry (template)

```markdown
| ID | Wrong pattern | Symptom / cost | Correct approach |
|----|---------------|----------------|------------------|
| A-## | What the IDE agent did | What reviewer / founder saw | What to do instead |
```

1. Prefix: `A-` scoring, `T-` taxonomy, `P-` products, `M-` sources/MCP, `S-` submit, `X-` process.  
2. Add to **Active** with the date in the commit message or a one-line note under the table if needed.  
3. Include a **Wrong vs Correct** mini-example when the mistake is schema-shaped.  
4. After docs/scripts prevent recurrence → **Resolved** or delete.

---

## Related

- [`analyst_instructions.md`](../../analyst_instructions.md) — role and discovery sequence  
- [`.cursorrules`](../../.cursorrules) — IDE must load this registry early  
- [`roles/DATA_OPS_ONBOARDING.md`](../../roles/DATA_OPS_ONBOARDING.md) — Data Ops quality bar  
- [`HANDBOOK.md`](../onboarding/HANDBOOK.md) — truth over invented quality  
