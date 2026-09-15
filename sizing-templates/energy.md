# Energy sizing card

> **Track A (default pack `bd-gtm-consultant-7`).** Do not skip this family.

Generated from the platform sizing method catalog and pack `bd-gtm-consultant-7`. Do not fork a second method list.

| Field | Value |
|-------|-------|
| Pack | `bd-gtm-consultant-7` |
| Family | `energy` |
| Moncho slug(s) | `energy` |
| Primary method | **Capacity × utilization × tariff** (`capacity_x_util_x_tariff`) |
| Secondary | `production_x_price` |
| Formula | Physical capacity × use rate × fee |
| Required factor groups | capacity (any of: capacity); utilization (any of: conversion); tariff (any of: price) |
| Volume examples | Installed MW; generation GWh; LPG connections |
| Price examples | Bulk tariff; retail LPG; capex per MW |
| Source families | BPDB; Petrobangla; BERC; BBS energy tables |
| Preferred domains | bpdb.gov.bd, petrobangla.org.bd, berc.org.bd, bbs.gov.bd |
| Expected landscapes | live graph |
| Expected segments | live graph |
| Ready when | Capacity or volume series matches tariff year and customer class |
| Analyst must not | Nameplate capacity without utilization and tariff |

## Grain rule

Facts must attach to **segment** (or a cited share-down from a named parent). Nationwide BBS, whole-economy export $, or a teaser TAM is not a segment size.

## Search queries (official domains first)

- `Bangladesh Energy Installed MW site:bpdb.gov.bd OR site:petrobangla.org.bd OR site:berc.org.bd`
- `Bangladesh Energy Bulk tariff site:bpdb.gov.bd OR site:petrobangla.org.bd OR site:berc.org.bd`
- `Bangladesh Energy official statistics site:bpdb.gov.bd OR site:petrobangla.org.bd OR site:berc.org.bd`

Skip search if Exa/Tavily are unset. Do not swap providers. Label hits **primary** vs **secondary**. Weak/proxy = `not_usable_for_headline`.

## Submit

Stage **factors**, not TAM. Use `moncho_stage_market_facts` or `npm run submit -- --type market_fact`. Tag `dimensions.landscape_slug`, `dimensions.segment_slug`, `dimensions.sizing_method`, `dimensions.variable_family`. Never write `product_tam_breakdowns`.
