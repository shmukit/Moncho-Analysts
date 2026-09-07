# Product and Org Rubrics — Production System Reference

How Moncho scores organizations and products in the current production system. Analysts should use these as the baseline. **Part 3c** lists the approved industry harvest cards (what object to price). Propose new template attributes in sector plans for founder review; do not invent a new `template_id` (A-03).

**CMS:** Founders approve product rubrics and org scoring config in Admin → Rubrics. Spec: [`../03-product-and-design/PRD_CMS_RUBRICS.md`](../03-product-and-design/PRD_CMS_RUBRICS.md). Draft rubric JSON lives under `product-rubrics/`; org rules also in [`SCORING_STANDARDS.md`](SCORING_STANDARDS.md).

**Strategy note:** products are first-class economic entities. Org score is **not** the average of product scores. Long-term moat = normalized SKUs + landscape templates + price history + graph links. Founders maintain the full product-intelligence strategy in the platform repo; analysts propose template attributes in sector plans and research notes for approval.

The universal **org** rubric lives in [`SCORING_STANDARDS.md`](SCORING_STANDARDS.md). This document covers production gates, product quality, and normalization defaults.

---

## Part 1 — Universal org rubric (all sectors)

Five dimensions, 1–5 each. Document one-line rationale per dimension. Submit only orgs above your agreed sector threshold (founder-confirmed per 2-month plan).

| # | Dimension | What you are assessing |
|---|-----------|----------------------|
| 1 | Innovation & differentiation | Unique model, patents, R&D focus, proprietary tech |
| 2 | Market traction & growth | Revenue growth, user base, recent funding, market share |
| 3 | Competitiveness | Moat, barriers to entry, position vs incumbents |
| 4 | Product depth | Portfolio diversity, feature maturity, UX/UI quality |
| 5 | Social proof & impact | Awards, certifications, sustainability, customer sentiment |

**Overall score** = average of five dimensions (e.g. 4.2 / 5).

---

## Part 2 — Universal product rubric (all sectors)

Pass / fail gate before a product goes on a landscape. All four criteria must pass.

| Criterion | Pass when |
|-----------|-----------|
| Verifiable source | Official site, marketplace listing, or catalog with working URL |
| Segment fit | Product category correctly maps to a landscape segment |
| Completeness | Name + category + description + (price or spec) — at minimum |
| Non-duplicate | Not a renamed copy of an existing platform entry |

Products that pass the gate get a **Quality Score** (1–5, Y-axis on the Products/Prices scatter plot) and a **Service Count** (number of recorded features/services). Both drive the four-quadrant value framework (Sweet Spot / Premium / Budget / Inflated).

**Direction of travel:** quality dimensions should follow an approved **landscape product template** (e.g. diagnostics test vs solar hardware), not a single global “innovation/traction” copy of the org rubric. Until a template is approved for your landscape, use this universal gate + a justified 1–5 quality score + the Part 3 normalization unit. Put template attribute drafts in research notes / `metadata` and flag them for founder approval.

### Product template — plain language (required for injection plans)

Full detail: [`skills/data_injection_planning.md`](skills/data_injection_planning.md) §2.4.

1. **Named models only** — not “Inverters” / “Lab Tests.”  
2. **Cap ~5–15 SKUs per org** on first pass.  
3. **Always set a normalization unit** (Part 3 below) even if price is gated.  
4. **Quality = equal 1–5 scores** (no % weights).  
5. **Price is separate** from quality (for Price-Quality Index later).  
6. **Local seller/lab page required** — no global manufacturer catalog attached to a local reseller without a local listing.

---

## Part 3 — Product normalization unit by sector

For the price scatter plot, price is normalized to a comparable unit. Use these defaults unless a better market convention exists.

| Sector | Normalization unit | Example |
|--------|--------------------|---------|
| Agriculture / FMCG | per 100g or per litre | Rice 5kg bag → price per 100g |
| Pharma / Healthcare (consumables) | per tablet / per dose | Paracetamol 500mg → per tablet |
| Energy (hardware) | per watt (solar) / per kVA (generator) / per Ah (battery) | Solar panel → per W |
| ICT / SaaS | per user seat / per 1k API requests / per GB storage | CRM → per seat |
| Education / EdTech | per enrolled student / per course seat | LMS → per student |
| RMG / Textiles | per metre / per kg | Fabric → per metre |
| Logistics | per kg or per 20ft container equivalent | Freight → per kg |
| Real estate / Construction | per sqft / per sqm | Office space → per sqft |
| Finance / Fintech | per transaction / per loan disbursement | Payment gateway → per transaction |
| Retail / E-commerce | per unit (SKU) | Electronics → per unit |
| Sports | per session / per membership month / per ticket / per season | Gym → per month; match ticket → per ticket; academy → per season; sponsorship → per year (catalog only) |

### Sports service revenue (clubs, venues, leagues)

Sports orgs often have **no physical SKU**. Submit each revenue line as a **named product** plus one or more **`product_metrics`** rows (same tables as retail).

| Revenue line | Example product name | `variant_unit` | Segment examples | Market sizing |
|--------------|------------------------|----------------|------------------|---------------|
| Match-day ticket | `Match-Day Ticket — Gallery` | `ticket` | `outdoor-team-sports`, `football-clubs` | **Yes** — consumer price input |
| Academy / training fee | `Academy Season Fee — 6 months` | `month` or `season` | `multi-sport-academies`, `cricket-clubs-academies` | **Yes** |
| Membership | `Annual Membership` | `year` or `month` | `indoor-multi-sport-courts`, `fitness-swimming` | **Yes** |
| Jersey / kit sponsorship | `Jersey Front Sponsorship — Season 2026` | `year` | `sports-sponsorship-marketing` | **Catalog only** — do not use for TAM |
| Broadcast / media rights | `Domestic Broadcast Rights — Season 2026` | `year` | `sports-broadcasting` | **Catalog only** |

**Rules:**

1. Set `metadata.revenue_stream` (`ticketing`, `academy`, `membership`, `sponsorship`, `broadcast`) and `metadata.billing` (`one_off`, `recurring_seasonal`, `recurring_annual`).
2. Set `metadata.b2b: true` on sponsorship and broadcast rows.
3. **`price: 0`** when pricing is negotiated or unpublished (document in `metadata.source_url` + notes).
4. **`hs_code`:** null for service lines.
5. **Market sizing** uses `customers × price × frequency` with a ~20% GDP/capita guardrail. A ৳50 lakh sponsorship used as the segment price will be rejected or inflate TAM. Only **consumer transaction** lines (ticket, membership, academy fee) may feed sizing.

Sample payload: [`samples/sports_revenue_sample.json`](samples/sports_revenue_sample.json).

---

## Part 3b — B2B price ranges (paired-row convention)

The schema stores **one numeric `price` per `product_metrics` row**. Ranges are **not** accepted in a single price field (`"5000-8000"` is rejected or silently truncated in CMS).

**Standard:** one published range = **two rows** (low and high endpoints), shared metadata:

| Field | Low row | High row |
|-------|---------|----------|
| `variant_label` | e.g. `welding_cell_low` | `welding_cell_high` |
| `price` | range minimum | range maximum |
| `metadata.price_tier` | `low` | `high` |
| `metadata.band_id` | shared id, e.g. `MRAI-B001` | same |
| `metadata.price_range_low` / `price_range_high` | both endpoints on **each** row | both endpoints |
| `metadata.price_representation` | `reference_band` | `reference_band` |
| `metadata.source_quote` | original range text from source | same |

**Do not** submit a fabricated midpoint as the only row. Reference implementation: `sample-data/manufacturing-robotics-ai/product-price-map-v1.json`.

### How ranges feed market sizing

Market sizing **does not read `product_metrics`**. It consumes single numbers from `market_facts` (`median_price_usd`) or `product_tam_breakdowns.unit_price`. TAM is a generated column: `customers × penetration × frequency × unit_price`.

When a range must become one sizing input, a **human** collapses it with a written assumption:

1. **Preferred:** representative-spec price (dominant configuration) + full range in `price_assumption` / `source_quote`.
2. **Fallback:** midpoint with an explicit assumption note.
3. **Optional:** low / high scenario sizing when a founder requests sensitivity.

The paired rows keep both endpoints queryable; the single sizing number is a documented judgment on top.

---

## Part 3c — Industry harvest cards (intern overlay)

Pick the **pricing object** before you harvest. A lab test, a solar panel, a bank fee, and a SaaS plan are not the same row. Universal submit rules still apply: named offering, official URL, numeric price (or an explicit pricing gap), currency on the page, 5–15 SKUs on first pass. Full checklist: [`SKU_PRICING_SUBMISSION_GUIDE.md`](SKU_PRICING_SUBMISSION_GUIDE.md).

When the Dashboard or JSON has a metadata field, set `metadata.template_id` to the approved id in the table. If the form has no metadata box, still harvest the correct object and unit, and name the template in the product description.

Do **not** copy founder JSON schemas or invent a ninth template. Education and RMG have no dedicated template yet: use Part 3 units only.

| Grant sector | Price this object | `template_id` | First-pass unit | Harvest | Skip |
|--------------|-------------------|---------------|-----------------|---------|------|
| Health (labs) | Named test, panel, or package | `diagnostics-test.v1` | per test or per panel | Local lab MRP on the lab site | Aggregator listings, “Lab Tests” with no name |
| Health (clinical) | Named procedure or episode | `healthcare-procedure.v1` | per procedure / session / bundle as published | Hospital fee schedule for that named item | Insurance reimbursement treated as list price; package split into fake per-day rates |
| Energy | Named hardware model | `solar-hardware.v1` | W / kW / Ah / kVA / HP by product group | Model on the **BD seller** page | Category pages (“Inverters”); global brochure on a reseller with no local listing |
| Finance | Named product with a published fee or rate | `finance-products.v1` | account, policy, transaction, or as published | Fee schedule / listed rate for that named SKU | “Retail Loans”, min balance, loan ceiling, prize pools |
| Logistics | Named lane, warehouse SKU, tariff, or courier product | `logistics-products.v1` | TEU, pallet-month, per kg, or seat (software) | Published tariff or rate band | “Sea Freight” / “3PL Solutions”. Phone quotes: `pricing_gap`, do not invent a number |
| ICT / global digital | Named list plan | `saas-software.v1` | `mo` / `yr` / seat | Free / Pro / Lite (and billed period) in **native** currency | Contact-us, “starts at”, API credit tables. Feature checkboxes are not SKUs |
| Agriculture / e-commerce pack | Named pack size | `fmcg-packaged-goods.v1` | pack contents; normalize per 100g or 100ml | Official pack price | Marketplace 3P; one row per flavor unless that pack is separately priced |
| Sports | Ticket, membership, or academy fee | (none yet; use Part 3 Sports table) | ticket / month / season | Consumer lines with a public number | Sponsorship or broadcast as a TAM price (catalog only) |
| Education | Named course or seat | (none yet; Part 3) | per enrolled student or course seat | Published course/seat fee | Inventing a new education template |
| RMG / Textiles | Named fabric or garment SKU | (none yet; Part 3) | per metre or per kg | Named SKU on the seller page | Category-only “Fabrics” |

**SaaS extras:** first pass is named list plans. A priced add-on or usage meter is a real SKU **only** when the official page shows a number. If it does not, skip it or mark `pricing_gap`. Never invent. Infra instance ladders stay off first pass unless the founder assigns them.

**Not grant default:** hotels (`hotels-hospitality.v1`) are per room-night on the property’s own rate page. Do not submit OTA calendar snapshots as a stable list price.

---

## Part 4 — Sector depth readiness score (non-trade layers)

Score 0–2 each layer. ≥ 7 / 10 = strong sector readiness for Sherpa retrieval and Moncho landscape publishing.

| Layer | Score 2 when |
|-------|--------------|
| Market size facts | Official survey rows tagged to sector in `market_facts`; sizing memo drafted |
| Product pricing coverage | ≥ 10 quality-scored products with price/spec + normalization unit |
| Value chain | Stages and gaps documented in `value_chain_*` tables |
| Competitive map | Landscape published with quality-scored orgs only |
| Org depth | ≥ 20 scored orgs with rationales mapped to correct segments |

---

## Part 5 — What Moncho does not score (out of scope for analysts)

- Market cap or precise revenue (too variable; use growth signals instead)
- Social media follower counts as a quality signal (vanity metric)
- Products without a verifiable source URL (auto-reject, never a judgment call)
- Org political or ownership affiliation beyond what is publicly disclosed

---

## Part 6 — Where rubrics are enforced in the platform

| Component | Where score surfaces |
|-----------|---------------------|
| `SCORING_STANDARDS.md` | Universal 1–5 org rubric (this repo) |
| Products/Prices scatter plot (PRD_Products_Prices_Tab) | Y-axis: Quality Score (1–5) |
| `audit_logs` change request review | Judge agent uses scoring criteria to accept/reject change requests |
| `product_metrics` table | `quality_score` column (1–5 int), `services` JSONB for service count |
| Analyst Dashboard | Live coverage grades per sector (🟢 / 🟡 / 🔴) |

---

## Related documents

- [`SCORING_STANDARDS.md`](SCORING_STANDARDS.md) — universal org rubric (canonical; independent of product rollup)
- [`IDE_AGENT_MISTAKES.md`](IDE_AGENT_MISTAKES.md) — recurring IDE agent wrong patterns (scoring, taxonomy, products)
- [`DATABASE_SCHEMA_OVERVIEW.md`](DATABASE_SCHEMA_OVERVIEW.md) — `products`, `product_metrics`, `metadata_organization`
- [`roles/DATA_OPS_ONBOARDING.md`](roles/DATA_OPS_ONBOARDING.md) — sector depth rubric and submission workflow
- [`GRANT_TEN_SECTORS.md`](GRANT_TEN_SECTORS.md) — slug mapping for the 10 grant sectors
- [`../07-projects/bangladesh-ict-division-research-grant/FINANCE_LOGISTICS_HANDOVER_SIGNOFF.md`](../07-projects/bangladesh-ict-division-research-grant/FINANCE_LOGISTICS_HANDOVER_SIGNOFF.md) — founder sign-off (2026-08-23)

---

## Part 7 — Sector org scoring shims (founder-approved exceptions)

Production `organization_scores` columns are fixed. These sectors **reuse column names** with sector semantics in rationales. CMS org emphasis mirrors this table.

### Financial Services — `financial-services`

| Write to column | Score as | Rationale must say |
|-----------------|----------|-------------------|
| `innovation_score` | O1 Business profile & mandate | FS O1 — licensed franchise + origination channels |
| `competitiveness_score` | O2 Prudential soundness | FS O2 — capital, asset quality, liquidity, solvency |
| `product_portfolio_score` | O3 Intermediation efficiency | FS O3 — cost-income, combined ratio, ROA, service standard |
| `market_traction_score` | O4 Franchise scale | FS O4 — share of segment stock (cap at 3 if universe incomplete) |
| `social_impact_score` | O5 Supervisory trust | FS O5 — register, ratings, protection schemes |

**O5 conduct footnote:** public supervisor enforcement or licence restriction in the last two years caps O5 at 2 or blocks submit. Do not also score the same fact in O2. Revoked licence → eligibility fail.

**Product families:** A balance-sheet credit · B risk pooling · C payment rails · D markets & funds · E assessment & advice. See CMS template `finance-products.v1`.

### Logistics meta-sector — child slugs

Apply the same shim on all seven child sectors (`port-and-maritime-sector`, `logistics`, `warehousing-and-storage`, `freight-forwarding-and-brokerage`, `express-and-courier-delivery`, `cargo-terminal-operations`, `logistics-execution-software-and-visibility`).

| Write to column | Score as | Rationale must say |
|-----------------|----------|-------------------|
| `innovation_score` | D1 Operating capability | Logistics D1 — attributable operating class + spec |
| `competitiveness_score` | D2 Service continuity | Logistics D2 — hours, schedules, recurring operations |
| `market_traction_score` | D3 Network footprint | Logistics D3 — named nodes/lanes (not HQ-only) |
| `product_portfolio_score` | D4 Offer interface | Logistics D4 — named/rateable offer + obtain path |
| `social_impact_score` | D5 External controls | Logistics D5 — optional ISO/AEO/class (not required licence) |

**Eligibility:** insolvency or revoked operating licence → fail. **1B gate:** org bar + D4 (`product_portfolio_score`) ≥ 3. **Placement:** multi-map via live segment slugs only (no `sector_slugs` JSON).

**Product template:** `logistics-products.v1` — TEU, pallet-month, per kg, per seat normalization.
