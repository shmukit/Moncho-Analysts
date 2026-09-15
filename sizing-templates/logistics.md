# Logistics sizing card

> **Track A (default pack `bd-gtm-consultant-7`).** Do not skip this family.

Generated from the platform sizing method catalog and pack `bd-gtm-consultant-7`. Do not fork a second method list.

| Field | Value |
|-------|-------|
| Pack | `bd-gtm-consultant-7` |
| Family | `logistics` |
| Moncho slug(s) | `port-and-maritime-sector`, `logistics`, `warehousing-and-storage`, `freight-forwarding-and-brokerage`, `express-and-courier-delivery`, `cargo-terminal-operations`, `logistics-execution-software-and-visibility` |
| Primary method | **Capacity × utilization × tariff** (`capacity_x_util_x_tariff`) |
| Secondary | `flow_gmv_x_take`, `installed_base_x_arpu`, `import_simple` |
| Formula | Physical capacity × use rate × fee |
| Required factor groups | capacity (any of: capacity); utilization (any of: conversion); tariff (any of: price) |
| Volume examples | TEU; freight ton-km; warehouse sq ft; registered trucks |
| Price examples | Handling charge; freight rate; warehousing $/pallet |
| Source families | CPA; Mongla Port; BB trade; road transport associations |
| Preferred domains | cpa.gov.bd, mpa.gov.bd, bb.org.bd |
| Expected landscapes | live graph |
| Expected segments | live graph |
| Ready when | Throughput and tariff from the same port or mode definition |
| Analyst must not | Port $4B year-2033 lump as today's TAM |

## Grain rule

Facts must attach to **segment** (or a cited share-down from a named parent). Nationwide BBS, whole-economy export $, or a teaser TAM is not a segment size.

## Search queries (official domains first)

- `Bangladesh Logistics TEU site:cpa.gov.bd OR site:mpa.gov.bd OR site:bb.org.bd`
- `Bangladesh Logistics Handling charge site:cpa.gov.bd OR site:mpa.gov.bd OR site:bb.org.bd`
- `Bangladesh Logistics official statistics site:cpa.gov.bd OR site:mpa.gov.bd OR site:bb.org.bd`

Skip search if Exa/Tavily are unset. Do not swap providers. Label hits **primary** vs **secondary**. Weak/proxy = `not_usable_for_headline`.

## Submit

Stage **factors**, not TAM. Use `moncho_stage_market_facts` or `npm run submit -- --type market_fact`. Tag `dimensions.landscape_slug`, `dimensions.segment_slug`, `dimensions.sizing_method`, `dimensions.variable_family`. Never write `product_tam_breakdowns`.
