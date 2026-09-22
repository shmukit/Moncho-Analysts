# Intern brief: value chains (Bangladesh grant-ten)

Intern batch 2. You draft grammar and review notes. You do not auto-publish chains, invent HS codes, or treat a company as a production step. Founder reviews first.

Last updated: 2026-09-22

Same grant-ten map as sizing ([`GRANT_TEN_SECTORS.md`](../docs/onboarding/GRANT_TEN_SECTORS.md)). This is the value-chain deep dive: types, links, and what Version 1 actually ships. Method must survive a later copy to SEA and GCC without a new ontology.

---

## 1. Core components (learn these nouns)

A Moncho value chain is a **graph of economic transformations**, not a slide of company logos.

| Component | Meaning | Example |
|-----------|---------|---------|
| **Transformation (node)** | Input state → verb → output state | fibre → spin → yarn |
| **Actor** | Who performs or pays; occupies a node; **is not** the node | a spinning mill, BGMEA, Walton |
| **Observation** | A statistic about a year, geography, unit | BSY jute production 2023, tonnes |
| **Flow (edge)** | What moves, at what grain | yarn → knit, year, unit |
| **Capability / occupation** | Skills required at a node (ISCO/BSCO maps) | sewing-machine operator on CMT |
| **HS / product map** | Traded good associated as input, output, intermediate, or enabler | HS 5205 on spinning |
| **Gap / enabler** | Missing local capacity or a supporting function | dyestuff import, testing lab |
| **Capture** | Margin, brand, subscription billing | destination retail; RaaS billing |
| **Rollup** | Several real processes kept as one ID for stability | weave + knit as “fabric formation” |

**Grammar grades** (what review actually stamps):

- `PASS` — one transform, I/O clear
- `ROLLUP` — literature bundle, I/O still clear
- `LOGISTICS` — custody/location change, not a factory verb
- `CAPTURE` — value capture, labeled, not disguised as production
- `FAIL` — company-as-node, missing I/O, or mixed objects

**CDRO rule:** node ≠ HS ≠ occupation. Crosswalks are maps **on** an instance, probabilistic, human-approved. A node titled “Walton” under electronics manufacturing is a reject. Rewrite as input → process → output and link Walton as an organization if evidence exists.

---

## 2. Why this is hard

**Actors leak into stages.** “Industrial arm OEM” is a company role. “Local SI or RaaS operator” mixes labor with a business model. RMG CMT text mixed **FOB** (a governance/pricing term) into cut-make-trim (a transform).

**Prose is not a graph.** Sector overviews have ~207 chain-like units in prose. Live registry is **5 chains / 65 nodes**. The gap is review labor, not “we need more GPT.”

**Classifications are the wrong grain.** OECD TiVA `C13T15` is textiles + apparel + leather as one industry. That cannot become spinning vs CMT vs wet processing. HS import value is not a node.

**BOM graphs are a cousin, not our object.** Productive Capabilities / valuechains.ai maps **parts** (solar PV types, cost shares). Useful order of work (go below HS into types). Wrong identity for our verb+I/O chain. Do not scrape their graph. Do not explode a BD import-sub HS list into a fake BOM.

**Homonyms.** “AI infrastructure” must not pull civil-construction HS. Title-token retrieval caused this; we moved to semantic industry profiles plus human ticks.

**Country overlays.** Presence in Bangladesh, capture, and gaps are **judgments** on top of a reusable transformation type. Do not mint a new “BD spinning” node that cannot be reused in Vietnam.

**Automation temptation.** Filling missing HS “so the strip looks complete,” averaging two occupancy rates, or publishing from `draft`. Integrity fail for this internship.

---

## 3. How we actually do it (Version 1, shipped)

This is an **ops + review pipeline**, not an autonomous research agent. No web tools in v1. No auto-publish.

```
sector overview prose
  → LLM draft grammar (input, verb, output, node_kind)
  → deterministic validator (PASS / ROLLUP / LOGISTICS / CAPTURE / FAIL)
  → human review UI
  → approve to reviews/*.json
  → promote to draft nodes + flows (founder-run)
  → rank HS / occupation / gap candidates (cached)
  → human tick
  → pending map rows (still not “approved”)
  → analyst CMS publish (not you)
```

**Live today:**

- Grammar on drafts; transformation **types** (reuse verb+I/O across chains)
- Review UI (founder `/dev/vc-review`; you will see a sanitized strip or screenshots until access is granted)
- Sherpa **read** of published RMG / MRAI only
- Ranked candidates with relationship chips: `input_product` | `output_product` | `intermediate_product` | `enabling_product`
- Country-scoped gaps table; unsourced rows display as unverified opinion

**Not v1 (do not assume):**

- Mastra agent that researches the web and writes published chains
- Full economics / impact / substitutability schema on every node
- Rich edge types (feedback, substitutes, cycles) as first-class
- Org mapping from the agent
- Bulk quality pass over 200+ overview chains without a human
- Scenario / technology-disruption simulation

Your intern job is closer to reviewer and test writer than to “build the agent.” One of you will lean grammar and checks; the other products and sources. Same nouns either way.

---

## 4. Literature we actually used (read these, in this order)

Do not pad this list. These are the pieces CDRO registered as close work.

### Mapping method (how to draw the chain)

1. **Stacey Frederick, “Global value chain mapping”** (Handbook on GVCs). Activities, firms, products, places, **then** HS/CPC/ISIC/ISCO bundles. [PDF](https://www.globalvaluechains.org/wp-content/uploads/Frederick-GVC_Mapping.pdf)
2. **Gereffi, Fernandez-Stark, et al., GVC Analysis: A Primer** (2nd ed., 2016). Input–output boxes, governance, upgrading. Not a type library. [PDF](https://www.globalvaluechains.org/wp-content/uploads/Primer_2ndEd_2016.pdf)

### Bangladesh / apparel (grant RMG)

3. **Fernandez-Stark / Frederick / Gereffi, Apparel GVC and workforce** (Duke CGGC, 2011). CMT → OEM → ODM → OBM; skills. Historical, but the right *kind* of strip for BD RMG drafts. [PDF](https://www.globalvaluechains.org/wp-content/uploads/2011-11-11_CGGC_Apparel-Global-Value-Chain.pdf)
4. **Gereffi & Frederick, Global Apparel Value Chain, Trade and the Crisis** (World Bank PRWP, 2010). Trade and supplier consolidation, BD in the set. [PDF](https://www.globalvaluechains.org/wp-content/uploads/WB-PRWP-Gereffi-Frederick-Global-Apparel-GVC-2010.pdf)

### Automation cousins (what we steal, what we block)

5. **Schollmeyer et al., “Automating the mapping of value chains”** (valuechains.ai / Productive Capabilities Data Lab). Category → type → parts BOM, HS6 on types. Steal the **ranker loop**. Do not ingest their graph or LLM cost shares. [PDF](https://valuechains.ai/documents/automating-the-mapping-of-value-chains-1.pdf)
6. **Vásquez / Arauz / Schollmeyer / Estevez, Make What You Buy (APLIS)**. Procurement-led targeting. Closest Moncho analog is BD **import substitution** lists, not e-GP scrape. [PDF](https://valuechains.ai/documents/make-what-you-buy-1.pdf)

### Evidence layer (numbers, still not nodes)

7. **OECD TiVA / ICIO** — trade in value-added at ~50 industries. Fine as *Evidence* on a chain. Never as node identity. [TiVA](https://www.oecd.org/en/topics/sub-issues/trade-in-value-added.html)
8. **Li & Hidalgo (2025), product-level GVC links** — probabilistic HS→HS. Candidate associations only. [PDF](https://oec.world/pdf/mapping-global-value-chains-at-the-product-level.pdf)

**Rule of use:** Duke-style reports → `literature_rule` on a **draft**, human-extracted. TiVA → a cited observation, not a stage. BOM papers → method notes. Wikipedia of industrial BOMs **does not exist**; do not pretend OpenBOM or iFixit fills it (one-product sidecar at most).

---

## 5. Grant-ten: what a chain even is in each sector

You will not map all 10 in week 1. You will not treat empty shells as “no chain.”

| Grant sector | Transformation grain to look for | Trap |
|--------------|----------------------------------|------|
| Finance | Originate → underwrite → book; switch → settle | “bKash” as a node; fee capture as production |
| Agriculture / fisheries | Grow / harvest / mill / chill / dry | Farm name as a stage; GDP as a flow |
| Education | Enrol → instruct → credential | University as the chain |
| ICT / ITES | Spec → build → operate; BPO process steps | “AI” as a node; data-center construction HS |
| Energy | Generate → transmit → distribute → retail kWh | Fuel type mixed with company |
| Health | Diagnose → treat → dispense; device reprocess | Hospital as transform; ISIC classifier as TAM |
| Logistics | Stuff → haul → clear → destuff | One `logistics` slug; meta-sector has seven children |
| E-commerce | List → pick → pay → deliver | Empty `retail` shell; do not invent 12 stages |
| Sports | Train → compete → broadcast / venue ops | Leisure lump; ticket capture unlabeled |
| RMG | Fibre → yarn → fabric → CMT → export logistics → (capture at dest. retail) | FOB in CMT; weave+knit unlabeled rollup |

**Later four:** same as sizing. Snapshot all 10. Deepen the thin shells when founder names them. RMG and a manufacturing/AI strip are the **grammar gold** to copy, not the only sectors that exist.

---

## 6. Version 1: what we want this intern cycle to add

Not a new database. Not a chatbot that “draws the chain.”

| Want in the next 90 days | Success looks like |
|--------------------------|--------------------|
| Grammar that survives a second reader | You can mark FAIL vs ROLLUP on a strip without the founder |
| Tests / evals | Fixture: actor-as-node, missing I/O, homonym HS, integrity fill |
| Honest maps | HS relationship named; occupation has ISCO/BNQF/`none` badge; no invented codes |
| Country overlay notes | BD presence vs gap labeled; ready to copy the **type** to VN/ID later |
| Overview hygiene | When prose mixes mill names and verbs, you rewrite the verbs |

**Week 0 gold task (founder picks one):** take a published or draft strip (RMG or a grant sector overview). For three nodes, write input, verb, output, and whether each is transform / actor / observation / capture. One paragraph on a Duke (or equivalent) page you actually opened.

---

## 7. SEA and GCC

Transformation **types** are reusable. Country **instances** are not. Spinning is spinning in Dhaka and in Ho Chi Minh City. Occupancy, HS mix, and gaps change.

Do not:

- Fork a `vietnam-rmg-nodes` table
- Copy BD occupancy onto MY
- Treat GCC downstream capture (brand, re-export) as BD CMT

Do:

- Keep verb + I/O stable
- Attach country evidence as observations
- Leave SEA/GCC unpublished until the same review gate as BD

Sizing SEA is **gated** (see [`INTERN_MARKET_SIZING_BRIEF.md`](./INTERN_MARKET_SIZING_BRIEF.md) §6). Value-chain *types* can be prepared now. Value-chain *publication* for a second country is not intern scope.

---

## 8. Integrity (automatic no)

- Invent a market size or an HS code to complete a node
- Average two occupancy rates into one
- Approve a company as a transformation
- Silent-fill a missing price or tonne so Sherpa can answer
- Treat a LangChain “knowledge graph” with no types as this job
