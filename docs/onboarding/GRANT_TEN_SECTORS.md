# ICT Division grant — ten priority sectors

**Scope:** All contract analyst work on Bangladesh market intelligence aligns to these **10 sectors** through June 2027.

**Source:** ICT Division grant project plan (founder holds the full plan).  
**Slug / landscape status:** Verified in production (2026-07-07). Use the [Analyst Dashboard](https://app.moncho.ai/analyst/dashboard) for live sector and org views. Ask the founder if counts look stale.

---

## Sector list (grant deliverable)

| # | Grant sector | Target slug | Moncho slug(s) | Landscapes | Segments | Status |
|---|--------------|-------------|----------------|------------|----------|--------|
| 1 | Finance / Banking | `finance-banking-bd` | `financial-services` | 6 → **12** after N1–N5 patch | 16 → **48** activity | Patch pending |
| 2 | Agriculture | `agriculture-bd` | `agri-agro-processing`, `fisheries` | 13, 2 | 30, 0 | Verified |
| 3 | Education | `education-bd` | `k12-education`, `post-secondary-education` | 6, 6 | 19, 23 | Verified |
| 4 | ICT / ITES | `ict-ites-bd` | `ict-services` | 5 | 9 | Verified |
| 5 | Energy | `energy-bd` | `energy` | 6 | 15 | Verified |
| 6 | Health | `health-bd` | `healthcare` | 15 | 15 | Verified |
| 7 | Logistics | `logistics-bd` | **7 children** — `port-and-maritime-sector`, `logistics` (Freight Carriage), + 5 siblings | 5 + 6×1 | 24 + 25 | Live 2026-08-19 |
| 8 | E-commerce | `ecommerce-bd` | `retail` | **0** | **0** | Verified — **empty shell** |
| 9 | Sports | `sports-bd` | `indoor-sports` | 1 | 0 | Verified — thin |
| 10 | RMG / Textiles | `rmg-textiles-bd` | `ready-made-garments-rmg`, `circular-economy-textiles` | 3, 5 | 0, 0 | Verified |

### Empty shells (exist in DB, no landscapes — do not treat as mapped)

| Slug | Landscapes | Note |
|------|------------|------|
| `agriculture` | 0 | Use `agri-agro-processing` + `fisheries`, not this row |
| `education` | 0 | Use `k12-education` + `post-secondary-education` |
| `logistics` | 1 | **Freight Carriage** sibling (not meta-sector). Meta-sector = seven children; see logistics production handover |
| `retail` | 0 | Only top-level slug for e-commerce today; **needs landscape build** |

**Target slugs** (`*-bd`) are grant naming only — **not** in `metadata_sector` yet.

**Sherpa Gold certification** uses the Moncho slug column above plus pilot slugs in [`PILOT_GOLD_SECTORS.md`](./PILOT_GOLD_SECTORS.md). See [`gold-sectors.ts`](../../src/lib/sherpa/fixtures/gold-sectors.ts).

---

## How analysts use this

| Role | Use the 10 sectors to |
|------|----------------------|
| **Data Ops** | Score orgs/products per sector; Coverage Snapshot grades all 10 (🟢/🟡/🔴) |
| **GTM Ops** | Tie posts and newsletter issues to sector stories |

**Discovery deliverable:** one row per grant sector — landscape count, org/product count, biggest gap.

**MCP coverage:** call `coverage` **once per Moncho slug**, not once per grant row. Product depth is `products_live` / `pricing` (live `product_metrics`). `organizations_by_sector_id` vs `organizations_on_segments` are different placements, not a broken counter. Grant `*-bd` slugs are not in `metadata_sector`.

**Products live = 0** in an old snapshot was a Discovery MCP bug (`products.created_by` vs org ids). Recheck with `pricing?sector_slug=<moncho-slug>` after the coverage fix. HITL-hold harvests still do not count as live until applied.

### Live gap snapshot (2026-09-06)

Read-only `npm run analyst:audit-grant-sector-gap`. Counts use canonical `product_metrics.segment_id` and org maps on `sector_segments.id`.

| Grant sector | Orgs (sector_id / on segments) | sector_id only | segment only | Products live | Pricing rows | Quality |
|--------------|--------------------------------:|----------------:|-------------:|--------------:|-------------:|---------|
| Finance / Banking | 59 / 62 | 2 | 3 | 15 | 24 | Strong |
| Agriculture | 63 / 1112 | 2 | 1037 | 6 | 26 | Mixed |
| Education | 89 / 111 | 2 | 1 | 8 | 31 | Strong |
| ICT / ITES | 34 / 27 | 7 | 0 | 0 | 0 | Strong |
| Energy | 118 / 117 | 9 | 0 | 0 | 9 | Strong |
| Health | 247 / 233 | 87 | 67 | 334 | 460 | Mixed |
| Logistics | 5 / 33 | 2 | 30 | 0 | 0 | Mixed |
| E-commerce | 196 / 194 | 2 | 0 | 0 | 0 | Strong |
| Sports | 24 / 24 | 0 | 0 | 0 | 0 | Strong |
| RMG / Textiles | 0 / 3032 | 0 | 3031 | 0 | 0 | Mixed |

Agriculture and RMG are **segment-first seeds** (null `sector_id` on most mapped orgs). ICT/Energy/Sports/Retail can have orgs on the grid with **no live priced SKUs** yet. Energy’s 9 pricing rows have no `product_id`, so `products_live` stays 0. Do not auto-backfill maps from this table.

---

*Last updated: 2026-09-06*
