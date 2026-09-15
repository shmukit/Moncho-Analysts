# Finance sizing card

> **Track A (default pack `bd-gtm-consultant-7`).** Do not skip this family.

Generated from the platform sizing method catalog and pack `bd-gtm-consultant-7`. Do not fork a second method list.

| Field | Value |
|-------|-------|
| Pack | `bd-gtm-consultant-7` |
| Family | `finance` |
| Moncho slug(s) | `financial-services` |
| Primary method | **Installed base × ARPU** (`installed_base_x_arpu`) |
| Secondary | `flow_gmv_x_take`, `top_down_share_down` |
| Formula | Countable stock × annual revenue per unit |
| Required factor groups | base (any of: universe, stock); arpu (any of: price) |
| Volume examples | Active accounts; MFS wallets; cards; loan book |
| Price examples | Interest margin; interchange; account fee; FX spread |
| Source families | Bangladesh Bank; BBS national accounts; ABB; bank AR |
| Preferred domains | bb.org.bd, idra.org.bd, bbs.gov.bd |
| Expected landscapes | live graph |
| Expected segments | live graph |
| Ready when | Countable base and a fee/ARPU series with the same year and currency |
| Analyst must not | Treat a BSY production row as useful for an MFS fee pool |

## Grain rule

Facts must attach to **segment** (or a cited share-down from a named parent). Nationwide BBS, whole-economy export $, or a teaser TAM is not a segment size.

## Search queries (official domains first)

- `Bangladesh Finance Active accounts site:bb.org.bd OR site:idra.org.bd OR site:bbs.gov.bd`
- `Bangladesh Finance Interest margin site:bb.org.bd OR site:idra.org.bd OR site:bbs.gov.bd`
- `Bangladesh Finance official statistics site:bb.org.bd OR site:idra.org.bd OR site:bbs.gov.bd`

Skip search if Exa/Tavily are unset. Do not swap providers. Label hits **primary** vs **secondary**. Weak/proxy = `not_usable_for_headline`.

## Submit

Stage **factors**, not TAM. Use `moncho_stage_market_facts` or `npm run submit -- --type market_fact`. Tag `dimensions.landscape_slug`, `dimensions.segment_slug`, `dimensions.sizing_method`, `dimensions.variable_family`. Never write `product_tam_breakdowns`.
