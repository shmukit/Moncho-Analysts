# SKU pricing submission guide

**Audience:** Contract analysts and intern Data Ops on the Analyst Dashboard.  
**Job:** Submit a small set of **named, sourced, priced offerings** so they can become live `product_metrics` rows after review.  
**Not this guide:** Automated harvest CLIs, Exa/Tavily gap-fill, bulk apply. Those stay with the founder.

Also read: `PRODUCT_ORG_RUBRICS.md`, `skills/product_sku_submission.md`, `IDE_AGENT_MISTAKES.md` (P-01 through P-14), `GRANT_TEN_SECTORS.md`.

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
| Unit | `variant_unit` from `PRODUCT_ORG_RUBRICS.md` (per test, per W, per seat, `mo` / `yr`, ticket, …) |
| Price kind | List / public / quote. If you cannot name how the price is published, stop and ask |

**Org apply:** always include **segment slugs** so the org lands on the landscape cell, not sector-tag-only (P-13).

---

## What not to submit as a plan SKU

From the global pricing QA (add-ons, meters, credits):

| Object | Submit as priced plan SKU? | Instead |
|--------|----------------------------|---------|
| Named list plan (Free / Pro) | Yes | One row per plan × billing period |
| Feature checkbox on a plan | No | Note in description / metadata |
| Overage rate (“+$9 per 100k”) | No | Note on the parent plan |
| Priced add-on / usage meter | Not on first pass | Founder backlog |
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
2. SKU is named, on the official page, in-scope for BD **or** global (not mixed).
3. Price is a number in the page’s currency; unit filled; free tier is `0` not blank.
4. Cap 5–15 SKUs for this org.
5. Not an add-on, meter, credit table, or contact-us quote.
6. Run `skills/validation_submission.md` QA. Then submit via Dashboard or `npm run submit` in the Analysts repo.

Founder-side audit (`product-pricing:audit-submissions`) is **not** an intern command. Your checklist above is the intern equivalent.

---

## After submit

- Confirm the change request in **My Work**.
- Live MCP counts update only after **apply**. Ask the founder if a row stays pending.
- If review rejects for missing segment, price kind, or wrong country/currency: fix the **same** submission (Edit & resubmit). Do not open a duplicate CREATE.
