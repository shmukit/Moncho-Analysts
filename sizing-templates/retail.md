# E-commerce / retail sizing card

> **Grant-pack only.** Not in the paid Track A consultant-7 campaign. Pass `pack=bd-gtm-grant-10`.

Generated from the platform sizing method catalog and pack `bd-gtm-grant-10`. Do not fork a second method list.

| Field | Value |
|-------|-------|
| Pack | `bd-gtm-grant-10` |
| Family | `retail` |
| Moncho slug(s) | `retail` |
| Primary method | **Flow / GMV × take rate** (`flow_gmv_x_take`) |
| Secondary | `demand_spend` |
| Formula | Transaction value × platform or rail fee % |
| Required factor groups | gmv (any of: flow, value); take (any of: price, conversion) |
| Volume examples | Online shoppers; parcel volume; census units |
| Price examples | AOV; platform commission; delivery fee |
| Source families | BBS census; BB card e-commerce; HIES; platform disclosures |
| Preferred domains | bbs.gov.bd, bb.org.bd |
| Expected landscapes | live graph |
| Expected segments | live graph |
| Ready when | Landscape exists and GMV or shopper base + AOV is sourced |
| Analyst must not | E-commerce GMV as Retail TAM |

## Grain rule

Facts must attach to **segment** (or a cited share-down from a named parent). Nationwide BBS, whole-economy export $, or a teaser TAM is not a segment size.

## Search queries (official domains first)

- `Bangladesh E-commerce / retail Online shoppers site:bbs.gov.bd OR site:bb.org.bd`
- `Bangladesh E-commerce / retail AOV site:bbs.gov.bd OR site:bb.org.bd`
- `Bangladesh E-commerce / retail official statistics site:bbs.gov.bd OR site:bb.org.bd`

Skip search if Exa/Tavily are unset. Do not swap providers. Label hits **primary** vs **secondary**. Weak/proxy = `not_usable_for_headline`.

## Submit

Stage **factors**, not TAM. Use `moncho_stage_market_facts` or `npm run submit -- --type market_fact`. Tag `dimensions.landscape_slug`, `dimensions.segment_slug`, `dimensions.sizing_method`, `dimensions.variable_family`. Never write `product_tam_breakdowns`.
