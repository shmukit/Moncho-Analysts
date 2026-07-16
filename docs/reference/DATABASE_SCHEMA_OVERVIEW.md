# Database schema overview (analyst workbench)

**Purpose:** What tables and JSON shapes analysts touch when researching orgs, products, and sector data.

Analysts **do not inject SQL** into production. You produce JSON (or draft SQL files) for founder review; founder merges after approval.

---

## Core entities you map

| Entity | DB table(s) | Submission JSON |
|--------|-------------|-----------------|
| **Organization** | `metadata_organization`, `organization_to_segment_map` | [`samples/organization_sample.json`](../../samples/organization_sample.json) |
| **Product** | `products`, `product_media`, `product_metrics` | [`samples/product_sample.json`](../../samples/product_sample.json) |
| **Landscape / segment** | `metadata_sector`, `segments`, `landscape_versions`, `sector_segments` | [`samples/landscape_sample.json`](../../samples/landscape_sample.json) |
| **Market facts (SML)** | `market_facts` | Draft seed/JSON for founder ingest (not self-merged) |

---

## Organizations

- **`metadata_organization`:** name, website, description, logo, country, sector links, type.
- **`organization_to_segment_map`:** positions org on landscape segments.
- **`organization_hs_code_map`:** optional export/product HS linkage.

**Quality bar:** score each org with [`SCORING_STANDARDS.md`](SCORING_STANDARDS.md) (1–5 on five dimensions + one-line rationale). Only map orgs that meet the sector threshold you define in your 2-month plan.

---

## Products

- **`products`:** name, group, category, description, optional `hs_code`.
- **`product_media`:** images linked by `product_name` or `product_id`.
- **`product_metrics`:** pricing bands, units, sources (founder ingests after review).

**Quality bar:** complete name, verifiable source URL, category fit to segment, pricing or spec evidence where public. Reject thin listings (name only, no source).

---

## Sectors and landscapes

| Table | Role |
|-------|------|
| `metadata_sector` | Sector slug, name, `aliases[]`, `categories[]` |
| `landscape_versions` | Published map version per sector |
| `segments` | Grid cells / market niches |
| `sector_segments` | Segment graph for a landscape |

Grant deliverable: **10 Bangladesh sector landscapes** with positioned orgs. See [`GRANT_TEN_SECTORS.md`](../onboarding/GRANT_TEN_SECTORS.md) for the full sector list and Moncho slug mapping.

---

## `market_facts` (read-mostly for analysts)

Atomic metrics: trade, BBS, SMI, surveys, pricing proxies.

| Column | Notes |
|--------|-------|
| `metric_key` | e.g. `import_trade_value_usd`, `students_total` |
| `country` | `Bangladesh` / `BD` |
| `year` | Observation year |
| `dimensions` | JSON: `hs6_code`, `sector_slug`, `isic_class`, etc. |
| `fact_type` | Sherpa retrieval family (`trade`, `production`, …) |
| `sector_slug` | Prefer set on new rows |

**Bangladesh trade:** OEC import/export rows are **already ingested**. Data Ops does not re-run bulk trade ingest; focus on org/product quality, official stats gaps, and sector mapping.

Other layers you may hear about (founder-owned): `value_chain_*`, `taxonomy_standards` (ISIC), `hs_codes`. Ask founder for details when needed.

---

## Discovery (read-only)

Use the [Analyst Dashboard](https://app.moncho.ai/analyst/dashboard) for browsing orgs, products, and sector coverage. You do **not** need database CLI or Moncho-V1 script access for day-to-day work.

---

## Submission path

1. Research → JSON matching `samples/`.
2. Score with [`SCORING_STANDARDS.md`](SCORING_STANDARDS.md).
3. Validate locally (mechanical QA in the workbench).
4. Submit via one of:
   - **IDE CLI**: `npm run submit -- --file path.json --type organization|product|market_fact|metadata|landscape`
   - **Bulk inject** (browser): `/analyst/bulk-inject` — same entity types, max **50 JSON objects per batch**
5. **Organizations / products / metadata / landscapes** → change requests in `audit_logs` (review queue → CMS apply).
6. **Market facts** → `staging_market_facts` (`pending_review`); founder/CMS promotes to live `market_facts`.

### Market fact required fields

| Field | Required |
|-------|----------|
| `metric_key` | Yes |
| `country` | Yes (must resolve in `metadata_country`) |
| `year` | Yes |
| `value` | Yes |
| `unit` | Yes |
| `source_name` | Yes |
| `source_url` | Recommended |
| `dimensions` | Optional JSON (e.g. `sector_slug`, `hs6_code`) |

### Analyst access (trial vs permanent)

- New analysts get a **3-day trial** with unlimited submissions.
- After trial: **3 pending submissions per week** unless `entitlement_source = earned` (one applied approval) or Paid/Enterprise.
- **403 "Weekly submission limit"** means the API key works; entitlement cap hit — not a dead key. Ask founder for earned access or get one submission approved and applied.

*Last updated: 2026-07-16*
