# Health sizing card

> **Track A (default pack `bd-gtm-consultant-7`).** Do not skip this family.

Generated from the platform sizing method catalog and pack `bd-gtm-consultant-7`. Do not fork a second method list.

| Field | Value |
|-------|-------|
| Pack | `bd-gtm-consultant-7` |
| Family | `health` |
| Moncho slug(s) | `healthcare` |
| Primary method | **Demand / spend (C×P×F×P)** (`demand_spend`) |
| Secondary | `import_simple` |
| Formula | Customers × penetration × frequency × unit price |
| Required factor groups | universe (any of: universe); penetration (any of: penetration); frequency (any of: frequency); price (any of: price) |
| Volume examples | Beds; outpatient visits; pharmacy outlets |
| Price examples | Procedure cost; median drug price; consultation fee |
| Source families | DGHS HMSS; DGDA; BBS health accounts; WHO/WB when cited |
| Preferred domains | dghs.gov.bd, dgda.gov.bd, niport.gov.bd, bbs.gov.bd, who.int |
| Expected landscapes | live graph |
| Expected segments | live graph |
| Ready when | Utilization count and unit cost for the same care setting |
| Analyst must not | $19.4B / $13B healthcare headline |

## Grain rule

Facts must attach to **segment** (or a cited share-down from a named parent). Nationwide BBS, whole-economy export $, or a teaser TAM is not a segment size.

## Search queries (official domains first)

- `Bangladesh Health Beds site:dghs.gov.bd OR site:dgda.gov.bd OR site:niport.gov.bd`
- `Bangladesh Health Procedure cost site:dghs.gov.bd OR site:dgda.gov.bd OR site:niport.gov.bd`
- `Bangladesh Health official statistics site:dghs.gov.bd OR site:dgda.gov.bd OR site:niport.gov.bd`

Skip search if Exa/Tavily are unset. Do not swap providers. Label hits **primary** vs **secondary**. Weak/proxy = `not_usable_for_headline`.

## Submit

Stage **factors**, not TAM. Use `moncho_stage_market_facts` or `npm run submit -- --type market_fact`. Tag `dimensions.landscape_slug`, `dimensions.segment_slug`, `dimensions.sizing_method`, `dimensions.variable_family`. Never write `product_tam_breakdowns`.
