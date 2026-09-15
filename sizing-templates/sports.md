# Sports sizing card

> **Grant-pack only.** Not in the paid Track A consultant-7 campaign. Pass `pack=bd-gtm-grant-10`.

Generated from the platform sizing method catalog and pack `bd-gtm-grant-10`. Do not fork a second method list.

| Field | Value |
|-------|-------|
| Pack | `bd-gtm-grant-10` |
| Family | `sports` |
| Moncho slug(s) | `indoor-sports` |
| Primary method | **Demand / spend (C×P×F×P)** (`demand_spend`) |
| Secondary | `import_simple` |
| Formula | Customers × penetration × frequency × unit price |
| Required factor groups | universe (any of: universe); penetration (any of: penetration); frequency (any of: frequency); price (any of: price) |
| Volume examples | Facilities; memberships; event tickets |
| Price examples | Court-hour rate; membership fee |
| Source families | Trade HS 9506; facility surveys; consumer spend studies |
| Preferred domains | bbs.gov.bd |
| Expected landscapes | live graph |
| Expected segments | live graph |
| Ready when | Countable venues and observed pricing |
| Analyst must not | Equipment import as the whole sports market |

## Grain rule

Facts must attach to **segment** (or a cited share-down from a named parent). Nationwide BBS, whole-economy export $, or a teaser TAM is not a segment size.

## Search queries (official domains first)

- `Bangladesh Sports Facilities site:bbs.gov.bd`
- `Bangladesh Sports Court-hour rate site:bbs.gov.bd`
- `Bangladesh Sports official statistics site:bbs.gov.bd`

Skip search if Exa/Tavily are unset. Do not swap providers. Label hits **primary** vs **secondary**. Weak/proxy = `not_usable_for_headline`.

## Submit

Stage **factors**, not TAM. Use `moncho_stage_market_facts` or `npm run submit -- --type market_fact`. Tag `dimensions.landscape_slug`, `dimensions.segment_slug`, `dimensions.sizing_method`, `dimensions.variable_family`. Never write `product_tam_breakdowns`.
