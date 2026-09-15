# Jute and jute products sizing card

> **Track A (default pack `bd-gtm-consultant-7`).** Do not skip this family.

Generated from the platform sizing method catalog and pack `bd-gtm-consultant-7`. Do not fork a second method list.

| Field | Value |
|-------|-------|
| Pack | `bd-gtm-consultant-7` |
| Family | `jute` |
| Moncho slug(s) | `jute-natural-fibres` |
| Primary method | **Production × price** (`production_x_price`) |
| Secondary | `capacity_x_util_x_tariff`, `import_simple`, `demand_spend` |
| Formula | Output (MT/units) × post-harvest or yield factor × gate/FOB price |
| Required factor groups | volume (any of: stock, flow); price (any of: price) |
| Volume examples | Raw fibre / yarn MT; JDP sacks/hessian units; shoes/bags units |
| Price examples | Mill-gate; FOB $/unit; domestic retail if that is the pocket |
| Source families | BJMC; BJMA; EPB; BBS industrial sample; OEC HS 53 |
| Preferred domains | bjmc.gov.bd, bjma.org.bd, epb.gov.bd, bbs.gov.bd, oec.world |
| Expected landscapes | `jute-processing-goods` |
| Expected segments | `jute-raw-yarn`, `jute-diversified-products`, `jute-shoes-bags` |
| Ready when | Segment-grain volume × price for raw/yarn, JDP, and shoes/bags separately |
| Analyst must not | Stage or quote $820M as the sector size. Do not sell a jute TAM. |

## Grain rule

Facts must attach to **segment** (or a cited share-down from a named parent). Nationwide BBS, whole-economy export $, or a teaser TAM is not a segment size.

## Search queries (official domains first)

- `Bangladesh Jute and jute products Raw fibre / yarn MT site:bjmc.gov.bd OR site:bjma.org.bd OR site:epb.gov.bd`
- `Bangladesh Jute and jute products Mill-gate site:bjmc.gov.bd OR site:bjma.org.bd OR site:epb.gov.bd`
- `Bangladesh jute HS 53 export FOB site:epb.gov.bd OR site:bjmc.gov.bd OR site:oec.world`

Skip search if Exa/Tavily are unset. Do not swap providers. Label hits **primary** vs **secondary**. Weak/proxy = `not_usable_for_headline`.

## Submit

Stage **factors**, not TAM. Use `moncho_stage_market_facts` or `npm run submit -- --type market_fact`. Tag `dimensions.landscape_slug`, `dimensions.segment_slug`, `dimensions.sizing_method`, `dimensions.variable_family`. Never write `product_tam_breakdowns`.
