# What NOT to do — Energy data-fetching lessons (HITL corrections)

**Purpose:** Reference log of agent mistakes during Bangladesh energy Phase 1A–1C harvest that the analyst (HITL) corrected. Keep this in the private vault so laptop Cursor / employer demos can cite **anti-patterns**, not only final JSON.

**Scope:** Research & media extraction for orgs, products, market facts.  
**Source conversation:** Moncho Analysts energy workstream (Jul 2026).  
**Rule:** Prefer the **Corrected rule** column in future runs; do not re-litigate closed locks.

---

## How to read this

Each row is: agent did **Wrong** → user corrected → **Locked rule**.

---

## A. Research access & ethics

| # | Wrong (agent drift) | Corrected rule |
|---|---------------------|----------------|
| A1 | Implied crawl/automation that could fill contact forms or spam “Get quote” flows | **GET-only.** Read public pages; never submit forms, never invent “we enquired”. |
| A2 | Treating SREDA open stakeholder signup HTML as sufficient for full org+product scoring | Enrich from **company websites** + directories (e.g. BSREA); SREDA is identity/scope — not full rubric evidence. |
| A3 | Planning Playwright / heavy browser crawls for “depth” in sample sprints | Prefer cached HTML / targeted fetches; no browser crawl unless explicitly unlocked. |
| A4 | Pushing analyst dumps / Logo.dev tokens to employer `Moncho-Analysts` remote | Personal demo vault only; **REDACT** `?token=pk_…`; never force-push employer main. |

---

## B. Organization harvest (1A)

| # | Wrong | Corrected rule |
|---|-------|----------------|
| B1 | Chasing nuclear / hydrogen / ammonia because taxonomy has `emerging-tech-nuclear-smr-hydrogen` | Phase 1 tech bar = **solar / wind / hydro / biogas / biomass** (plus normal RE org activity). Shelf nuclear/H₂. |
| B2 | Putting every BSREA row into submit without Product depth / evidence gates | Score honestly; **gate Product depth ≤2** out of Phase 1B product harvest (e.g. Rahimafrooz = 2 → org may stay 1A submit but **no 1B SKUs**). |
| B3 | Inventing LinkedIn/email activity as score evidence | Activity proxies only when verified; no fabricated outreach. |
| B4 | Skipping Moncho coverage check (“energy is empty anyway”) | Always MCP / coverage check first; report baseline counts in `_meta` / scratchpad. |
| B5 | Mixing `website_url` host forms (`www.` vs bare, or other subdomains) across orgs | **`website_url` = root domain only.** Scheme + registrable domain + `/` — no `www.`, no `shop.`/`blog.`/etc., no deep path. Example: `https://jpl-bd.com/` not `https://www.jpl-bd.com/`. Evidence `source_urls` may still cite specific pages. |
| B6 | Defaulting **every** org to `segment_slugs: ["distributed-generation"]` only | **Multi-segment when evidence supports.** Confirm live slugs via MCP `taxonomy` `sector_slug=energy` (15 energy-linked segments / 6 landscapes). Map by what the org sells/deploys (gen + storage + irrigation + grid + industry + bioenergy as applicable). Do **not** invent slugs; do **not** force DG-only because Phase-1 harvest started there. |
| B7 | Leaving hold orgs forever without a second GET-only pass before API prep | Before submit freeze, re-check hold blockers on the **company site** (not BSREA). Example: Sherpa SP cleared via IDCOL PO 2013 cite on `sherpapower.org` home-solar page → promoted. VISCO still hold after about/projects re-check (no named BD installs / no org-level award). |
| B8 | Treating the default Product-depth gate as permission to skip organizations after the HITL explicitly expanded Batch 2 | Human scope overrides the default gate. For Batch 2, inspect **all 26 paired orgs**, including PD=2. Still apply the full product rubric: record honest zero-SKU orgs instead of inventing products or weakening A/B thresholds. |

**Employer feedback (2026-07-16):** org JSON had mixed root vs subdomain `website_url` values → normalize all to root domains.  
**Employer feedback (2026-07-16):** orgs can belong to **multiple segments** — rematch `segment_slugs` from MCP energy taxonomy + site evidence (not DG-only).  
**API prep (2026-07-16):** root-normalize `website_url` + homepage `source_urls`; promote Sherpa; keep VISCO in holds file; do **not** API-push until founder says go. Local QA “segment not in reference taxonomy” flags are **stale local taxonomy.json** — trust MCP energy segments.

---

## C. Product harvest & media (1B) — highest-signal mistakes

| # | Wrong | Corrected rule |
|---|-------|----------------|
| C1 | **`product_shot` = Logo.dev URL** (same as org mark) | **Logo.dev = `logo` only.** `product_shot` = images from **that org’s** local BD product/solution pages. |
| C2 | Reusing one company’s gallery image for another org’s SKU | **No cross-org reuse.** Omit shot rather than steal. |
| C3 | Using partner / OEM / association tiles as product shots (e.g. filenames with `Lavender-Global-Group`) | Maintain a **filename denylist**; partner logos ≠ product photography. |
| C4 | Dropping a valid A/B product because shot was missing or URL 404 | Media is support; **do not drop submit products** for missing shots — omit media row or rematch. |
| C5 | Blindly trusting HEAD checks against LiteSpeed/CF (Node HEAD timeouts) | Prefer **curl verify** + cache; distinguish bot-block from true 404. |
| C6 | Harvesting unnamed EPC “packages” / brand lines as if they were SKUs | Prefer **named models** on local BD pages; service packages need explicit evidence; hold thin brand-lines (C/D). |
| C7 | Cap >10 SKUs per org “because the site has many” | Hard cap **≤10** scored SKUs per org for this pilot. |
| C8 | Mixing OEM catalog pages as primary when BD reseller only lists the brand | Local BD listing is primary; OEM only when that **named hardware** is clearly the same listing context. |
| C9 | Treating `pricing_gap=true` as a schema fail | Most BD RE pages hide list prices; **1 priced SKU of 80** in the pilot is honest, not broken. |
| C10 | Mixing **HS 2017** codes (e.g. PV modules as `8541.40`) or inventing catch-alls | **HS 2022 only.** Modules → `8541.43` (2022 split). PV DC gens → `8501.71` (≤50 W) / `8501.72` (>50 W). PV AC gens → `8501.80` (2022-new, not a dump bucket). Inverters → `8504.40`. LED solar street lights → `9405.41`. **Never** assign hardware HS to `epc_service` rows (use `null`). |
| C11 | Integer-rounding `quality_score` (`round(avg)` → 2 or 3 only) | **`quality_score` = (D1+…+D5)/5 to 1 decimal** (e.g. 2.6, 3.2). Keeps ranking comparable; D1–D5 stay integers 1–5. |
| C12 | Leaving C/D holds inside the API submit products file | Before API prep: re-enrich holds (GET-only). **Promote** breakers into `products[]`; move remaining holds to a **separate** `*-holds.json` and omit from submit. |
| C13 | Calling an image “verified” because the URL returned HTTP 200 / `image/*` | Reachability QA checks bytes, **not relevance**. A live stock portrait, mangrove, logo, or decorative hero still fails product-media QA. Run the standalone image-content audit and inspect the contact sheet. |
| C14 | Treating “embedded on the official product page” as sufficient proof | Page placement is only provenance. The pixels must visibly show the named product, interface, installed system, or concrete service deliverable. Humans/nature may surround it but cannot be the only subject. |
| C15 | Using generic Unsplash / stock photos for advisory or service products | Stock imagery is **not** a product shot, even when the company intentionally embeds it on a service card. Service/advisory offerings default to logo-only unless a concrete deliverable or installed system is visible. |
| C16 | Using a random person from a product page carousel (e.g. SOLshare) | Inspect the actual pixels, not filename order, schema metadata, “primary image”, or proximity to a heading. Portrait/testimonial-only media must be omitted. |
| C17 | Assuming a CDN violates org-local provenance, or accepting any CDN blindly | A page-associated CDN is allowed only when the official org page embeds the exact asset for that offering and the CDN asset is not reused across other Moncho orgs. Record the embedding page; still apply visual-content QA. |
| C18 | Saying a 404 image was “captured” | A 404 means only a dead URL string was extracted; no usable image was captured. Remove/rematch it. Verify with GET and confirm an `image/*` response. |
| C19 | Reconstructing image filenames by replacing punctuation (e.g. HiTHIUM `–` with `---`) | Preserve and URL-encode the exact asset path from page HTML. Unicode en-dashes and model characters can be significant. GET-verify the final stored URL. |
| C20 | Keeping a mismatched asset because the official product route embeds it (Greenery 640W page served inverter-folder images) | Treat obvious CMS assignment errors as invalid association. Omit the shot rather than laundering a site bug into Moncho data. |
| C21 | Reusing one hero for sibling offerings without explanation | Within-org reuse is exceptional, not a shortcut. Keep it only when the official page explicitly uses one shared hero for the same closely related offering family; document it. Cross-org reuse remains forbidden. |
| C22 | Manually opening dozens of URLs one by one and assuming the rest | After every product-media harvest/rematch, run `npm run audit:product-images -- --file <json>` and scan the generated local contact sheet. Tier 0 flags are triage; “clean” still requires one visual pass. See `skills/product_image_audit.md`. |
| C23 | Assuming image-content QA requires paid AI credits | Default audit is deterministic and free: stock/filename rules, service-risk flags, download/content checks, dimensions, exact URL/byte duplicates, and a contact sheet. Optional `--clip` uses local open CLIP weights; never require a paid inference API. |

**Employer feedback (2026-07-16):** Cross-verify product HS codes against **HS 2022** only — do not use 2017 references.  
**Employer feedback (2026-07-16):** Product `quality_score` must show **one decimal place**, not integer round.  
**API prep (2026-07-16):** Promoted Solar EPC Floating (named 10 kW + 170.1 kW) + Residential/SME capacity packages; 6 D-holds moved to `2026-07-14-energy-products-phase1b-holds.json`. Do **not** API-push until founder says go.

### Media lock (say this out loud in demos)

```
logo         → Logo.dev(org domain)     OK
product_shot → official org page-associated image
             → org-local preferred; traceable CDN allowed
             → never Logo.dev
             → never cross-org
             → denylist stock / partner / people-only / nature-only / decorative assets
             → URL reachability is not visual relevance
             → run standalone audit + scan contact sheet every time
             → omit > invent
```

Outcome after rematch (**v5b**): 80 logos + 80 shots, **66 unique**, curl-verified, 0 Logo.dev in shots.

**Batch 2 correction (2026-07-18):** Initial rematch reached 76 live shots but visual review exposed irrelevant page decoration (including a SOLshare portrait, Unsplash stock, and nature/hero imagery). The lesson is not “76 verified shots”; it is that HTTP and provenance checks cannot certify image content. Batch 2 now requires the standalone Tier 0 audit/contact sheet (`npm run audit:product-images`), with optional free local CLIP, before media can be called reviewed.

---

## D. Market facts (1C)

| # | Wrong | Corrected rule |
|---|-------|----------------|
| D1 | Using stale NEM mirror (`nsrra.sreda.gov.bd` ~**84 MWp**) as current NEM | Prefer live SREDA NEM / NDRE (`solar.sreda.gov.bd/nem/…` or `id=17`) → **331.12 MWp / 4912 systems** (as-of harvest). |
| D2 | Averaging conflicting MW or mixing pages into one row | **One value, one `source_url`.** Prefer dedicated application page over summary-table cell when they disagree. |
| D3 | Examples of conflict wins (keep) | NEM: **331.12** over id=8 chart **329.945**. Irrigation: id=15 **59.22** over id=8 **58.975**. |
| D4 | Seeding policy **targets** (IEPMP %, draft RE policy %) as `market_facts` | **Observed only** this phase. Targets shelved. |
| D5 | Digging old BPDB annual PDFs just to invent YoY 2020–2025 | YoY **only if the same live page** already shows the series. Snapshot otherwise. |
| D6 | District / upazila NEM breakdowns | **National** default; utility OK if **≤8** categories. |
| D7 | Tagging biogas/biomass capacity to Fuel landscape | Phase 1C always `dimensions.landscape_slug = energy-power-generation-landscape`. |
| D8 | Org/product-style scoring on atomic facts | Facts = provenance + metric; **no** D1–D5 rubric. |
| D9 | Dumping PDF extraction as “the market facts plan” (M-02) | Concrete rows: `metric_key`, year, value, URL, sector/landscape. |
| D10 | Counting untagged Moncho cost rows as energy RE coverage | Untagged ≠ coverage. MCP `sector_slug=energy` was **0** at seed time. |
| D11 | Leaving `_family` / `_note` (analyst scratch) on API-bound market fact rows | Before API prep: strip underscore fields. Family/notes live in the **review MD** only. Submit shape = sample columns (`metric_key`, country, year, value, unit, dimensions, source_*, extracted_at, …). |

**API prep (2026-07-16):** 20 facts cleaned to sample columns; paired → `pilot14`; `_enrich/1c` removed from pending. Do **not** API-push until founder says go.

---

## E. Deliverable hygiene

| # | Wrong | Corrected rule |
|---|-------|----------------|
| E1 | Showing `*-qa-all.json` (flattened holds+submit) as the employer deliverable | Meeting show: **submit JSON + review MD**. QA-all is Stage 1 scaffolding only. |
| E2 | Committing live Logo.dev `pk_` tokens to GitHub | Always rewrite `token=…` → `token=REDACTED` in the private vault. |
| E3 | Running Stage 2 `--deep-check` before sample freeze when user asked for sample-only | Match the ask: Stage 1 mechanical first unless told otherwise. |
| E4 | Assuming QA supports `market_fact` out of the box | Without a type, facts with `sector_slug` mis-detect as **organizations**. Use / add `--type market_fact` + sample shape before claiming “QA passed”. |
| E5 | Leaving `_enrich/`, one-off `_*.js|ts`, HTML caches, probe JSON, `qa-*-test*.json`, `*-qa-all.json`, and Templates cluttering `data/pending` after API prep | **Pending keep-set only:** submit JSON (orgs / products / market facts) · matching `*-review.md` · `*-holds.json`. Delete the rest when freezing for API. Scratch enrichment may live outside pending or be wiped. |
| E6 | Writing / keeping separate QA report files (`*-qa-report.json`, unified/executive summaries) in `data/pending` or as “deliverables” | Run Stage 1 QA when needed; **report PASS / FAIL / FLAGGED counts in chat only**. Do **not** create durable QA report files for the analyst pack, and delete any temp QA out-dir after reading counts. |
| E7 | Putting the product-image contact-sheet audit inside employer-owned `qa_agent.ts` | Keep it standalone at `scripts/utils/audit-product-images.mjs` (`npm run audit:product-images`) so general QA stays separate. Generated contact sheets/assets belong under ignored `data/qa-reports/`, never in `data/pending` or the employer deliverable. |

---

## F. Short “chat log” style excerpts (paraphrased)

> **Agent:** Put Logo.dev on every `product_shot` so media QA has URLs.  
> **HITL:** No. Logo.dev is logo only. Reshoot from each org’s BD pages; no cross-org; denylist partner tiles.

> **Employer / HITL (2026-07-16):** Org `website_url` mixed `www.` and bare hosts.  
> **Fix:** Always store **root domain only** on `website_url` (strip `www.` / other subdomains; no deep path).

> **Employer / HITL (2026-07-16):** One org can sit on **multiple** energy segments — stop DG-only defaults.  
> **Fix:** MCP `taxonomy` `sector_slug=energy` → evidence-based multi-map (`segment_slugs[]`).

> **Agent:** Drop SKUs without a good photo so the pack looks complete.  
> **HITL:** Keep the 80 submit products. Omit or rematch media — don’t delete valid SKUs.

> **Agent:** The image is live and embedded on the official page, so it is verified.  
> **HITL:** No. A live official-page image can still be a random person, stock forest, logo, or decoration. Inspect the pixels; omit it if no product/system/deliverable is visible.

> **Agent:** We need paid vision API credits to audit all shots.  
> **HITL:** No. Run deterministic Tier 0 plus a local contact sheet every time; optionally use free local CLIP for future scale.

> **Agent:** NEM is ~84 MWp on the old nsrra page.  
> **HITL:** That mirror is stale. Use current SREDA NEM / NDRE totals (~331 MWp).

> **Agent:** Average the two irrigation numbers so one “truthy” metric.  
> **HITL:** Don’t average. Pick the official dedicated page and cite it.

> **Agent:** Also pull nuclear SMR / H₂ because the taxonomy segment exists.  
> **HITL:** Out of Phase 1 tech scope. Solar/wind/hydro/biogas/biomass only.

---

## G. Files that encode the fix (workbench → vault)

| Topic | Where to look |
|-------|----------------|
| Media rematch history | Private vault / chat — `_enrich/` wiped from pending at API prep |
| Product rules + holds | `energy_phase1b_scratchpad.md`, `*-products-phase1b-review.md`, `*-products-*-holds.json` |
| Fact conflicts | `energy_phase1c_scratchpad.md`, `*-market-facts-phase1c-review.md` |
| Guardrails primary | `energy_sector_plan.md` §8–§9 |
| Pending keep-set | submit JSON + review MD + holds JSON only (E5–E6) |

---

*Last updated: 2026-07-18 — Batch 2 product-media visual-QA correction; standalone Tier 0/contact-sheet audit and optional local CLIP locked.*
