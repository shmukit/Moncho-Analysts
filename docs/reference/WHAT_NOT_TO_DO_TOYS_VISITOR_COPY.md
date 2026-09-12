# Toys harvest — visitor-facing copy (WHAT NOT TO DO)

**Locked:** 2026-09-07 (HITL)  
**Applies to:** Bangladesh Toys sector product (and org) JSON. Same spirit for other retail consumer-product sectors.

Submit-grade rows are **customer-facing**. A visitor reading Moncho should see the same kind of language they would see on a toy store or brand website, not analyst workbench talk.

---

## Never write for “us” (analysts)

Do **not** phrase `product_description`, score rationales, `price_note`, or other Dashboard-facing prose as research notes to the team. Write for **website visitor customers**: parents, gift buyers, and shoppers deciding what the product is.

| Forbidden (examples) | Why |
| --- | --- |
| `listed by ToguMogu as a Bangladesh toy offering` | Seller process talk, not a product pitch |
| `Aman … lists X as a named item in its official local gun category` | Catalogue audit voice |
| `SPA shell`, `HTTP 500`, `HTTP 403`, `exact route`, `revalidated` | Tech / fetch jargon |
| `captured from … on 2026-09-06`, `recheck before Dashboard entry` | Harvest ops |
| `pricing_gap`, `D1–D5`, `Action C`, `gate`, `hold`, `HITL`, wave IDs | Rubric / process shorthand |
| `Official organization logo attached for Dashboard media linkage` | Media plumbing note |
| Product `_comment` breadcrumbs (`Official … listing; SPA caveat…`) | Analyst scratchpad |

Process, fetch failures, and scoring caveats belong in the **sector review log** (not in fields customers may read).

`group_label` stays a plain SKU slug (e.g. `TOY-ABC-01027`), not a batch or wave code.

File-level `_meta` may keep **counts and dates** only.

Product- and media-level `_comment` fields: **keep only a short, non-process stub** required by mechanical QA (sample root `_comment` is applied to every product/media row). Allowed examples: `Kids Republic — Product Name`, `Organization logo`, `Product image from the listing`. Never put SPA/HTTP/harvest/Dashboard notes in `_comment`.

---

## How to word entries instead

| Field | Write like… |
| --- | --- |
| `product_description` | What the toy is, who it is for, and what play it supports (about 20–40 words) |
| Score rationales | Observable product facts + official URL — never “we could not revalidate the SPA” |
| Missing price | “A public BDT price is not shown on the product page” — not `(pricing_gap)` or “catalogue sources” |
| Thin listings | Describe the named toy honestly; put harvest limits in the review MD |

**Wrong**

```text
A named Hot Wheels GBF89 challenge set listed by ToguMogu as a Bangladesh toy offering.
BDT 3,450 was captured from ToguMogu's official local listing on 2026-09-06. The exact route currently renders only the generic SPA shell…
Aman Plastic Toys Industries lists 999 Gun as a named item in its official local gun category.
```

**Right**

```text
Hot Wheels GBF89 Launch Across Challenge track set for racing and stunt play with launch-across action.
Listed at BDT 3,450 on the product page.
Aman’s 999 Gun plastic toy gun for simple pretend play and role-play adventures.
```

---

## Also do not

1. Invent prices, HS codes, or LEGO/partner claims without explicit official evidence.
2. Leave analyst scaffolding (`_comment`, harvest `_meta` essays) in a file you will QA or submit.
3. Confuse catalogue acceptance with priced-SKU acceptance — thin named offerings may stay with a clear customer-facing missing-price note.

See also: [`IDE_AGENT_MISTAKES.md`](IDE_AGENT_MISTAKES.md) and [`SKU_PRICING_SUBMISSION_GUIDE.md`](SKU_PRICING_SUBMISSION_GUIDE.md).
