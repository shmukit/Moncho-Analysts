# SKU pricing submission guide

**Audience:** Contract analysts and intern Data Ops on the Analyst Dashboard.  
**Job:** Submit a small set of **named, sourced, priced offerings** so they can become live `product_metrics` rows after review.  
**Not this guide:** Automated harvest CLIs, Exa/Tavily gap-fill, bulk apply. Those stay with the founder.

Also read: `PRODUCT_ORG_RUBRICS.md` (Part 3 units **and** Part 3c industry harvest cards), `skills/product_sku_submission.md`, `IDE_AGENT_MISTAKES.md` (P-01 through P-15, A-03), `GRANT_TEN_SECTORS.md`.

---

## Two tracks (do not mix)

| Track | Who it is for | Country / currency | Typical orgs | Typical SKUs |
|-------|----------------|--------------------|--------------|--------------|
| **Bangladesh market** | Grant-sector work, BD operators | `country_code=BD`, native BDT when the page is in BDT | Local labs, banks, EPCs, clubs, SaaS sold in BD | Named tests, plans, tickets, hardware models listed on the **BD site** |
| **Global digital / SaaS** | Non-BD public list prices | Native currency on the pricing page (USD, EUR, …). Never default to BDT or BD | Digital/SaaS with a public `/pricing` page | Named list plans (Free / Pro / Lite) with a published price |

**Hard exclusions (both tracks unless the founder says otherwise):**

- EPB exporter stubs, `.gov.bd` directories, association membership lists as the only source
- Global manufacturer catalogs attached to a local reseller with no local listing
- Aggregator / third-party price pages
- Whole menus (cap **5–15 flagship SKUs** per org on first pass)

**Global-only exclusions:** labeled Bangladesh orgs, EPB stubs, `.com.bd`, orgs that already have any SKU in live pricing, non-digital sectors, government / SOE.

---

## Pick the pricing object first

Industries do not share one SKU shape. Before you open a page, match the grant sector to the harvest card in `PRODUCT_ORG_RUBRICS.md` Part 3c (test vs panel, hardware model, named fee, lane/tariff, list plan, pack, ticket).

Set `metadata.template_id` to that approved id when the form allows it. Do not invent a new id (A-03). Mixing objects on one landscape (a solar watt next to a lab test) makes the price chart unusable (P-15).

---

## What a live SKU is

A row is **live** only after human review **and** CMS apply into `product_metrics`.

| You submitted | Live on MCP `pricing` / `coverage.products_live`? |
|---------------|-----------------------------------------------------|
| Dashboard change request still pending | No |
| Harvest sitting in HITL-hold | No |
| `pricing_gap: true` (no numeric price) | No (gap tracking only) |
| Rubric / catalog with no price | Catalog may list the offering; Pricing charts skip null prices |
| Approved + applied priced row | Yes |

Do **not** trust an old grant table that showed Products live = 0. Query `pricing` with the **Moncho slug** (`financial-services`, not `finance-banking-bd`). Multi-slug grant rows need one lookup per slug.

---

## Required fields (priced row)

Match `samples/product_sample.json` / `samples/sports_revenue_sample.json` and the Dashboard product form.

| Field | Rule |
|-------|------|
| Product name | Named model / plan / test / ticket. Not “Inverters” or “Lab Tests” |
| Segment | Real **segment slugs** from taxonomy. Never guess numeric ids (T-01) |
| Official URL | Page that shows **this** offering |
| Price | Number. `0` is allowed for a labeled free tier. Never invent. Never `"85000-180000"` in one field |
| Currency | Currency **on the page**. BD pages in ৳ → BDT. Global USD page → USD. Do not default |
| Country | BD track → BD. Global track → ISO of the published market, or omit if the page is global and unlabeled |
| Unit | `variant_unit` from `PRODUCT_ORG_RUBRICS.md` Part 3 / 3c (per test, per W, per seat, `mo` / `yr`, ticket, …) |
| Template | `metadata.template_id` from Part 3c when the form has metadata |
| Price kind | List / public / quote. If you cannot name how the price is published, stop and ask |

**Org apply:** always include **segment slugs** so the org lands on the landscape cell, not sector-tag-only (P-13).

---

## What not to submit as a plan SKU

SaaS / ICT first pass (add-ons, meters, credits). Other sectors: use Part 3c, not this table.

| Object | Submit as priced SKU? | Instead |
|--------|------------------------|---------|
| Named list plan (Free / Pro) | Yes | One row per plan × billing period |
| Feature checkbox on a plan | No | Note in description / metadata |
| Overage rate (“+$9 per 100k”) | No | Note on the parent plan |
| Priced add-on / usage meter with a **number on the official page** | Yes (own row, not a checkbox) | Leave `attaches_to` blank if the page does not name the parent plan |
| Priced add-on / meter with **no** number | No | Skip or `pricing_gap`. Never invent |
| API credit tables | No | Skip |
| Infra instance ladders (hourly) | Not on first pass | Founder backlog |
| “Contact us” / “starts at” | No | `pricing_gap` or omit. Never invent a number |

---

## Do not run Pass 2 open-web gap fill

A prior BD harvest paid for thousands of secondary web searches and filled about **4%** of gaps. Interns **do not** chase missing prices across the open web.

If the official page has no public number: submit a **pricing gap** or skip the SKU. One primary URL is enough.

---

## Pre-submit checklist

1. Org already exists or is submitted with **segment slugs**. Duplicate-check first (M-03).
2. Pricing object matches Part 3c for this grant sector (P-15). Template id set when metadata exists.
3. SKU is named, on the official page, in-scope for BD **or** global (not mixed).
4. Price is a number in the page’s currency; unit filled; free tier is `0` not blank.
5. Cap 5–15 SKUs for this org.
6. SaaS: no credit tables, contact-us quotes, or invented “starts at” numbers. Priced extras only when the page shows a number.
7. Run `skills/validation_submission.md` QA. Then submit via Dashboard or `npm run submit` in the Analysts repo.

Founder-side audit (`product-pricing:audit-submissions`) is **not** an intern command. Your checklist above is the intern equivalent.

---

## After submit

- Confirm the change request in **My Work**.
- Live MCP counts update only after **apply**. Ask the founder if a row stays pending.
- If review rejects for missing segment, price kind, or wrong country/currency: fix the **same** submission (Edit & resubmit). Do not open a duplicate CREATE.
