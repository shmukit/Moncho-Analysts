# Education sizing card

> **Grant-pack only.** Not in the paid Track A consultant-7 campaign. Pass `pack=bd-gtm-grant-10`.

Generated from the platform sizing method catalog and pack `bd-gtm-grant-10`. Do not fork a second method list.

| Field | Value |
|-------|-------|
| Pack | `bd-gtm-grant-10` |
| Family | `education` |
| Moncho slug(s) | `k12-education`, `post-secondary-education` |
| Primary method | **Demand / spend (C×P×F×P)** (`demand_spend`) |
| Secondary | `installed_base_x_arpu` |
| Formula | Customers × penetration × frequency × unit price |
| Required factor groups | universe (any of: universe); penetration (any of: penetration); frequency (any of: frequency); price (any of: price) |
| Volume examples | Enrolled students by level; institutions |
| Price examples | Tuition; per-student spend; EdTech ARPU |
| Source families | BANBEIS; BBS/HIES; BTRC |
| Preferred domains | banbeis.gov.bd, banbeis.portal.gov.bd, bbs.gov.bd |
| Expected landscapes | live graph |
| Expected segments | live graph |
| Ready when | Headcount and median price for the same segment definition |
| Analyst must not | Unattended V2 sizing; grant-ten pack only |

## Grain rule

Facts must attach to **segment** (or a cited share-down from a named parent). Nationwide BBS, whole-economy export $, or a teaser TAM is not a segment size.

## Search queries (official domains first)

- `Bangladesh Education Enrolled students by level site:banbeis.gov.bd OR site:banbeis.portal.gov.bd OR site:bbs.gov.bd`
- `Bangladesh Education Tuition site:banbeis.gov.bd OR site:banbeis.portal.gov.bd OR site:bbs.gov.bd`
- `Bangladesh Education official statistics site:banbeis.gov.bd OR site:banbeis.portal.gov.bd OR site:bbs.gov.bd`

Skip search if Exa/Tavily are unset. Do not swap providers. Label hits **primary** vs **secondary**. Weak/proxy = `not_usable_for_headline`.

## Submit

Stage **factors**, not TAM. Use `moncho_stage_market_facts` or `npm run submit -- --type market_fact`. Tag `dimensions.landscape_slug`, `dimensions.segment_slug`, `dimensions.sizing_method`, `dimensions.variable_family`. Never write `product_tam_breakdowns`.
