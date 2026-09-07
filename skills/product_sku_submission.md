# Skill: Product SKU submission (Dashboard)

Use this skill **every time** you add priced products for Bangladesh operators or global digital/SaaS list prices.

**Full narrative:** `SKU_PRICING_SUBMISSION_GUIDE.md`  
**Shapes:** `samples/product_sample.json`, `samples/sports_revenue_sample.json`  
**Rubric:** `PRODUCT_ORG_RUBRICS.md` (Part 3 units, **Part 3c harvest cards**)  
**Mistakes:** `IDE_AGENT_MISTAKES.md` P-01–P-15, A-03, T-01, P-13

You submit through the **Analyst Dashboard** (or workbench `npm run submit`). You do **not** run harvest CLIs, Exa, or Pass 2 gap-fill.

---

## 1. Pick a track

| If the page is… | Track | Country / currency |
|-----------------|-------|--------------------|
| A BD operator site (৳, `.com.bd`, Dhaka listing) | Bangladesh | `BD` + currency on the page (usually BDT) |
| A public SaaS `/pricing` page with USD/EUR list plans | Global digital | Native currency; **never** default BDT/BD |

Stop if the org is an EPB stub, government directory, or you would attach a global brochure to a local reseller with no local listing.

---

## 2. Pick the pricing object

Match the grant sector to `PRODUCT_ORG_RUBRICS.md` Part 3c **before** you extract prices.

| Sector | Object | `template_id` |
|--------|--------|----------------|
| Health labs | Named test / panel | `diagnostics-test.v1` |
| Health clinical | Named procedure | `healthcare-procedure.v1` |
| Energy | Named hardware model | `solar-hardware.v1` |
| Finance | Named fee or rate product | `finance-products.v1` |
| Logistics | Named lane / tariff / warehouse / courier SKU | `logistics-products.v1` |
| ICT / global digital | Named list plan | `saas-software.v1` |
| Agriculture / pack goods | Named pack | `fmcg-packaged-goods.v1` |
| Sports | Ticket / membership / academy | Part 3 Sports table (no template yet) |
| Education / RMG | Course seat or named fabric SKU | Part 3 units only |

Set `metadata.template_id` when the form allows it. Do not invent a new id (A-03). Do not mix objects on one landscape (P-15).

---

## 3. Org first, then SKUs

1. `moncho_check_duplicate` / discovery `orgs` before CREATE.
2. Org JSON / Dashboard form must include **segment slugs** (taxonomy), not guessed numeric ids.
3. Score / eligibility-filter the org before harvesting a catalog (P-06).
4. Products only for orgs that clear the agreed bar.

---

## 4. SKU row rules

- **5–15** named SKUs per org on first pass.
- Official URL that shows **this** offering.
- Numeric `price` (`0` OK for a labeled free tier).
- Currency and country from the page, not a default.
- `variant_unit` always set from Part 3 / 3c.
- SaaS: named list plans first. A priced add-on or meter is a SKU only when the **page shows a number**. Skip credit tables, contact-us, invented “starts at”. Infra ladders stay off first pass.

B2B ranges: **two rows** (low / high), shared `band_id`. Never `"85000-180000"` in one price field.

Logistics: a public tariff is rare. `pricing_gap` is normal. Do not invent a freight number.

---

## 5. What “live” means

MCP `coverage.products_live` and `pricing` count **applied** `product_metrics` on this sector’s canonical segments **or** published landscapes.

Pending change requests and HITL-hold harvests are **not** live. Use Moncho slugs (`ict-services`), not grant `*-bd`. One coverage call per slug on multi-slug grant rows.

---

## 6. Pre-submit (mandatory)

See `skills/validation_submission.md`. Extra SKU checks:

- [ ] Pricing object and `template_id` match Part 3c
- [ ] Track (BD vs global) is consistent on every row
- [ ] Segment slugs present on the org
- [ ] No Pass 2 / open-web price fishing
- [ ] No invented “starts at” numbers
- [ ] Duplicate check done

---

## 7. If review sends it back

Edit **the same** submission. Typical rejects: wrong pricing object, missing segment, wrong currency default, category-only name, aggregator URL, duplicate org CREATE.
