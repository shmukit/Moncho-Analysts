# GTM Ops Analyst — ICT Grant Role

**Status:** Experimental for Moncho (lean team). Primary GTM work is **content distribution** — LinkedIn series, newsletter reactivation, short reels. No revenue or lead quotas in the first ~2 months.

**Mission:** Ship evidence-backed BD market content from existing Moncho assets; reactivate existing newsletter subscribers; learn what channels earn engagement.

**Reports to:** Founder. Founder spot-checks public data claims before publish (first batch).

---

## Ten priority sectors (content mapping)

Grant scope is **10 BD sectors**. Map posts and newsletter issues to sector stories where possible:

| # | Sector | GTM content hooks |
|---|--------|-------------------|
| 1 | Finance / Banking | Fintech, MFS, digital payments |
| 2 | Agriculture | Agri VC series, fisheries, agro-processing |
| 3 | Education | EdTech, enrollment stats (when data-backed) |
| 4 | ICT / ITES | Services export, freelancer economy |
| 5 | Energy | Power, renewables, fuel |
| 6 | Health | Pharma, providers, devices |
| 7 | Logistics | Ports, freight, corridors |
| 8 | E-commerce | Platforms, retail, consumer |
| 9 | Sports | Equipment, facilities |
| 10 | RMG / Textiles | Import substitution HS posts, RMG value chain |

Import substitution series spans many sectors via HS codes. Agri VC series covers **Agriculture** primarily.  
Full slug map: [`GRANT_TEN_SECTORS.md`](GRANT_TEN_SECTORS.md)

---

## Goals (first ~2 months)

| Goal | Done when | Not a goal yet |
|------|-----------|----------------|
| **Import substitution LinkedIn series** | Posts 1–8 published (Ready to Capture tier) | Arbitrary follower targets |
| **Agri value chain LinkedIn series** | Mini-series started from export-pilot / agri JSON | Social → signup quotas |
| **Newsletter reactivated** | Existing list audited; ≥1 send to current subscribers | New subscriber growth targets |
| **Reels (optional)** | Short videos from carousel hooks where low effort | YouTube scale targets |
| **Student access** | `/student-access` mentioned in sends or posts | Managed cohort |
| **Learn** | Kill/scale note per channel | MQLs, demos, CRM pipeline |

---

## Step 1 — Discovery checklist

- [ ] Read [`GRANT_TEN_SECTORS.md`](GRANT_TEN_SECTORS.md) — all 10 grant sectors
- [ ] Read grant [`PROJECT_PLAN.md`](https://github.com/shmukit/Moncho-V1/blob/main/docs/07-projects/bangladesh-ict-division-research-grant/PROJECT_PLAN.md) (context)
- [ ] Read [`BD_IMPORT_SUBSTITUTION_LINKEDIN_SERIES.md`](https://github.com/shmukit/Moncho-V1/blob/main/docs/03-product-and-design/BD_IMPORT_SUBSTITUTION_LINKEDIN_SERIES.md)
- [ ] Open `sample-data/bd-import-substitution/linkedin-posts.json`
- [ ] Inventory agri VC assets: `sample-data/bd-agri-vc-linkedin/` (if present) + [`bd-export-pilots/`](https://github.com/shmukit/Moncho-V1/blob/main/docs/07-projects/bd-export-pilots/) docs
- [ ] Find **existing newsletter tool + subscriber list** (ask founder — no new platform required)
- [ ] Audit site: `/pricing`, `/student-access`, contact form; note PostHog access if granted
- [ ] Baseline: subscriber count, last send date, any prior post performance

**Coverage Snapshot must answer:**

1. What is **ready to publish** from JSON vs needs layout/copy edits?
2. Import substitution vs agri VC — which series to lead with?
3. What can ship in ~2 months at lean bandwidth?

---

## Content sources

| Series | Brief | Data |
|--------|-------|------|
| **Import substitution** | [`BD_IMPORT_SUBSTITUTION_LINKEDIN_SERIES.md`](https://github.com/shmukit/Moncho-V1/blob/main/docs/03-product-and-design/BD_IMPORT_SUBSTITUTION_LINKEDIN_SERIES.md) | `sample-data/bd-import-substitution/linkedin-posts.json` |
| **Agri value chain** | [`BD_EXPORT_VALUE_CHAIN_ANALYSIS_PLAYBOOK.md`](https://github.com/shmukit/Moncho-V1/blob/main/docs/03-product-and-design/BD_EXPORT_VALUE_CHAIN_ANALYSIS_PLAYBOOK.md) | `sample-data/bd-agri-vc-linkedin/` + `bd-export-pilots` |
| **Reels** | Repurpose carousel slides 1 + 3 | 20–30s vertical; CapCut or equivalent |

**Publish order (import series):** Post 1 framework → Posts 2–8 (Ready to Capture) → Near-Term (9–15) → Horizon (16–20) per JSON `publish_schedule`.

**Visual format:** 1080×1350 carousel, 5 slides — hook + import $ · why now · capability + C/S/A badge · bottlenecks · demand countries + CTA. See brief § Visual system.

**Copy rules:** Every post follows brief § Copy template. Hashtags: `#BangladeshManufacturing #ImportSubstitution #ExportDiversification #EconomicComplexity #MadeInBangladesh #Moncho`

---

## Default channel plan (customize in 2-month plan)

| Channel | Suggested cadence | Primary asset |
|---------|-------------------|---------------|
| LinkedIn carousels | ~2× / week | Import substitution JSON (posts 1–8 first) |
| Agri VC series | ~1× / week | Agri JSON + export pilot docs |
| Newsletter | Biweekly (existing list) | 1 sector pulse + 1 HS card + CTA — **reactivate subscribers, not growth targets** |
| YouTube / LinkedIn reel | ~1× / week if bandwidth | Repurpose slides 1+3 |
| Student access | Ongoing in CTAs | `/student-access` — self-serve only |

**UTM pattern (when linking to site):**  
`utm_source=linkedin|newsletter|youtube&utm_campaign=<series>&utm_content=<post_id>`

**PostHog events to watch (if access granted):** `student_verified`, signup with UTM, newsletter clicks. See [`POSTHOG_TRACKING_GUIDE.md`](https://github.com/shmukit/Moncho-V1/blob/main/docs/06-operations/POSTHOG_TRACKING_GUIDE.md).

---

## Step 2 — Starter execution sequence (if founder approves)

| Step | Deliverable |
|------|-------------|
| 1 | Lock carousel layout template (1080×1350, 5 slides) |
| 2 | Publish LinkedIn Post #1 (framework) |
| 3 | Publish Posts 2–3 (Ready tier); promote `/student-access` in CTA where fit |
| 4 | First newsletter send to **existing** subscribers |
| 5 | First agri VC post; first reel (optional) |
| 6 | **Kill/scale review** — which channel to double down on |

Timing is flexible; order is a default, not a calendar.

---

## Hard rules

- Public posts: **data claims must match Moncho JSON/sources** (no invented import $).
- Policy/tax scores in JSON are placeholders until verified — note in post or skip.
- Founder spot-checks posts before publish (first tranche; then async).
- Students: **no managed cohort** — university email self-serve only.
- **No** paid-pilot promises, demo booking targets, or lead quotas.
- Blocked **>1–2 hours** on AI-assisted work → ask founder.

---

## Status updates (async)

- Posts published (links + post #)
- Newsletter sends (date, subject, open rate if available)
- Reels (links)
- One-line learnings per channel

---

## Step 3 — Deliverable before scaling volume

Completed [`TWO_MONTH_PLAN_TEMPLATE.md`](TWO_MONTH_PLAN_TEMPLATE.md) — founder sign-off.
