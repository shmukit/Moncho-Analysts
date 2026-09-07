# Bangladesh Toys Product Harvest Review

Date: 2026-09-07  
Track: Bangladesh only — official local listing, BDT where published, `per unit`, existing Toys segment slugs.  
Status: **SUBMITTED via CLI** — 95/95 change requests accepted (batch1 50 + batch2 45). Pending artifacts: `data/pending/2026-09-07-toys-bd-products-batch{1,2}.json`. Track in My Work → Submissions.

## Schema rebuild note

The prior JSON stub retained only sample core fields and parked evidence in prose. That violated the Toys plan and IDE anti-pattern **P-15**. This rebuild puts organization linkage, source URL(s), sector/landscape/segment slugs, normalization/pricing, five Toys quality dimensions with rationales, totals, confidence, group labels, and logo/product-shot media into `toys_products.json`.

**Visitor-facing copy (P-16):** Dashboard fields (`product_description`, rationales, `price_note`) are phrased for website visitor customers, not analyst harvest notes. Process/fetch caveats stay in this review MD. Anti-pattern lock: `Shudipta/products/Toys/WHAT_NOT_TO_DO.md`. Mechanical QA requires a non-empty `_comment` on each product/media row (sample-root quirk); stubs are org+name / `Organization logo` / `Product image from the listing` only.

## Recheck log (2026-09-07)

| Check | Result |
| --- | --- |
| Stage 1 mechanical QA (`validate-analyst-data --type product`) | **238 PASS / 0 FAIL / 0 FLAGGED** (reconfirmed after HS + pricing-field alignment) |
| Product-image Tier 0 audit | **0 flagged / 4 review / 44 clean** — all 4 opaque-filename cards visually keep (house blocks, flower treehouse, piano gym, magnetic bars) |
| Schema consistency (scores mean, pricing_gap vs price, HTTPS, no LEGO, no dup labels) | **Pass** |
| P-16 jargon scan on Dashboard fields | **0 hits** |
| HS 2022 six-digit on every SKU | **Pass** — 95/95 coded (see HS table below) |
| SKU pricing guideline / Part 3c field shape | **Aligned** for BD track; no toys `template_id` (correct omit) |
| MCP coverage / duplicate lookup | **Skipped per HITL** — founder rejector handles duplicates |
| Stage 2 `--deep-check` | **Not run** (optional; needs search keys) |
| Submit readiness | File is review-grade; **do not** `npm run submit` until HITL says go. Bulk/Dashboard batches max **50** objects → split 95 SKUs into ≥2 batches |

Remaining soft gaps (not mechanical FAILs): thin product shots for ABC/ToguMogu/Hark/TeddyBear/EduAid as documented; many descriptions slightly under the plan’s 20–40-word band but shopper-facing.

## HS 2022 fill (2026-09-07)

Earlier, 44 SKUs omitted `hs_code` only because those shards were never coded—not because toys lack HS coverage. WCO/UNSD keep most toys under a single six-digit heading.

| Code | Use in this file |
| --- | --- |
| `950300` | Toys, dolls, stuffed animals, puzzles, construction sets, toy vehicles, STEM kits (80) |
| `950490` | Board / table / parlour games (Othello, Ludo, foosball, dominoes, tic-tac-toe, …) (7) |
| `950440` | Playing-card games (1) |
| `950640` | Table-tennis articles (1) |
| `950699` | Swimming / paddling pools (Intex 24") (1) |
| `940370` | Plastic children’s furniture (scholar table) (1) |
| `490300` | Children’s picture / drawing / colouring / activity books (3) |
| `490199` | Other printed study books (Bangla–Arabic–English study book) (1) |

All 95 rows now have a six-digit HS 2022 code. National 8–10 digit splits (e.g. stuffed vs dolls) are not used—Moncho asks for HS6.

## SKU pricing guideline check (updated guide + Part 3c)

Against `docs/reference/SKU_PRICING_SUBMISSION_GUIDE.md` and `PRODUCT_ORG_RUBRICS.md` Part 3c (and F&B as the aligned precedent):

| Rule | Toys status |
| --- | --- |
| BD track only (`country_code=BD`, BDT when priced) | **Aligned** — every row now has `country_code: BD`; priced rows `currency: BDT` |
| Named SKU, official URL, 5–15 / org | **Aligned** (Hark = 2: thin public catalog) |
| Numeric price or explicit `pricing_gap` | **Aligned** — 75 priced / 20 gaps; no invented prices |
| `variant_unit` + normalization | **Aligned** — `variant_unit` / `normalization_unit`: `per unit` |
| `price` / `list_price` / `price_kind` | **Aligned** — mirrors F&B; sale notes set promotional `price` vs prior `list_price` |
| Part 3c `metadata.template_id` | **N/A — omit** — Toys is not in the Part 3c template table; do not invent an id (A-03). Pricing object = named retail toy unit |
| No Pass 2 open-web price fill | **Aligned** |
| No aggregator / global brochure on reseller | **Aligned** (Sundora LEGO already excluded) |
| Live duplicate MCP before CREATE | **Deferred per HITL** — founder rejector handles duplicates |

Duplicate MCP lookup is intentionally skipped going forward per analyst instruction.



Canonical product dimensions:

1. `play_engagement_score`
2. `developmental_value_score`
3. `age_fit_usability_score`
4. `product_execution_score`
5. `safety_responsibility_score`

`quality_score` = mean of the five, one decimal. `product_intelligence_total` = sum. Price is never inside quality.

## Counts


| Metric                  | Value |
| ----------------------- | ----- |
| Products                | 95    |
| Organizations with SKUs | 9     |
| Priced (BDT)            | 75    |
| Pricing gaps            | 20    |
| Logo media              | 95    |
| Product shots           | 48    |
| Action A                | 10    |
| Action B                | 17    |
| Action C                | 37    |
| Action D                | 31    |




## Organization ledger


| Organization                 | Website                                                                          | Accepted | Priced | Gaps | Shots | Notes                                                          |
| ---------------------------- | -------------------------------------------------------------------------------- | -------- | ------ | ---- | ----- | -------------------------------------------------------------- |
| United ABC Ltd (ABC Toys)    | [https://unitedabcltd.com/branded-toys/](https://unitedabcltd.com/branded-toys/) | 15       | 15     | 0    | 3     | Catalogued under current named-offering policy                 |
| ToguMogu                     | [https://togumogu.com](https://togumogu.com)                                     | 8        | 8      | 0    | 0     | Catalogued under current named-offering policy                 |
| Aman Plastic Toys Industries | [https://amantoys.com](https://amantoys.com)                                     | 15       | 0      | 15   | 14    | Catalogued under current named-offering policy                 |
| Hark Group                   | [https://www.harkbd.com](https://www.harkbd.com)                                 | 2        | 2      | 0    | 0     | Catalogued; product shots omitted after unreachable-image flag |
| RFL Group (Playtime Toys)    | [https://www.rflbd.com](https://www.rflbd.com)                                   | 5        | 0      | 5    | 5     | Catalogued under current named-offering policy                 |
| EduAid (Toys Island)         | [https://toysisland.com.bd](https://toysisland.com.bd)                           | 15       | 15     | 0    | 1     | Catalogued under current named-offering policy                 |
| Kids Republic                | [https://kidsrepublicbd.com](https://kidsrepublicbd.com)                         | 15       | 15     | 0    | 15    | Catalogued under current named-offering policy                 |
| TeddyBear BD                 | [https://teddybearbd.com](https://teddybearbd.com)                               | 10       | 10     | 0    | 0     | Catalogued under current named-offering policy                 |
| Toyzone BD                   | [https://www.toyzonebd.com](https://www.toyzonebd.com)                           | 10       | 10     | 0    | 10    | Catalogued under current named-offering policy                 |




## Live orgs without accepted SKUs in this file


| Organization                   | Reason                                                                    |
| ------------------------------ | ------------------------------------------------------------------------- |
| Sundora Toys (LEGO SKUs)       | 12 LEGO listings stripped: no explicit evidence Sundora is LEGO’s official partner in Bangladesh (site “100% AUTHENTIC” / brand merchandising insufficient). Re-admit only with clear official-partner attestation. |
| Badhon Toy Garden              | Domain redirects to expired-domain listing                                |
| Cupcake Exports Ltd            | Official pages returned HTTP 500; no accessible local BDT listing         |
| Golden Son Limited             | Official entry/shop paths returned HTTP 500                               |
| Pebblechild Bangladesh Ltd     | Official site quotes GBP / wholesale routing, not BD retail BDT           |
| Other inaccessible storefronts | Retained as exclusions until an official named local listing is reachable |




## Media policy

- One logo row per product where an official mark was recoverable.
- Product shots included only from exact SKU/page/catalogue assets with HTTPS URLs.
- TeddyBear BD: logo only (empty on-page product image sources).
- ToguMogu: logo only (SPA shell; no exact product image).
- Aman `Black Knife Gun`: logo only (CMS image conflict).
- Hark Group: logo only after mechanical QA flagged both product-shot URLs unreachable.
- Re-run contact-sheet audit after any media change before Dashboard CREATE.



## Product register



### United ABC Ltd (ABC Toys)


| Product                                                        | Source                                                                                                                                                                                                                       | Price       | Segments                                                                                                                        | D1–D5     | QS  | Action | Shot |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------- | --------- | --- | ------ | ---- |
| Zephyr Robotix (01027)                                         | [https://abctoysbd.com/products/zephyr-01027-robotix-0](https://abctoysbd.com/products/zephyr-01027-robotix-0)                                                                                                               | BDT 1,782   | traditional-toys-games, toy-educational-stem, toy-childhood-teen, manual-static-toys, toy-online-digital                        | 4/4/3/4/2 | 3.4 | B      | yes  |
| Toybliss Intelligent Phone with Sounds (HE0508)                | [https://abctoysbd.com/products/toybliss-intelligent-phone-fun-learning](https://abctoysbd.com/products/toybliss-intelligent-phone-fun-learning)                                                                             | BDT 945     | digital-interactive-toys, toy-educational-stem, electric-battery-toys, toy-online-digital                                       | 2/2/1/2/2 | 1.8 | C      | logo |
| Minecraft HXT72 Rise of The Warden Playset                     | [https://abctoysbd.com/products/minecraft-hxt72-rise-of-the-warden-playset](https://abctoysbd.com/products/minecraft-hxt72-rise-of-the-warden-playset)                                                                       | BDT 6,127.5 | traditional-toys-games, manual-static-toys, toy-online-digital                                                                  | 2/1/1/2/2 | 1.6 | C      | logo |
| Barbie HJY95 Science Lab Playset                               | [https://abctoysbd.com/products/barbie-hjy95-science-lab-playset-with-2-dolls-lab-bench-and-accessories](https://abctoysbd.com/products/barbie-hjy95-science-lab-playset-with-2-dolls-lab-bench-and-accessories)             | BDT 7,581   | traditional-toys-games, toy-social-emotional, manual-static-toys, toy-online-digital                                            | 3/2/1/3/2 | 2.2 | C      | logo |
| Fisher-Price CGM43 Laugh & Learn Animal Puzzle Assortment      | [https://abctoysbd.com/products/fisher-price-cgm43-l-l-learning-puzzle-ages-6-36m](https://abctoysbd.com/products/fisher-price-cgm43-l-l-learning-puzzle-ages-6-36m)                                                         | BDT 3,160   | traditional-toys-games, toy-educational-stem, toy-early-development, toy-childhood-teen, manual-static-toys, toy-online-digital | 4/5/4/3/2 | 3.6 | B      | yes  |
| Funskool Travel Chinese Checkers                               | [https://abctoysbd.com/products/funskool-travel-chinese-checkers](https://abctoysbd.com/products/funskool-travel-chinese-checkers)                                                                                           | BDT 395     | traditional-toys-games, manual-static-toys, toy-online-digital                                                                  | 3/1/1/2/2 | 1.8 | C      | logo |
| Hot Wheels HYY60 Slide Kick Let's Race                         | [https://abctoysbd.com/products/hot-wheels-hyy60-91-gmc-syclone](https://abctoysbd.com/products/hot-wheels-hyy60-91-gmc-syclone)                                                                                             | BDT 632.7   | traditional-toys-games, manual-static-toys, toy-online-digital                                                                  | 2/1/1/1/2 | 1.4 | D      | logo |
| Hot Wheels HYY53 Power Rocket Let's Race                       | [https://abctoysbd.com/products/hot-wheels-hyy53-power-rocket-let-s-race](https://abctoysbd.com/products/hot-wheels-hyy53-power-rocket-let-s-race)                                                                           | BDT 527.25  | traditional-toys-games, manual-static-toys, toy-online-digital                                                                  | 2/1/1/2/2 | 1.6 | C      | logo |
| Hot Wheels BHR15 Color Shifters 1:64 Scale                     | [https://abctoysbd.com/products/hot-wheels-bhr15-color-shifters-1-64-scale-transforming-vehicles-assortment](https://abctoysbd.com/products/hot-wheels-bhr15-color-shifters-1-64-scale-transforming-vehicles-assortment)     | BDT 854.05  | traditional-toys-games, manual-static-toys, toy-online-digital                                                                  | 3/1/1/2/2 | 1.8 | C      | logo |
| JADA 35404 Fast & Furious Blind Pack Nano Cars                 | [https://abctoysbd.com/products/jada-35404-fast-furious-blind-pack-nano-cars](https://abctoysbd.com/products/jada-35404-fast-furious-blind-pack-nano-cars)                                                                   | BDT 495     | traditional-toys-games, manual-static-toys, toy-online-digital                                                                  | 2/1/1/2/2 | 1.6 | C      | logo |
| Jurassic World HRX52 Mission Mayhem Truck Set                  | [https://abctoysbd.com/products/jurassic-world-hrx52-mission-mayhem-truck-set](https://abctoysbd.com/products/jurassic-world-hrx52-mission-mayhem-truck-set)                                                                 | BDT 4,725   | traditional-toys-games, manual-static-toys, toy-online-digital                                                                  | 4/2/1/3/2 | 2.4 | C      | yes  |
| Jurassic World HTP62 Legacy Collection Barry Sembene ATV Chase | [https://abctoysbd.com/products/jurassic-world-htp62-legacy-collection-barry-sembene-atv-chase-action-figures](https://abctoysbd.com/products/jurassic-world-htp62-legacy-collection-barry-sembene-atv-chase-action-figures) | BDT 6,631   | traditional-toys-games, manual-static-toys, toy-online-digital                                                                  | 3/1/1/3/2 | 2   | C      | logo |
| Jurassic World JDC39 Mighty Little Biter Assortment            | [https://abctoysbd.com/products/jurassic-world-jdc39-mighty-little-biter-asst](https://abctoysbd.com/products/jurassic-world-jdc39-mighty-little-biter-asst)                                                                 | BDT 1,187.5 | traditional-toys-games, manual-static-toys, toy-online-digital                                                                  | 2/1/1/2/2 | 1.6 | C      | logo |
| Toybliss WINSOO RC Police Car with Lights & Music (998-6)      | [https://abctoysbd.com/products/toybliss-winsoo-rc-police-car-998-6](https://abctoysbd.com/products/toybliss-winsoo-rc-police-car-998-6)                                                                                     | BDT 1,881   | traditional-toys-games, electric-battery-toys, toy-online-digital                                                               | 3/1/1/2/2 | 1.8 | C      | logo |
| Toybliss Stunt Monster RC Car with Lights & Sounds (CQ-623)    | [https://abctoysbd.com/products/toybliss-stunt-monster-rc-car-cq-623](https://abctoysbd.com/products/toybliss-stunt-monster-rc-car-cq-623)                                                                                   | BDT 1,852.5 | traditional-toys-games, electric-battery-toys, toy-online-digital                                                               | 3/1/1/2/2 | 1.8 | C      | logo |




### ToguMogu


| Product                                                     | Source                                                                                                                                                                             | Price     | Segments                                   | D1–D5     | QS  | Action | Shot |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------ | --------- | --- | ------ | ---- |
| Hot Wheels GBF89 Launch Across Challenge                    | [https://togumogu.com/products/hot-wheels-gbf89-launch-across-challenge](https://togumogu.com/products/hot-wheels-gbf89-launch-across-challenge)                                   | BDT 3,450 | traditional-toys-games, toy-online-digital | 1/1/1/1/1 | 1   | D      | logo |
| Magnetic Tiles 69 pcs                                       | [https://togumogu.com/products/magnetic-tiles-69-pcs](https://togumogu.com/products/magnetic-tiles-69-pcs)                                                                         | BDT 1,790 | traditional-toys-games, toy-online-digital | 1/1/1/1/1 | 1   | D      | logo |
| Funskool Travel Othello                                     | [https://togumogu.com/products/funskool-travel-othello](https://togumogu.com/products/funskool-travel-othello)                                                                     | BDT 1,090 | traditional-toys-games, toy-online-digital | 1/1/1/1/1 | 1   | D      | logo |
| Play-Doh Playful Pies Set                                   | [https://togumogu.com/products/buy-play-doh-playful-pies-set-bangladesh](https://togumogu.com/products/buy-play-doh-playful-pies-set-bangladesh)                                   | BDT 1,450 | toy-arts-creative, toy-online-digital      | 1/1/1/1/1 | 1   | D      | logo |
| National Geographic 10207 Lion Panda & Sea Turtle 3D Puzzle | [https://togumogu.com/products/national-geographic-10207-lion-panda-sea-turtle-3d-puzzle](https://togumogu.com/products/national-geographic-10207-lion-panda-sea-turtle-3d-puzzle) | BDT 1,850 | traditional-toys-games, toy-online-digital | 1/1/1/1/1 | 1   | D      | logo |
| Mega Bloks DCH63 Big Building Bag                           | [https://togumogu.com/products/mega-bloks-dch63-big-building-bag-1](https://togumogu.com/products/mega-bloks-dch63-big-building-bag-1)                                             | BDT 3,450 | traditional-toys-games, toy-online-digital | 1/1/1/1/1 | 1   | D      | logo |
| Hot Wheels FWM85/FWM87 Classic Stunt Set 2                  | [https://togumogu.com/products/hot-wheels-fwm85-fwm87-classic-stunt-set-2](https://togumogu.com/products/hot-wheels-fwm85-fwm87-classic-stunt-set-2)                               | BDT 980   | traditional-toys-games, toy-online-digital | 1/1/1/1/1 | 1   | D      | logo |
| Barbie HPT50 Ken Surfboard Set Dress-Up Doll                | [https://togumogu.com/products/barbie-hpt50-ken-surfboard-set-dress-up-doll](https://togumogu.com/products/barbie-hpt50-ken-surfboard-set-dress-up-doll)                           | BDT 3,450 | traditional-toys-games, toy-online-digital | 1/1/1/1/1 | 1   | D      | logo |




### Aman Plastic Toys Industries


| Product                  | Source                                                                                       | Price | Segments               | D1–D5     | QS  | Action | Shot |
| ------------------------ | -------------------------------------------------------------------------------------------- | ----- | ---------------------- | --------- | --- | ------ | ---- |
| 999 Gun                  | [https://amantoys.com/category/gun/products](https://amantoys.com/category/gun/products)     | gap   | traditional-toys-games | 2/1/1/2/1 | 1.4 | D      | yes  |
| Laser Fire Gun           | [https://amantoys.com/category/gun/products](https://amantoys.com/category/gun/products)     | gap   | traditional-toys-games | 2/1/1/2/1 | 1.4 | D      | yes  |
| Superior Pistol          | [https://amantoys.com/category/gun/products](https://amantoys.com/category/gun/products)     | gap   | traditional-toys-games | 2/1/1/2/1 | 1.4 | D      | yes  |
| 189 Box                  | [https://amantoys.com/category/gun/products](https://amantoys.com/category/gun/products)     | gap   | traditional-toys-games | 2/1/1/2/1 | 1.4 | D      | yes  |
| 189 Poly                 | [https://amantoys.com/category/gun/products](https://amantoys.com/category/gun/products)     | gap   | traditional-toys-games | 2/1/1/2/1 | 1.4 | D      | yes  |
| Music Knife Gun          | [https://amantoys.com/category/gun/products](https://amantoys.com/category/gun/products)     | gap   | traditional-toys-games | 2/1/1/2/1 | 1.4 | D      | yes  |
| 666                      | [https://amantoys.com/category/gun/products](https://amantoys.com/category/gun/products)     | gap   | traditional-toys-games | 2/1/1/2/1 | 1.4 | D      | yes  |
| Army 222                 | [https://amantoys.com/category/gun/products](https://amantoys.com/category/gun/products)     | gap   | traditional-toys-games | 2/1/1/2/1 | 1.4 | D      | yes  |
| Black Knife Gun          | [https://amantoys.com/category/gun/products](https://amantoys.com/category/gun/products)     | gap   | traditional-toys-games | 2/1/1/2/1 | 1.4 | D      | logo |
| Army Knife Gun           | [https://amantoys.com/category/gun/products](https://amantoys.com/category/gun/products)     | gap   | traditional-toys-games | 2/1/1/2/1 | 1.4 | D      | yes  |
| Mini Magazine (Black)    | [https://amantoys.com/category/gun/products](https://amantoys.com/category/gun/products)     | gap   | traditional-toys-games | 2/1/1/2/1 | 1.4 | D      | yes  |
| 2020 Gun                 | [https://amantoys.com/category/gun/products](https://amantoys.com/category/gun/products)     | gap   | traditional-toys-games | 2/1/1/2/1 | 1.4 | D      | yes  |
| Small Poly Guitar & Doll | [https://amantoys.com/category/music/products](https://amantoys.com/category/music/products) | gap   | traditional-toys-games | 2/2/1/2/2 | 1.8 | C      | yes  |
| Piano                    | [https://amantoys.com/category/music/products](https://amantoys.com/category/music/products) | gap   | traditional-toys-games | 2/2/1/2/2 | 1.8 | C      | yes  |
| Rock Band Guitar         | [https://amantoys.com/category/music/products](https://amantoys.com/category/music/products) | gap   | traditional-toys-games | 2/2/1/2/2 | 1.8 | C      | yes  |




### Hark Group


| Product            | Source                                                                                                         | Price   | Segments                                                                                 | D1–D5     | QS  | Action | Shot |
| ------------------ | -------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------- | --------- | --- | ------ | ---- |
| Fishing Game-786-2 | [https://harkmart.com/product/fishing-game-786-2-copy/](https://harkmart.com/product/fishing-game-786-2-copy/) | BDT 265 | traditional-toys-games, toy-early-development, toy-online-digital, electric-battery-toys | 3/2/3/3/3 | 2.8 | B      | yes  |
| Toy Rifle-1003     | [https://harkmart.com/product/toy-rifle-1003/](https://harkmart.com/product/toy-rifle-1003/)                   | BDT 115 | traditional-toys-games, toy-childhood-teen, toy-online-digital, manual-static-toys       | 2/1/3/3/3 | 2.4 | C      | yes  |




### RFL Group (Playtime Toys)


| Product                  | Source                                                                                                                                         | Price | Segments                                                          | D1–D5     | QS  | Action | Shot |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------- | --------- | --- | ------ | ---- |
| Scholar Table With Chair | [https://www.rflbd.com/product/3-year-+/scholar-table-with-chair](https://www.rflbd.com/product/3-year-+/scholar-table-with-chair)             | gap   | toy-childhood-teen, manual-static-toys                            | 2/3/4/4/4 | 3.4 | B      | yes  |
| Table Tennis Bat         | [https://rflbd.com/product/3-year-+/table-tennis-bat](https://rflbd.com/product/3-year-+/table-tennis-bat)                                     | gap   | toy-active-physical, toy-childhood-teen, manual-static-toys       | 3/3/3/4/4 | 3.4 | A      | yes  |
| Fantasy Animal (Jungle)  | [https://www.rflbd.com/product/less-than-1-year/fantasy-animal(jungle)](https://www.rflbd.com/product/less-than-1-year/fantasy-animal(jungle)) | gap   | traditional-toys-games, toy-early-development, manual-static-toys | 3/2/3/4/4 | 3.2 | A      | yes  |
| Merry Go Round           | [https://www.rflbd.com/product/3-year-+/merry-go-round](https://www.rflbd.com/product/3-year-+/merry-go-round)                                 | gap   | toy-active-physical, toy-early-development, manual-static-toys    | 3/3/3/4/4 | 3.4 | A      | yes  |
| Yo Yo Slider             | [https://rflbd.com/product/3-year-+/yo-yo-slider](https://rflbd.com/product/3-year-+/yo-yo-slider)                                             | gap   | toy-active-physical, toy-childhood-teen, manual-static-toys       | 3/3/3/4/4 | 3.4 | A      | yes  |




### EduAid (Toys Island)


| Product                                           | Source                                                                                                                                               | Price                                                                                                              | Segments                                                                                                 | D1–D5                                                                                | QS        | Action | Shot |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------- | ------ | ---- |
| Bangla-Arabic-English Intelligence Study Book     | [https://toysisland.com.bd/product/Bangla-Intelligence-Study-Book](https://toysisland.com.bd/product/Bangla-Intelligence-Study-Book)                 | BDT 1,350                                                                                                          | toy-educational-stem, manual-static-toys, toy-online-digital                                             | 2/2/1/2/1                                                                            | 1.6       | C      | logo |
| Kids LCD Multi-Color Writing and Drawing Tablet   | [https://toysisland.com.bd/product/kids-LCD-drawing-tablet](https://toysisland.com.bd/product/kids-LCD-drawing-tablet)                               | BDT 350                                                                                                            | toy-arts-creative, electric-battery-toys, toy-online-digital                                             | 2/2/1/2/1                                                                            | 1.6       | C      | logo |
| Bangladesh District Map Puzzle – GeoPuzzle Series | EduToy                                                                                                                                               | [https://toysisland.com.bd/product/bangladesh-map-puzzle](https://toysisland.com.bd/product/bangladesh-map-puzzle) | BDT 550                                                                                                  | traditional-toys-games, toy-educational-stem, manual-static-toys, toy-online-digital | 3/3/1/2/1 | 2      | C    |
| Shape Shorter & Stacking (Square)                 | [https://toysisland.com.bd/product/shape-shorter-stacking-square](https://toysisland.com.bd/product/shape-shorter-stacking-square)                   | BDT 590                                                                                                            | traditional-toys-games, toy-educational-stem, manual-static-toys, toy-online-digital                     | 2/2/1/2/1                                                                            | 1.6       | C      | logo |
| Wooden Tic Tac Toe                                | [https://toysisland.com.bd/product/wooden-magnetic-diy-toy](https://toysisland.com.bd/product/wooden-magnetic-diy-toy)                               | BDT 260                                                                                                            | traditional-toys-games, manual-static-toys, toy-online-digital                                           | 2/2/1/2/1                                                                            | 1.6       | C      | logo |
| Wooden Intelligence Puzzle                        | [https://toysisland.com.bd/product/wooden-intelligence](https://toysisland.com.bd/product/wooden-intelligence)                                       | BDT 390                                                                                                            | traditional-toys-games, toy-educational-stem, toy-childhood-teen, manual-static-toys, toy-online-digital | 3/4/3/3/1                                                                            | 2.8       | C      | yes  |
| Pretend Fruits Cutting Toy                        | [https://toysisland.com.bd/product/Pretend-Fruits-Cutting-Toy](https://toysisland.com.bd/product/Pretend-Fruits-Cutting-Toy)                         | BDT 850                                                                                                            | traditional-toys-games, toy-social-emotional, manual-static-toys, toy-online-digital                     | 2/2/1/2/1                                                                            | 1.6       | C      | logo |
| Wooden Dominos (100 pcs)                          | [https://toysisland.com.bd/product/wooden-dominos-(100-pcs)](https://toysisland.com.bd/product/wooden-dominos-(100-pcs))                             | BDT 450                                                                                                            | traditional-toys-games, manual-static-toys, toy-online-digital                                           | 3/2/1/3/1                                                                            | 2         | C      | logo |
| Wooden Rainbow Tower                              | [https://toysisland.com.bd/product/wooden-rainbow-tower](https://toysisland.com.bd/product/wooden-rainbow-tower)                                     | BDT 350                                                                                                            | traditional-toys-games, toy-educational-stem, manual-static-toys, toy-online-digital                     | 2/2/1/2/1                                                                            | 1.6       | C      | logo |
| 15 Holes Shape Recognition Intelligence Box       | [https://toysisland.com.bd/product/15-holes-shape-box](https://toysisland.com.bd/product/15-holes-shape-box)                                         | BDT 990                                                                                                            | traditional-toys-games, toy-educational-stem, manual-static-toys, toy-online-digital                     | 3/3/1/3/1                                                                            | 2.2       | C      | logo |
| 120 Mosaic Puzzle                                 | [https://toysisland.com.bd/product/120-mosaic-puzzle](https://toysisland.com.bd/product/120-mosaic-puzzle)                                           | BDT 990                                                                                                            | traditional-toys-games, toy-educational-stem, manual-static-toys, toy-online-digital                     | 3/3/1/3/1                                                                            | 2.2       | C      | logo |
| SoDo Board Game & Soru Comics Book Combo          | [https://toysisland.com.bd/product/SoDo-Board-Game-Soru-Comics-Book-Combo](https://toysisland.com.bd/product/SoDo-Board-Game-Soru-Comics-Book-Combo) | BDT 300                                                                                                            | traditional-toys-games, manual-static-toys, toy-online-digital                                           | 3/2/1/3/1                                                                            | 2         | C      | logo |
| Sodo: A Ludo Board Game                           | [https://toysisland.com.bd/product/Sodo-A-ludo-Board-Game](https://toysisland.com.bd/product/Sodo-A-ludo-Board-Game)                                 | BDT 160                                                                                                            | traditional-toys-games, manual-static-toys, toy-online-digital                                           | 3/2/1/2/1                                                                            | 1.8       | C      | logo |
| SuperKid Climate Hero Card Game                   | [https://toysisland.com.bd/product/superKid-climate-hero-card-game](https://toysisland.com.bd/product/superKid-climate-hero-card-game)               | BDT 350                                                                                                            | traditional-toys-games, toy-educational-stem, manual-static-toys, toy-online-digital                     | 3/3/1/2/1                                                                            | 2         | C      | logo |
| Stick & Ring Puzzle                               | [https://toysisland.com.bd/product/stick-amp-ring-puzzle](https://toysisland.com.bd/product/stick-amp-ring-puzzle)                                   | BDT 850                                                                                                            | traditional-toys-games, toy-educational-stem, manual-static-toys, toy-online-digital                     | 3/2/1/2/1                                                                            | 1.8       | C      | logo |




### Kids Republic


| Product                                                                                                       | Source                                                                                                                                                                                                                                                                                             | Price     | Segments                                                                                                                        | D1–D5     | QS  | Action | Shot |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- | --------- | --- | ------ | ---- |
| Mini Children Portable Microscope + 12 Slides                                                                 | [https://kidsrepublicbd.com/product/kids-microscope-with-12-slides/](https://kidsrepublicbd.com/product/kids-microscope-with-12-slides/)                                                                                                                                                           | BDT 1,450 | traditional-toys-games, toy-childhood-teen, toy-online-digital, toy-educational-stem, manual-static-toys                        | 3/3/3/3/2 | 2.8 | B      | yes  |
| Educational Toys Science Engineering Robot Kit for School Robot Toys Educational Game Kids Programming (Copy) | [https://kidsrepublicbd.com/product/educational-toys-science-engineering-robot-kit-for-school-robot-toys-educational-game-kids-programming-copy/](https://kidsrepublicbd.com/product/educational-toys-science-engineering-robot-kit-for-school-robot-toys-educational-game-kids-programming-copy/) | BDT 2,200 | traditional-toys-games, toy-childhood-teen, toy-online-digital, toy-educational-stem, electric-battery-toys                     | 4/4/3/4/2 | 3.4 | B      | yes  |
| Baby Cognitive Skill Development Fishing Game – For Newborns to Toddlers                                      | [https://kidsrepublicbd.com/product/baby-fishing-game/](https://kidsrepublicbd.com/product/baby-fishing-game/)                                                                                                                                                                                     | BDT 1,100 | traditional-toys-games, toy-early-development, toy-childhood-teen, toy-online-digital, toy-educational-stem, manual-static-toys | 4/4/2/3/3 | 3.2 | A      | yes  |
| DIY Pipe Blocks – 100 Pcs Box + Catalogue – For Age 2+                                                        | [https://kidsrepublicbd.com/product/diy-pipe-blocks-2/](https://kidsrepublicbd.com/product/diy-pipe-blocks-2/)                                                                                                                                                                                     | BDT 1,150 | traditional-toys-games, toy-early-development, toy-childhood-teen, toy-online-digital, toy-educational-stem, manual-static-toys | 4/4/4/4/3 | 3.8 | A      | yes  |
| Premium Quality DIY House Building Blocks – 100 Pcs Box + Catalogue + 30 Windows – For Age 2+                 | [https://kidsrepublicbd.com/product/diy-pipe-blocks/](https://kidsrepublicbd.com/product/diy-pipe-blocks/)                                                                                                                                                                                         | BDT 1,500 | traditional-toys-games, toy-early-development, toy-childhood-teen, toy-online-digital, toy-educational-stem, manual-static-toys | 4/4/4/4/3 | 3.8 | A      | yes  |
| Science Engineering Car DIY Programmable Robot Kit                                                            | [https://kidsrepublicbd.com/product/programmable-robot-kit/](https://kidsrepublicbd.com/product/programmable-robot-kit/)                                                                                                                                                                           | BDT 2,100 | digital-interactive-toys, toy-childhood-teen, toy-online-digital, toy-educational-stem, smart-connected-toys                    | 3/4/3/3/2 | 3   | B      | yes  |
| Flower Garden Building Blocks – Miniature Puzzle Blocks – 625 PCS                                             | [https://kidsrepublicbd.com/product/flower-garden-building-blocks/](https://kidsrepublicbd.com/product/flower-garden-building-blocks/)                                                                                                                                                             | BDT 1,180 | traditional-toys-games, toy-childhood-teen, toy-online-digital, toy-educational-stem, manual-static-toys                        | 4/3/2/4/2 | 3   | B      | yes  |
| Baby Stacking Tower Montessori Learning Toy                                                                   | [https://kidsrepublicbd.com/product/baby-stacking-tower-educational-toy-bd/](https://kidsrepublicbd.com/product/baby-stacking-tower-educational-toy-bd/)                                                                                                                                           | BDT 1,250 | traditional-toys-games, toy-early-development, toy-online-digital, toy-educational-stem                                         | 3/4/4/3/2 | 3.2 | B      | yes  |
| Felt Board for Kids – Social Emotional Preschool Learning Activities                                          | [https://kidsrepublicbd.com/product/zoo-felt-board-suit-preschool-children-early-education-learning-board-cartoon-educational/](https://kidsrepublicbd.com/product/zoo-felt-board-suit-preschool-children-early-education-learning-board-cartoon-educational/)                                     | BDT 1,800 | traditional-toys-games, toy-early-development, toy-childhood-teen, toy-online-digital, toy-social-emotional, manual-static-toys | 4/4/4/4/3 | 3.8 | A      | yes  |
| Find The Difference Puzzle Books – 3 Books + 6 Pens Set                                                       | [https://kidsrepublicbd.com/product/find-the-difference-puzzle-books-3-books-6-pens-set-early-educational-cards/](https://kidsrepublicbd.com/product/find-the-difference-puzzle-books-3-books-6-pens-set-early-educational-cards/)                                                                 | BDT 950   | traditional-toys-games, toy-childhood-teen, toy-online-digital, toy-educational-stem, manual-static-toys                        | 3/3/3/3/2 | 2.8 | B      | yes  |
| Baby’s First Paint Picture Book                                                                               | [https://kidsrepublicbd.com/product/finger-paint-picture-book/](https://kidsrepublicbd.com/product/finger-paint-picture-book/)                                                                                                                                                                     | BDT 1,350 | toy-arts-creative, toy-early-development, toy-childhood-teen, toy-online-digital, toy-educational-stem, manual-static-toys      | 3/4/4/3/1 | 3   | C      | yes  |
| Baby’s First Water Coloring Book                                                                              | [https://kidsrepublicbd.com/product/kids-busy-book/](https://kidsrepublicbd.com/product/kids-busy-book/)                                                                                                                                                                                           | BDT 1,330 | toy-arts-creative, toy-early-development, toy-childhood-teen, toy-online-digital, toy-educational-stem, manual-static-toys      | 4/3/2/4/2 | 3   | B      | yes  |
| Architecture Building Blocks – Premium Wooden Puzzle Building Toys                                            | [https://kidsrepublicbd.com/product/architecture-building-blocks-premium-wooden-puzzle-building-toys/](https://kidsrepublicbd.com/product/architecture-building-blocks-premium-wooden-puzzle-building-toys/)                                                                                       | BDT 2,180 | traditional-toys-games, toy-childhood-teen, toy-online-digital, toy-educational-stem, manual-static-toys                        | 3/2/3/3/2 | 2.6 | B      | yes  |
| Jianyuan 780 Green Box – 1:32 Premium Alloy Car Set                                                           | [https://kidsrepublicbd.com/product/jianyuan-780-green-box-132-premium-alloy-car-set/](https://kidsrepublicbd.com/product/jianyuan-780-green-box-132-premium-alloy-car-set/)                                                                                                                       | BDT 2,500 | traditional-toys-games, toy-childhood-teen, toy-online-digital                                                                  | 3/1/2/4/2 | 2.4 | C      | yes  |
| Magnet Science – 6+ Physics Puzzle Science Experiment Set                                                     | [https://kidsrepublicbd.com/product/magnet-science-6-physics-puzzle-science-and-education-cutting-edge-suspended-toy-set-science-experiment/](https://kidsrepublicbd.com/product/magnet-science-6-physics-puzzle-science-and-education-cutting-edge-suspended-toy-set-science-experiment/)         | BDT 1,700 | traditional-toys-games, toy-childhood-teen, toy-online-digital, toy-educational-stem, manual-static-toys                        | 4/4/3/4/1 | 3.2 | C      | yes  |




### TeddyBear BD


| Product                                                         | Source                                                                                                                                                                                         | Price     | Segments                                                          | D1–D5     | QS  | Action | Shot |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------- | --------- | --- | ------ | ---- |
| 5 Feet Pink Teddy Bear with Heart – Soft Plush Stuffed Toy Gift | [https://teddybearbd.com/product/5-feet-pink-teddy-bear-with-heart-soft-plush-stuffed-toy-gift](https://teddybearbd.com/product/5-feet-pink-teddy-bear-with-heart-soft-plush-stuffed-toy-gift) | BDT 2,500 | traditional-toys-games, toy-online-digital                        | 2/1/1/2/1 | 1.4 | D      | logo |
| Extra Large Big Teddy Bear 6 Feet                               | [https://teddybearbd.com/product/extra-large-big-teddy-bear-6-feet](https://teddybearbd.com/product/extra-large-big-teddy-bear-6-feet)                                                         | BDT 2,950 | traditional-toys-games, toy-online-digital                        | 2/1/1/1/1 | 1.2 | D      | logo |
| Extra Large Big Teddy 3.5 Feet Dark Pink                        | [https://teddybearbd.com/product/extra-large-big-teddy-3-5-feet-dark-pink-price-in-bangladesh](https://teddybearbd.com/product/extra-large-big-teddy-3-5-feet-dark-pink-price-in-bangladesh)   | BDT 1,190 | traditional-toys-games, toy-online-digital                        | 2/1/1/1/1 | 1.2 | D      | logo |
| Extra Large Big Teddy 3.5 Feet Brown                            | [https://teddybearbd.com/product/extra-large-big-teddy-3-5-brown-color-price-in-bangladesh](https://teddybearbd.com/product/extra-large-big-teddy-3-5-brown-color-price-in-bangladesh)         | BDT 1,190 | traditional-toys-games, toy-online-digital                        | 2/1/1/1/1 | 1.2 | D      | logo |
| Extra Large Big Teddy Bear 3.5 Feet Red                         | [https://teddybearbd.com/product/extra-large-big-teddy-bear-3-5-feet-red-color](https://teddybearbd.com/product/extra-large-big-teddy-bear-3-5-feet-red-color)                                 | BDT 1,190 | traditional-toys-games, toy-online-digital                        | 2/1/1/1/1 | 1.2 | D      | logo |
| Extra Large Big Teddy 3.5 Feet Pink                             | [https://teddybearbd.com/product/extra-large-big-teddy-3-5-pink-color-price-in-bangladesh](https://teddybearbd.com/product/extra-large-big-teddy-3-5-pink-color-price-in-bangladesh)           | BDT 1,190 | traditional-toys-games, toy-online-digital                        | 2/1/1/1/1 | 1.2 | D      | logo |
| Pink Love You Teddy 5 Feet                                      | [https://teddybearbd.com/product/pink-color-love-you-teddy-5-feet](https://teddybearbd.com/product/pink-color-love-you-teddy-5-feet)                                                           | BDT 2,600 | traditional-toys-games, toy-online-digital                        | 2/1/1/1/1 | 1.2 | D      | logo |
| Red Extra Large Big Teddy Bear, 2.5 Feet                        | [https://teddybearbd.com/product/extra-large-big-teddy-bear-2-5-feet-red-color](https://teddybearbd.com/product/extra-large-big-teddy-bear-2-5-feet-red-color)                                 | BDT 699   | traditional-toys-games, toy-online-digital                        | 2/1/1/1/1 | 1.2 | D      | logo |
| Five-Foot Extra Large Big Teddy Bear                            | [https://teddybearbd.com/product/extra-large-big-teddy-bear-5-feet-feet](https://teddybearbd.com/product/extra-large-big-teddy-bear-5-feet-feet)                                               | BDT 2,500 | traditional-toys-games, toy-online-digital                        | 2/1/1/1/1 | 1.2 | D      | logo |
| Long Arm Tail Monkey Stuffed Doll Plush Toys Gift               | [https://teddybearbd.com/product/long-arm-tail-monkey-stuffed-doll-plush-toys-gift](https://teddybearbd.com/product/long-arm-tail-monkey-stuffed-doll-plush-toys-gift)                         | BDT 229   | traditional-toys-games, toy-online-digital, electric-battery-toys | 2/1/1/2/1 | 1.4 | D      | logo |




### Toyzone BD


| Product                                                              | Source                                                                                                                                                                                                             | Price     | Segments                                                                                                 | D1–D5     | QS  | Action | Shot |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | -------------------------------------------------------------------------------------------------------- | --------- | --- | ------ | ---- |
| Foosball Winner Board Game for Family Game Wooden Made 2 Player Game | [https://www.toyzonebd.com/products/foosball-winner-board-game-for-family-game-wooden-made-2-player-game](https://www.toyzonebd.com/products/foosball-winner-board-game-for-family-game-wooden-made-2-player-game) | BDT 760   | traditional-toys-games, toy-online-digital, toy-social-emotional, manual-static-toys                     | 3/3/2/3/2 | 2.6 | B      | yes  |
| Dinosaur Park Adventure for Kids                                     | [https://www.toyzonebd.com/products/dinosaur-park-adventure-for-kids](https://www.toyzonebd.com/products/dinosaur-park-adventure-for-kids)                                                                         | BDT 850   | traditional-toys-games, toy-online-digital, toy-educational-stem, manual-static-toys                     | 4/3/2/2/2 | 2.6 | B      | yes  |
| Building Blocks Toy for Kids Bucket System (170 pcs)                 | [https://www.toyzonebd.com/products/building-blocks-toy-for-kids-bucket-system-170-pcs](https://www.toyzonebd.com/products/building-blocks-toy-for-kids-bucket-system-170-pcs)                                     | BDT 1,450 | traditional-toys-games, toy-online-digital, toy-educational-stem, manual-static-toys                     | 4/3/2/2/2 | 2.6 | B      | yes  |
| Art Painting Set Wooden Box 220 Pcs                                  | [https://www.toyzonebd.com/products/art-painting-set-wooden-box-220-pcs](https://www.toyzonebd.com/products/art-painting-set-wooden-box-220-pcs)                                                                   | BDT 2,200 | toy-arts-creative, toy-online-digital, manual-static-toys                                                | 3/2/2/3/2 | 2.4 | B      | yes  |
| Baby Piano Gym Mat Kick and Play Multi Function                      | [https://www.toyzonebd.com/products/baby-piano-gym-mat-kick-and-play-multi-function](https://www.toyzonebd.com/products/baby-piano-gym-mat-kick-and-play-multi-function)                                           | BDT 3,000 | traditional-toys-games, toy-early-development, toy-online-digital                                        | 4/4/4/3/3 | 3.6 | A      | yes  |
| Kitchen Set (43 pcs)                                                 | [https://www.toyzonebd.com/products/kitchen-set-43-pcs](https://www.toyzonebd.com/products/kitchen-set-43-pcs)                                                                                                     | BDT 3,800 | traditional-toys-games, toy-childhood-teen, toy-online-digital, toy-social-emotional                     | 4/3/3/4/3 | 3.4 | A      | yes  |
| Intex Inflatable Bath Tub Swimming Pool – 24 Inch                    | [https://www.toyzonebd.com/products/intex-inflatable-bath-tub-swimming-pool-24-inch](https://www.toyzonebd.com/products/intex-inflatable-bath-tub-swimming-pool-24-inch)                                           | BDT 680   | toy-active-physical, toy-online-digital, manual-static-toys                                              | 3/2/2/3/1 | 2.2 | C      | yes  |
| Magnetic Bar Blocks (36 Pcs)                                         | [https://www.toyzonebd.com/products/magnetic-bar-blocks-36-pcs](https://www.toyzonebd.com/products/magnetic-bar-blocks-36-pcs)                                                                                     | BDT 990   | traditional-toys-games, toy-childhood-teen, toy-online-digital, toy-educational-stem, manual-static-toys | 4/4/3/3/1 | 3   | C      | yes  |
| Transparent 3D Lighting Gear Train                                   | [https://www.toyzonebd.com/products/transparent-3d-lighting-gear-train](https://www.toyzonebd.com/products/transparent-3d-lighting-gear-train)                                                                     | BDT 1,090 | traditional-toys-games, toy-online-digital                                                               | 3/2/1/2/2 | 2   | C      | yes  |
| Concept Racing Toy Car (3 Battery Totally Free)                      | [https://www.toyzonebd.com/products/concept-racing-toy-car-3-battery-totally-free](https://www.toyzonebd.com/products/concept-racing-toy-car-3-battery-totally-free)                                               | BDT 850   | traditional-toys-games, toy-online-digital, electric-battery-toys                                        | 3/2/2/3/2 | 2.4 | B      | yes  |




## QA status

- Mechanical product QA after LEGO strip: **PASS 238 / FLAGGED 0 / FAIL 0** (`data/qa-reports/toys_products-qa-report.json`).
- Product-image contact-sheet audit after LEGO strip: **0 flagged / 4 review / 44 clean** across 48 shots.
  - Sheet: `data/qa-reports/toys_products-image-audit/contact-sheet.html`
  - Same four `opaque-filename` review cards as before (Kids Republic / Toyzone); previously visually kept; no LEGO assets remain on the sheet.
- Submit: **blocked** until HITL Dashboard order; Dashboard-only, no harvest scripts.



## LEGO exclusion

All 12 Sundora LEGO SKUs were removed from `toys_products.json` and this register on 2026-09-07 because the harvest lacked explicit evidence that Sundora is LEGO’s official partner in Bangladesh. Do not re-add LEGO-branded SKUs under any Toys org without that attestation.

Separately, Moncho still has eight orphan LEGO pricing-only rows (`product_id: null`) on `traditional-toys-games`. Those are platform pricing leftovers, not part of this harvest JSON, and must not be duplicated via CREATE.