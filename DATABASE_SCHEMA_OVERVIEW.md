# Database schema overview (analyst workbench)

**Purpose:** What tables and JSON shapes analysts touch when researching orgs, products, and sector data.  
**Full reference (engineering):** [`docs/02-architecture-and-tech/DATABASE_AGENT_REFERENCE.md`](https://github.com/shmukit/Moncho-V1/blob/main/docs/02-architecture-and-tech/DATABASE_AGENT_REFERENCE.md)

Analysts **do not inject SQL** into production. You produce JSON (or draft SQL files) for founder review; founder merges after approval.

---

## Core entities you map

| Entity | DB table(s) | Submission JSON |
|--------|-------------|-----------------|
| **Organization** | `metadata_organization`, `organization_to_segment_map` | [`samples/organization_sample.json`](samples/organization_sample.json) |
| **Product** | `products`, `product_media`, `product_metrics` | [`samples/product_sample.json`](samples/product_sample.json) |
| **Landscape / segment** | `metadata_sector`, `segments`, `landscape_versions`, `sector_segments` | [`samples/landscape_sample.json`](samples/landscape_sample.json) |
| **Market facts (SML)** | `market_facts` | Harvest/seed shape per [`STATISTICAL_MEMORY_LAYER.md`](https://github.com/shmukit/Moncho-V1/blob/main/docs/04-ai-and-agents/STATISTICAL_MEMORY_LAYER.md) — founder ingests |

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

Grant deliverable: **10 Bangladesh sector landscapes** with positioned orgs. See [`GRANT_TEN_SECTORS.md`](GRANT_TEN_SECTORS.md) for the full sector list and Moncho slug mapping.

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

Other layers: `value_chain_*` (export pilots), `taxonomy_standards` (ISIC), `hs_codes` (product taxonomy).

---

## Commands (read-only discovery)

From Moncho-V1 repo root (founder grants access):

```bash
npm run db:info
npm run db:sectors
npm run sectors:audit-ontology
npx tsx scripts/tests/backfill-status.ts
```

---

## Submission path

1. Research → JSON matching `samples/`.
2. Score with [`SCORING_STANDARDS.md`](SCORING_STANDARDS.md).
3. Validate locally.
4. Submit change request via `scripts/submit_data.ts` **or** hand JSON/SQL file to founder for review.
5. Founder approves → production merge.

*Last updated: 2026-07-06*
