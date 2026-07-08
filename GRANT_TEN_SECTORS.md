# ICT Division grant — ten priority sectors

**Scope:** All contract analyst work on Bangladesh market intelligence aligns to these **10 sectors** through June 2027.

**Source:** ICT Division grant project plan (founder holds the full plan).  
**Slug verification:** Checked against live `metadata_sector` via `npm run db:info` / `npm run db:sectors` (2026-07-07). Re-check with founder if DB changed.

---

## Sector list (grant deliverable)

| # | Grant sector | Target slug | Moncho slug(s) | Landscapes | Segments | Status |
|---|--------------|-------------|----------------|------------|----------|--------|
| 1 | Finance / Banking | `finance-banking-bd` | `financial-services` | 6 | 16 | Verified |
| 2 | Agriculture | `agriculture-bd` | `agri-agro-processing`, `fisheries` | 13, 2 | 30, 0 | Verified |
| 3 | Education | `education-bd` | `k12-education`, `post-secondary-education` | 6, 6 | 19, 23 | Verified |
| 4 | ICT / ITES | `ict-ites-bd` | `ict-services` | 5 | 9 | Verified |
| 5 | Energy | `energy-bd` | `energy` | 6 | 15 | Verified |
| 6 | Health | `health-bd` | `healthcare` | 15 | 15 | Verified |
| 7 | Logistics | `logistics-bd` | `port-and-maritime-sector` | 5 | 0 | Verified |
| 8 | E-commerce | `ecommerce-bd` | `retail` | **0** | **0** | Verified — **empty shell** |
| 9 | Sports | `sports-bd` | `indoor-sports` | 1 | 0 | Verified — thin |
| 10 | RMG / Textiles | `rmg-textiles-bd` | `ready-made-garments-rmg`, `circular-economy-textiles` | 3, 5 | 0, 0 | Verified |

### Empty shells (exist in DB, no landscapes — do not treat as mapped)

| Slug | Landscapes | Note |
|------|------------|------|
| `agriculture` | 0 | Use `agri-agro-processing` + `fisheries`, not this row |
| `education` | 0 | Use `k12-education` + `post-secondary-education` |
| `logistics` | 0 | Use `port-and-maritime-sector` for grant logistics work |
| `retail` | 0 | Only top-level slug for e-commerce today; **needs landscape build** |

**Target slugs** (`*-bd`) are grant naming only — **not** in `metadata_sector` yet.

---

## How analysts use this

| Role | Use the 10 sectors to |
|------|----------------------|
| **Data Ops** | Score orgs/products per sector; Coverage Snapshot grades all 10 (🟢/🟡/🔴) |
| **GTM Ops** | Tie posts and newsletter issues to sector stories |

**Discovery deliverable:** one row per grant sector — landscape count, org/product count, biggest gap.

---

*Last updated: 2026-07-08 (DB-verified)*
