# Skill: Data Injection Planning

**Audience:** IDE agents writing sector plans, coverage snapshots, or harvest rationales for Data Ops.  
**When to use:** Before any org/product/market-facts injection plan; before inventing scoring dims.  
**Also read:** `IDE_AGENT_MISTAKES.md`, `SCORING_STANDARDS.md`, `PRODUCT_ORG_RUBRICS.md`, `skills/taxonomy_mapping.md`  
(In the nested workbench layout these live under `docs/reference/`.)

---

## 1. Purpose of a data injection plan

A plan is **founder-reviewable** when it locks:

1. **Scope** — sector slug, landscape slug(s), segment slug list (existing only)  
2. **Org path** — sources, eligibility, dedupe, scoring (production dims)  
3. **Product path** — template attributes, normalization unit, SKU cap, quality 1–5  
4. **Market facts path** — 5–10 concrete facts after checking what Moncho already has  
5. **Value chain** — as map/placement notes, **not** as a quality score  

If any of these are missing, the plan is incomplete.

---

## 2. Hard rules (non-negotiable)

### 2.1 Org quality = universal 5 dims only

Use `SCORING_STANDARDS.md`:

| # | Dimension |
|---|-----------|
| 1 | Innovation & differentiation |
| 2 | Market traction & growth |
| 3 | Competitiveness |
| 4 | Product depth |
| 5 | Social proof & impact |

- Score each **1–5** with a **one-line rationale + citeable URL**.  
- Overall = **average** (e.g. 4.0 / 5).  
- **Do not** invent Capability / Catalog / Credibility /25 systems.  
- **Do not** use Tier A/B/C/D as the official score (optional internal work queue only).  
- Sector checklists (named projects, menu breadth, certs) go **inside rationales**, not as new dimensions.

### 2.2 Value chain is never a quality dimension

Value chain position = **where the org sits** (importer, EPC, O&M, lab, distributor). That is **map intelligence**, not a grade.

- Recording stages covered (yes/no) is good.  
- **Scoring or rewarding** “more boxes = higher quality” is forbidden. It silently rewards vertical integration and penalizes specialists.  
- Place orgs on landscapes/segments by **what they sell or deploy**. Put stage coverage in research notes.

### 2.3 Website validates the org; LinkedIn does not

| Role | Allowed sources |
|------|-----------------|
| **Eligibility / validity** | Live **company website** (+ official registry/directory as discovery list) |
| **Supporting activity** | LinkedIn profile **among others** (press, named projects, partners) |
| **Never** | LinkedIn-only credibility; “LinkedIn ≥ N employees” as a scored checkbox; LinkedIn as substitute for missing website |

No website → reject or backlog. Do not “validate” via `linkedin.com/company/...` alone.

### 2.4 Products: pass/fail + equal 1–5 quality; no analyst weights

1. Pass universal product gates in `PRODUCT_ORG_RUBRICS.md`.  
2. Score quality dims **1–5 each, equal weight** → average (or single overall 1–5 for `product_metrics`).  
3. **Do not** ship 30%/20%/15% weight tables as the analyst rubric. Evidence JSON is fine; weight formulas are founder/eng later.  
4. **Do not** copy org dims onto products.  
5. Cap first pass: **5–15 flagship SKUs** per qualifying org.  
6. Always set **normalization unit** (per test, per W, per kVA, per Ah, per HP, per seat, …) even if price is “on request.”  
7. Official seller/lab URL only. No aggregator prices. No global manufacturer SKUs without a **local entity** listing page.

### 2.5 Digital presence is not a universal quality dim

Website freshness / Facebook activity may be an **optional org activity note**. It must not be a core product quality dimension worldwide. Prefer product dims that travel: spec completeness, operational clarity (sample/TAT or rated power), trust/accreditation, purchase transparency, fulfillment convenience.

### 2.6 Check Moncho before re-ingesting official stats

Before scraping HIES, DGHS bulletins, SREDA PDFs, etc.:

1. Discovery MCP / Dashboard / founder: search existing `market_facts` (e.g. `hies_2022`, health expenditure, energy capacity).  
2. List **what already exists** vs **gaps**.  
3. Propose only **missing** rows: metric, year, country, source URL, sector/landscape slug (5–10 concrete targets).

Do not treat “read this PDF” as a market-facts plan.

### 2.7 No new taxonomy

Never invent landscapes or segments. Map to closest existing slug; flag gaps for founder. Resolve IDs via `GET /api/reference/taxonomy` or fetch-reference script — never guess numeric IDs.

---

## 3. Required plan outline (use this skeleton)

```markdown
# [Sector] — [Landscape] data injection plan
Market: Bangladesh (or named country) · Date: YYYY-MM-DD

## 0. Scope lock
- sector_slug: …
- landscape_slug(s): … (existing only)
- segment_slugs: […] (existing only)
- Explicit: no new landscapes/segments this sprint

## 1. Coverage check (before harvest)
- Dashboard / MCP: org count, product count, known duplicates
- market_facts already in Moncho related to this landscape (list keys/years)
- Gaps this plan will fill

## 2. Org injection
- Primary source(s) + eligibility (must include live website)
- Dedupe method
- Scoring: SCORING_STANDARDS 1–5 × 5 dims + rationale template
- Value chain: stages noted for mapping only (not scored)
- Worked example scored on production dims (not /25)

## 3. Product injection
- When to harvest (after org clears agreed bar)
- SKU cap per org
- Normalization unit(s) for this landscape
- Pass gates + quality dims (1–5 equal; list dims + evidence fields)
- Reject rules (category-only, aggregator, global-only catalog)
- Worked example with numeric 1–5 (not High/Med only)

## 4. Market facts
- 5–10 concrete rows (after DB check)
- Tier 1 gov/stats sources vs tertiary press

## 5. Risks + founder sign-off checklist
```

---

## 4. Rationale writing (org)

Each dim needs **claim + evidence URL + what was observed**:

```text
Innovation: 4 — ISO 15189 medical lab + home-collection product line
  Evidence: https://example.com/accreditation
Traction: 3 — 4 named BD centres with addresses on locations page
  Evidence: https://example.com/locations
Competitiveness: 3 — …
Product depth: 5 — priced named test menu (N panels)
  Evidence: https://example.com/menu
Social proof: 4 — ILAC certificate page + named institutional partner
  Evidence: https://example.com/cert
Overall: 3.8 / 5
```

**Wrong:** `D3 Value chain = 5 (collection+lab+digital+consult+insurance) → Tier A`.

---

## 5. Rationale writing (product)

```text
Pass gates: official URL ✓ · segment lab-testing-diagnostics ✓ · named panel ✓ · BD ✓
Normalization: per panel (or per test)
Spec completeness: 4 — analytes listed
Operational clarity: 3 — sample type yes, TAT unknown
Trust: 5 — ISO 15189 cited on page
Transparency: 5 — BDT price published
Fulfillment: 4 — home collection + booking
Overall quality: 4.2 / 5  (store integer 4 on product_metrics if required)
Price (PQI X): BDT 1900 stored separately
```

---

## 6. Pre-submit agent checklist

- [ ] Read `IDE_AGENT_MISTAKES.md` Active rows for A/T/P/M  
- [ ] Scope uses existing taxonomy only  
- [ ] Org scores use production 5 dims (no /25, no value-chain score)  
- [ ] Org validity cites **website**, not LinkedIn-only  
- [ ] Products capped, normalized, 1–5 quality (no weight table)  
- [ ] Market facts checked against Moncho first  
- [ ] Dedupe via MCP/Dashboard  
- [ ] JSON matches `samples/`; validate script run  
- [ ] Branch + PR (never push `main`)

---

## 7. Related

- Mistakes registry: `IDE_AGENT_MISTAKES.md`  
- Org dims: `SCORING_STANDARDS.md`  
- Product gate + units: `PRODUCT_ORG_RUBRICS.md`  
- Taxonomy: `skills/taxonomy_mapping.md`  
- Discovery: `ANALYST_DISCOVERY_MCP.md`  
