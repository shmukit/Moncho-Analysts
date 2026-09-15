# RMG / textiles sizing card

> **Track A (default pack `bd-gtm-consultant-7`).** Do not skip this family.

Generated from the platform sizing method catalog and pack `bd-gtm-consultant-7`. Do not fork a second method list.

| Field | Value |
|-------|-------|
| Pack | `bd-gtm-consultant-7` |
| Family | `rmg` |
| Moncho slug(s) | `ready-made-garments-rmg` |
| Primary method | **Production × price** (`production_x_price`) |
| Secondary | `capacity_x_util_x_tariff`, `import_simple` |
| Formula | Output (MT/units) × post-harvest or yield factor × gate/FOB price |
| Required factor groups | volume (any of: stock, flow); price (any of: price) |
| Volume examples | Export units by HS; factory count; spindle capacity |
| Price examples | Average FOB $/unit; local fabric price |
| Source families | EPB; BGMEA; BB trade; BBS manufacturing |
| Preferred domains | epb.gov.bd, bgmea.com.bd, bb.org.bd, bbs.gov.bd |
| Expected landscapes | live graph |
| Expected segments | live graph |
| Ready when | Export or production series matches the product category, not whole-economy RMG for one micro-segment |
| Analyst must not | Whole-economy RMG export as a niche segment without a share rule |

## Grain rule

Facts must attach to **segment** (or a cited share-down from a named parent). Nationwide BBS, whole-economy export $, or a teaser TAM is not a segment size.

## Search queries (official domains first)

- `Bangladesh RMG / textiles Export units by HS site:epb.gov.bd OR site:bgmea.com.bd OR site:bb.org.bd`
- `Bangladesh RMG / textiles Average FOB $/unit site:epb.gov.bd OR site:bgmea.com.bd OR site:bb.org.bd`
- `Bangladesh RMG / textiles official statistics site:epb.gov.bd OR site:bgmea.com.bd OR site:bb.org.bd`

Skip search if Exa/Tavily are unset. Do not swap providers. Label hits **primary** vs **secondary**. Weak/proxy = `not_usable_for_headline`.

## Submit

Stage **factors**, not TAM. Use `moncho_stage_market_facts` or `npm run submit -- --type market_fact`. Tag `dimensions.landscape_slug`, `dimensions.segment_slug`, `dimensions.sizing_method`, `dimensions.variable_family`. Never write `product_tam_breakdowns`.
