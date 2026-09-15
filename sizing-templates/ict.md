# ICT / ITES sizing card

> **Grant-pack only.** Not in the paid Track A consultant-7 campaign. Pass `pack=bd-gtm-grant-10`.

Generated from the platform sizing method catalog and pack `bd-gtm-grant-10`. Do not fork a second method list.

| Field | Value |
|-------|-------|
| Pack | `bd-gtm-grant-10` |
| Family | `ict` |
| Moncho slug(s) | `ict-services` |
| Primary method | **Installed base × ARPU** (`installed_base_x_arpu`) |
| Secondary | `import_simple`, `flow_gmv_x_take` |
| Formula | Countable stock × annual revenue per unit |
| Required factor groups | base (any of: universe, stock); arpu (any of: price) |
| Volume examples | ISP subs; enterprise seats; ITES headcount |
| Price examples | Monthly plan; SaaS seat; outsourcing $/FTE |
| Source families | BTRC; Hi-Tech Park Authority; company AR; trade HS |
| Preferred domains | btrc.gov.bd, htpa.gov.bd |
| Expected landscapes | live graph |
| Expected segments | live graph |
| Ready when | Addressable base and price for the same buyer type |
| Analyst must not | Hardware import lump as SaaS TAM |

## Grain rule

Facts must attach to **segment** (or a cited share-down from a named parent). Nationwide BBS, whole-economy export $, or a teaser TAM is not a segment size.

## Search queries (official domains first)

- `Bangladesh ICT / ITES ISP subs site:btrc.gov.bd OR site:htpa.gov.bd`
- `Bangladesh ICT / ITES Monthly plan site:btrc.gov.bd OR site:htpa.gov.bd`
- `Bangladesh ICT / ITES official statistics site:btrc.gov.bd OR site:htpa.gov.bd`

Skip search if Exa/Tavily are unset. Do not swap providers. Label hits **primary** vs **secondary**. Weak/proxy = `not_usable_for_headline`.

## Submit

Stage **factors**, not TAM. Use `moncho_stage_market_facts` or `npm run submit -- --type market_fact`. Tag `dimensions.landscape_slug`, `dimensions.segment_slug`, `dimensions.sizing_method`, `dimensions.variable_family`. Never write `product_tam_breakdowns`.
