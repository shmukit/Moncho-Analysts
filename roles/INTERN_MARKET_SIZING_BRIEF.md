# Intern brief: market sizing (Bangladesh grant-ten)

Intern batch 2. You draft factors and review cards. You do not publish TAM, run injects, or claim a second country is sized. Founder reviews first.

Last updated: 2026-09-22

You get the same Analyst Dashboard, workbench repo, and Data Ops *kind* of work as the first intern cohort. The **scale is smaller**: fewer orgs/SKUs per week, more judgment, more written notes. You still sit inside the **ICT Division 10 sectors**. Method must travel to SEA and GCC later without rewriting the engine.

Read this before you harvest a number. Skill for the audit loop: [`../skills/sizing-audit.md`](../skills/sizing-audit.md). Grant sector list: [`GRANT_TEN_SECTORS.md`](../docs/onboarding/GRANT_TEN_SECTORS.md). Standing rules live with the founder in the country playbook (ask if you need the full file).

---

## 1. What “sizing” means here

Moncho does **not** have one TAM formula. A useful number names:

1. **What is bought** (a fee, a kWh class, a kg of fish, an LC commission, a seat, a visit).
2. **Who buys it** (household, student, enterprise, facility, account).
3. **The observation window** (year, fiscal year, month; do not mix them).
4. **The publisher** (BBS, Bangladesh Bank, BANBEIS, operator tariff page). Never “Moncho curated.”

A blog that says “the jute market is $820M” is not a size. It is an unsourced lump. Leave it unattached until a table exists.

**Layers (do not mix):**

| Layer | What it is | Your job |
|-------|------------|----------|
| `market_facts` / staging | Atomic volumes, prices, take rates, trade | Extract, grain, source URL, unit |
| `product_metrics` | SKU prices on the Products tab | Dashboard SKU work, not TAM |
| Published TAM | Formula flashcards after founder sign-off | Draft the **review card**; do not write TAM |
| Sherpa `tam_total` | Mirror of a signed-off number | Read-only for you |

There is no intern path that “computes TAM to be helpful.” Factor first. TAM only after founder review.

---

## 2. Why this is hard (especially in Bangladesh)

These are the failure modes we already paid for. Treat them as the job, not as trivia.

**Grain.** A yearbook production row is not a fee pool. Finance is accounts × ARPU or GMV × take. Energy is kWh × **customer class** × tariff. Ports are throughput × handling. Agri is production × farm-gate or demand × retail. If you cannot name the row, you cannot size.

**Lumps.** Sector GDP, “ICT market $X,” or HS import value quoted as TAM. HS import is **observed import market value**, not the whole market. Mixed HS headings need a cited share. Export-oriented leaves (RMG knit, shrimp, jute on the paid track) report the trade pocket as export, not as domestic spend.

**Ceilings vs observed take.** Bangladesh Bank maximum schedules (example: BRPD Circular 11 LC / processing ceilings) are **not** what a customer pays. Store ceilings as ceilings. Observed take comes from the operator or bank page (bKash cash-out, LC fee the bank actually posts).

**One operator × industry GMV.** Do not mint a blended take-rate for all MFS or all rail. A range is a labeled scenario until mix shares exist.

**Period mismatch.** Do not annualize one month of GMV against a different year’s annual series.

**News ≠ circular.** A newspaper or LinkedIn post about a payment-switch rule is secondary. Fetch the regulator PDF. Do not inject 0% IRF as observed take.

**Digital vs physical.** Tradable goods have a customs line. Local services have a country. Software uses **customer and revenue geography**, not “no geography.” Do not use FIDS wallets as WMS seats. ARPU without a matching buyer universe is not a TAM.

**Informality.** A large share of BD activity is informal. If the official table is establishments-only, say so. Do not “gross up” with an invented ILO fill.

**Empty or thin grant shells.** E-commerce (`retail`) has **0 landscapes**. Sports (`indoor-sports`) is thin. ICT and energy can have orgs on the grid with **no live priced SKUs**. That is a harvest problem, not a model problem.

**FX.** Convert local currency at the **current** documented rate, not the source year’s average. Spell out full units (659.7 million BDT), not only crore.

---

## 3. Current structure (how work actually runs)

```
Need / segment
  → name the economic object
  → pick a method family (do not default to customers × price)
  → hunt official tables and operator pages
  → store factors in staging / market_facts with source
  → founder review card
  → only then curated TAM write
```

**Method families we use** (pick the one that matches the object):

- Published estimate (named publisher, named table)
- Trade-flow: import, export, or apparent consumption when maps exist
- Production × price
- Capacity × utilization × tariff
- GMV × take
- Customers × penetration × frequency × price (one family, **not** the default)
- Parent × cited share
- Labeled analog (Low confidence; never a High headline)

**Readiness audit** grades whether a live segment can be sized bottom-up. It does **not** write TAM. Consultant Track A inventory (2026-09-18): **0 SIZEABLE of 289** auto-cards. That is the grader, not a claim that Bangladesh cannot be sized. Quote HITL product TAM when a number already exists.

**What is already live (examples, not a license to sum):**

- Agri mass-market vegetables: 18 products, founder-verified flashcards
- Education family remounted onto k12 / post-secondary / ECE (do not treat k12 as the family total)
- Fisheries: export plus **domestic wet fish & crab household spend** (named scope)
- Finance: MFS, insurance, import LC **fee pool**, FX conversion as a **ceiling**

Do not add those catalog rows into one “Bangladesh TAM.” Parent export rows overlap children.

---

## 4. Grant-ten: where sizing is currently painful

Same 10 sectors as Data Ops. Paid consultant Track A is a **different** pack (includes **jute**, omits education/ICT/e-commerce/sports as first wave). You are on **grant-ten**.

| Grant sector | Typical object | Current pain |
|--------------|----------------|--------------|
| Finance / Banking | Fee, take, ARPU, accounts | Ceilings vs operator tariffs; do not size “fintech TAM” |
| Agriculture | kg × farm-gate or retail; not GDP | Segment-first orgs; meat/egg still messy; TCB is Dhaka proxy |
| Education | Students × spend; BANBEIS grain | Family vs k12 vs ECE must stay separate |
| ICT / ITES | Seat / project / export of services | Orgs exist; live priced SKUs were 0 in the Sep snapshot |
| Energy | kWh × class tariff | Do not back-solve kWh from revenue when slabs overlap |
| Health | Episodes, SKUs, tests | Many products; still mixed quality; do not predict burden as TAM |
| Logistics | TEU / tonne × handling; lane tariff | Meta-sector is seven children, not one `logistics` lump |
| E-commerce | GMV × take or orders × AOV | **Empty shell**; no landscapes to hang a size on yet |
| Sports | Tickets, facilities, participation | Thin taxonomy; easy to invent a leisure lump |
| RMG / Textiles | Export value at HS; CMT vs FOB | Segment-first orgs; do not quote one HS heading as the sector |

**Later four (founder will confirm names):** the first intern wave went deep on a subset. Your later wave is the remaining thin shells, likely **e-commerce, sports**, plus two of ICT / energy / logistics SKUs. Do not wait to invent landscapes. Snapshot all 10 first.

---

## 5. Worked “do / do not” (copy this shape)

**Do (review card):**

```text
Domestic wet fish (household spend) — Bangladesh — ~$X

- What we size: household spend on wet/fresh/frozen fish and crab, not cold-chain share.
- Not included: dry fish (shutki) already sized elsewhere; export chilled/live is a sibling product.
- Method: demand × retail (FSS table × households).
- Inputs: each line has publisher, table, year, URL.
- FX: current rate, dated.
- Assumptions: labeled. No silent fill for 2020.
- Verdict: write / hold.
```

**Do not:**

- Average BBS and a trade association PDF into one number
- Use Mali DHS or an IEEE classifier to predict BD industry spend
- Apply bKash’s cash-out % to all-rail or all-MFS GMV
- Fill a blank 2020 so the chart looks finished
- Write `source_name` as “Moncho” or “SML”

Analyst mistakes: [`IDE_AGENT_MISTAKES.md`](../docs/reference/IDE_AGENT_MISTAKES.md) M-25 / M-26 / M-27.

---

## 6. SEA and GCC (next GTM phase, not your write path)

Method is **country-agnostic**. The engine must not grow a `my-electronics-tam.ts`. Harvest keys live in the metric-key registry, not in agent code.

**SEA (MY / VN / ID / PH, SG as WTP anchor) is gated.** All four must pass before anyone clones curated TAM:

1. Same sizing call works on BD and one SEA harvest with no engine fork
2. Analog reference facts exist for named peers (do not invent Malaysia)
3. Enough BD sectors published with honest source labels (queue, not 30 yet)
4. Informality field filled only where LFS-class facts exist

If a gate fails, **deepen Bangladesh**. GCC (UAE / KSA) is a later high-WTP motion, same objects, different publishers (GASTAT, FCSA, central banks). You are not opening those countries.

What *is* intern work for later countries: keep grain, publisher, and method family portable in every BD note you write. A fisheries card that names FSS Table 5.10 is reusable as a pattern. A card that says “we assumed 2% of GDP” is not.

---

## 7. What you produce (this cohort)

| Produce | Do not produce |
|---------|----------------|
| Coverage snapshot rows (all 10, lighter than first wave) | A new TAM for a sector because the page looks empty |
| Factor notes: object, grain, source, unit, year | Simulated JSON or blog metrics |
| SKU / org scoring on a **small** slice | Country-wide post-inject |
| Review cards for founder | `tam_total` writes |
| Honest “missing” | Analog as High confidence |

Gold task (week 0, founder picks one leaf): one grant-ten segment, name the object, list every factor you have and every factor you lack. No TAM in the doc.
