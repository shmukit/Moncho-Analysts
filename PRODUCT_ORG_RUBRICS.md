# Product and Org Rubrics — Production System Reference

How Moncho scores organizations and products in the current production system. Analysts should use these as the baseline, then propose sector-specific refinements separately for review.

The universal rubric lives in [`SCORING_STANDARDS.md`](SCORING_STANDARDS.md). This document extends it per sector.

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
| Sports | per session / per membership month | Gym → per month |

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

- [`SCORING_STANDARDS.md`](SCORING_STANDARDS.md) — universal org rubric (canonical)
- [`DATABASE_SCHEMA_OVERVIEW.md`](DATABASE_SCHEMA_OVERVIEW.md) — `products`, `product_metrics`, `metadata_organization`
- [`roles/DATA_OPS_ONBOARDING.md`](roles/DATA_OPS_ONBOARDING.md) — sector depth rubric and submission workflow
- [`GRANT_TEN_SECTORS.md`](GRANT_TEN_SECTORS.md) — slug mapping for the 10 grant sectors
