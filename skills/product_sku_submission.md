# Skill: Product SKU submission (Dashboard)

Use this skill **every time** you add priced products for Bangladesh operators or global digital/SaaS list prices.

**Full narrative:** `SKU_PRICING_SUBMISSION_GUIDE.md`  
**Shapes:** `samples/product_sample.json`, `samples/sports_revenue_sample.json`  
**Rubric:** `PRODUCT_ORG_RUBRICS.md`  
**Mistakes:** `IDE_AGENT_MISTAKES.md` P-01–P-14, T-01, P-13

You submit through the **Analyst Dashboard** (or workbench `npm run submit`). You do **not** run harvest CLIs, Exa, or Pass 2 gap-fill.

---

## 1. Pick a track

| If the page is… | Track | Country / currency |
|-----------------|-------|--------------------|
| A BD operator site (৳, `.com.bd`, Dhaka listing) | Bangladesh | `BD` + currency on the page (usually BDT) |
| A public SaaS `/pricing` page with USD/EUR list plans | Global digital | Native currency; **never** default BDT/BD |

Stop if the org is an EPB stub, government directory, or you would attach a global brochure to a local reseller with no local listing.

---

## 2. Org first, then SKUs

1. `moncho_check_duplicate` / discovery `orgs` before CREATE.
2. Org JSON / Dashboard form must include **segment slugs** (taxonomy), not guessed numeric ids.
3. Score / eligibility-filter the org before harvesting a catalog (P-06).
4. Products only for orgs that clear the agreed bar.

---

## 3. SKU row rules

- **5–15** named SKUs per org on first pass.
- Official URL that shows **this** offering.
- Numeric `price` (`0` OK for a labeled free tier).
- Currency and country from the page, not a default.
- `variant_unit` always set (seat, month, test, watt, ticket, …).
- Named list plans only on first pass (Free / Pro / Lite). Skip add-ons, meters, credits, instance ladders, overages, “contact us”.

B2B ranges: **two rows** (low / high), shared `band_id`. Never `"85000-180000"` in one price field.

---

## 4. What “live” means

MCP `coverage.products_live` and `pricing` count **applied** `product_metrics` on canonical segments.

Pending change requests and HITL-hold harvests are **not** live. Use Moncho slugs (`ict-services`), not grant `*-bd`. One coverage call per slug on multi-slug grant rows.

---

## 5. Pre-submit (mandatory)

See `skills/validation_submission.md`. Extra SKU checks:

- [ ] Track (BD vs global) is consistent on every row
- [ ] Segment slugs present on the org
- [ ] No Pass 2 / open-web price fishing
- [ ] No invented “starts at” numbers
- [ ] Duplicate check done

---

## 6. If review sends it back

Edit **the same** submission. Typical rejects: missing segment, wrong currency default, category-only name, aggregator URL, duplicate org CREATE.
