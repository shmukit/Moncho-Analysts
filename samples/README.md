# Analyst upload samples

Use these samples as the exact format for bulk or single uploads. **Do not change field names**; optional fields can be omitted.

## Available samples

| File | Description | Target table(s) |
|------|-------------|-----------------|
| `organization_sample.json` | One organization with sector/segment mapping | `organizations`, `organization_to_segment_map` |
| `landscape_sample.json` | Landscape with segments and TAM | `landscape_versions`, segments, TAM |
| `expert_sample.json` | Expert profile and segment mapping | `experts`, `expert_to_segment_map` |
| `product_sample.json` | Products and product images (two-table format) | `products`, `product_media` |
| `market_fact_sample.json` | One SML fact row for staging | `staging_market_facts` → `market_facts` |

---

## Product and product images (`product_sample.json`)

Product data is stored in two tables:

1. **`products`** – Master product record (name, group, category, description, hs_code).
2. **`product_media`** – Images for each product (logo, product_shot, bundle_shot). Rows reference a product via `product_id` and optionally align with pricing variants via `group_label`.

### Field reference

**Products (array `products`)**

| Field | Required | Description |
|-------|----------|-------------|
| `product_name` | Yes | Unique display name. |
| `product_group` | No | Logical group (e.g. "Educational Aids", "Science Kits"). |
| `product_category` | No | Category (e.g. "Early Learning", "Education"). |
| `product_description` | No | Short description. |
| `hs_code` | No | Harmonized System code if applicable. |

**Product media (array `product_media`)**

| Field | Required | Description |
|-------|----------|-------------|
| `product_name` | Yes* | Must match a `product_name` in `products` (used to resolve `product_id` on upload). Omit if providing `product_id` instead. |
| `product_id` | Yes* | UUID of the product in DB. Use when product is already created; otherwise use `product_name`. |
| `group_label` | Yes | Logical group / variant label (e.g. "Gazi-Flash-001"). Links to `product_metrics.group_label` when pricing is added. |
| `image_url` | Yes | Full URL of the image (logo or product shot). |
| `media_type` | No | One of: `logo`, `product_shot`, `bundle_shot`. Default: `logo`. |

\* Provide either `product_name` or `product_id` for each media row.

### Upload order

1. Insert **products** first (each row gets a `product_id`).
2. Insert **product_media** rows using the returned `product_id`, or the same `product_name` if your import supports name→id resolution.

### Media types

- **logo** – Brand or product line logo.
- **product_shot** – Main product image.
- **bundle_shot** – Image of a bundle or multi-item pack.
