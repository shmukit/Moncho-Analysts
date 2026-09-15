# Agri / agro-processing sizing card

> **Track A (default pack `bd-gtm-consultant-7`).** Do not skip this family.

Generated from the platform sizing method catalog and pack `bd-gtm-consultant-7`. Do not fork a second method list.

| Field | Value |
|-------|-------|
| Pack | `bd-gtm-consultant-7` |
| Family | `agri` |
| Moncho slug(s) | `agri-agro-processing`, `fisheries` |
| Primary method | **Production × price** (`production_x_price`) |
| Secondary | `import_simple` |
| Formula | Output (MT/units) × post-harvest or yield factor × gate/FOB price |
| Required factor groups | volume (any of: stock, flow); price (any of: price) |
| Volume examples | Production MT by crop/species; pond area; catch by species |
| Price examples | Harvest Tk/quintal; farm-gate; wholesale |
| Source families | BBS Statistical Yearbook; DoF fisheries; DAE; NBR/OEC |
| Preferred domains | bbs.gov.bd, fisheries.gov.bd, dae.gov.bd |
| Expected landscapes | live graph |
| Expected segments | live graph |
| Ready when | Crop or species production and price for the same FY, or a defensible import value |
| Analyst must not | Nationwide BBS as a niche crop without a share rule |

## Grain rule

Facts must attach to **segment** (or a cited share-down from a named parent). Nationwide BBS, whole-economy export $, or a teaser TAM is not a segment size.

## Search queries (official domains first)

- `Bangladesh Agri / agro-processing Production MT by crop/species site:bbs.gov.bd OR site:fisheries.gov.bd OR site:dae.gov.bd`
- `Bangladesh Agri / agro-processing Harvest Tk/quintal site:bbs.gov.bd OR site:fisheries.gov.bd OR site:dae.gov.bd`
- `Bangladesh Agri / agro-processing official statistics site:bbs.gov.bd OR site:fisheries.gov.bd OR site:dae.gov.bd`

Skip search if Exa/Tavily are unset. Do not swap providers. Label hits **primary** vs **secondary**. Weak/proxy = `not_usable_for_headline`.

## Submit

Stage **factors**, not TAM. Use `moncho_stage_market_facts` or `npm run submit -- --type market_fact`. Tag `dimensions.landscape_slug`, `dimensions.segment_slug`, `dimensions.sizing_method`, `dimensions.variable_family`. Never write `product_tam_breakdowns`.
