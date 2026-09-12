# Skill: SKU pricing canon

Use this **every time** you submit a priced product or review a pricing harvest. It lists the shapes Moncho accepts so you do not invent the rest.

Platform canon (full detail): `docs/06-operations/agent-skills/sku-pricing-canon.md` in Moncho-V1.

---

## The one rule

Store what the page **lists**. Do not derive, convert, or normalize at submit. Comparability is a read-time layer.

---

## Accepted pricing shapes

| Shape | How to store | Never |
|-------|--------------|-------|
| Named plan, listed price | `price`, `currency`, `variant_unit` = billing period (`mo`/`yr`/`hr`) | Convert yearly to monthly |
| Free tier | `price: 0`, currency, `variant_unit` | `null` price |
| Starting at / Contact us | `pricing_gap: true`, named plan | Invent the number |
| Seat / user price | `price` per seat, `variant_unit: mo`, `metadata.meter_unit: user` | Put `user` in `variant_unit` |
| Credit pack menu | One row per published pack, `meter_unit: credit`, `meter_increment` = pack size | Derived `$/credit` |
| Plan with included credits | One plan row, `meter_increment` = included count | Explode the slider |
| Published unit rate (`$0.01486/credit`) | `usage_meter`, `meter_increment: 1` | Call it a derived rate |
| Volume add-on (`+500 products $0.40/product`) | `price` = unit rate, `meter_increment: 1`, pack size in name | `variant_value: 500` |
| Platform take-rate (`5.5%` on spend) | `price` = percent, `service_fee`, `metadata.platform_fee_pct`, no currency | Store as `$5.50` |
| Usage meter floor (`€150/building`) | `metadata.min_charge` on the meter row | Treat as the software price |
| Hour vs second toggle | Keep the page default cadence only | Emit both |
| Locale storefront (`/en-ca/`) | `country_code: CA` on the product | Stamp org HQ |
| Annual prepaid vs monthly | Two rows, `billing_commitment` | Divide by 12 |

---

## Pre-submit checklist

- [ ] Pricing object matches `PRODUCT_ORG_RUBRICS.md` Part 3c
- [ ] Track (BD vs global) is consistent on every row
- [ ] Currency and country come from the page, not a default
- [ ] `variant_unit` is the listed billing period; seat/user is `metadata.meter_unit`
- [ ] Credit packs are one row per published pack; included credits stay on the plan row
- [ ] No derived `$/credit`, no yearly÷12, no invented "starts at"
- [ ] Platform % fees are `service_fee` + `platform_fee_pct`, not USD
- [ ] `pricing_gap` when the page has no number
- [ ] 5–15 named SKUs per org on first pass

---

## When you find a new shape

1. Do not force it into USD or gap it silently.
2. Flag it in the submission notes.
3. Founder / CDRO adds it to the canon before the next batch.
