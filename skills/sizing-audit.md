# Skill: Bottom-up sizing audit (analyst)

**Audience:** Contract analysts on the Moncho Analyst Workbench.  
**When to use:** Before claiming a BD segment can be sized, and when searching or staging extra **factors** (production, price, utilization, ARPU, enrollment, throughput, GMV, take rate, cited share).  
**Do not use this to write TAM.** Published TAM stays founder-gated via curated TAM review.

Default pack is **Track A consultant-7**, not the ICT grant ten.

---

## Two packs (do not collapse)

| Pack | Who | Sectors | Jute |
|------|-----|---------|------|
| `bd-gtm-consultant-7` (**default**) | Consultants / sizing audit | Agri, **jute**, energy, finance, logistics, health, RMG | Required |
| `bd-gtm-grant-10` (opt-in) | Grant Data Ops coverage snapshots | Finance, agri, education, ICT, energy, health, logistics, e-commerce, sports, RMG | **No** |

Name which pack you are on before you search. Grant-ten docs are not the paid campaign list. Track B OF/LinkedIn cells are out of scope.

Method cards: [`sizing-templates/`](../sizing-templates/). Do not fork a second method list. The platform catalog is founder-side.

---

## Hard rules

1. **Method before facts.** Finance ≠ agri ≠ ports ≠ jute JDP. A BSY production row is not useful for an MFS fee pool. Whole-economy jute export $ is not a shoes/bags size.
2. **Bottom-up grain.** Sector lumps grade `LUMP_NOT_BOTTOM_UP` (healthcare `$19.4B`, jute `$820M`, port `$4B` year-2033). Untagged trade/LFS/SMI rows that match no required variable grade `NOISE`.
3. **Submit factors, not TAM.** Allowed: production, price, utilization, ARPU, enrollment, throughput, GMV, take rate, cited share. Forbidden: computed `tam_total` / invented C×P×F×P. **Do not sell or stage a jute TAM.**
4. **MCP never writes live DB.** `moncho_stage_market_facts` calls `POST /api/analyst/market-facts/stage` (max 50, HITL). Same auth as discovery (`MONCHO_AUTH_TOKEN`).
5. **Publisher `source_name` only.** Skip search if Exa/Tavily unset; do not swap providers.
6. **Org counts and EPB stubs are not TAM.** Jute can have hundreds of mapped orgs and almost no factor facts.

---

## Loop

1. Resolve pack → Moncho slug(s). Call discovery resource `sizing-readiness` `mode=template`, then `mode=inventory` (default pack `bd-gtm-consultant-7`). Grant analysts pass `pack=bd-gtm-grant-10`.
2. Review one card per landscape/segment: `SIZEABLE` / `PARTIAL` / `MISSING` / `NOISE` / `LUMP_NOT_BOTTOM_UP` / `TAXONOMY_BLOCKED`. Jute must show **three** cards: raw/yarn, JDP, shoes/bags.
3. `MISSING` / `PARTIAL` only: `mode=pointers`, then Exa/Tavily on official domains first. Label evidence **primary** (official stats, regulator, customs) vs **secondary** (news, decks). Weak/proxy = `not_usable_for_headline`.
4. Draft factor JSON matching [`samples/market_fact_sample.json`](../samples/market_fact_sample.json). Follow [`validation_submission.md`](validation_submission.md). Stage via MCP or `npm run submit -- --type market_fact`.
5. Never write TAM. Never treat org counts as TAM. Never sell a jute TAM.

REST examples:

```bash
npx tsx scripts/discovery/lookup.ts sizing-readiness --sector_slug=jute-natural-fibres --mode=template
npx tsx scripts/discovery/lookup.ts sizing-readiness --sector_slug=jute-natural-fibres --country=Bangladesh --mode=inventory
npx tsx scripts/discovery/lookup.ts sizing-readiness --sector_slug=financial-services --mode=pointers
```

MCP: `moncho_discovery_lookup` with `resource=sizing-readiness`. Stage factors with `moncho_stage_market_facts`.

---

## Submit shape

Required: `metric_key`, `country`, `year`, `value`, `unit`, `source_name`, `sector_slug`, `fact_type`.  
Also tag: `dimensions.landscape_slug`, `dimensions.segment_slug`, `dimensions.sizing_method`, `dimensions.variable_family`.

Do not stage `metric_key=tam_total` unless quoting an official published total (`dimensions.quotes_official_published_total=true`), and even then it grades lump. Prefer registry factor keys. Jute `$820M` must not be re-submitted as a segment TAM.

Priced SKUs stay on the product CR path when G4 (price at `segment_id`) is the gap.

---

## Track A cards (required)

| Family | Card |
|--------|------|
| Agri | [`sizing-templates/agri.md`](../sizing-templates/agri.md) |
| Jute | [`sizing-templates/jute.md`](../sizing-templates/jute.md) |
| Energy | [`sizing-templates/energy.md`](../sizing-templates/energy.md) |
| Finance | [`sizing-templates/finance.md`](../sizing-templates/finance.md) |
| Logistics | [`sizing-templates/logistics.md`](../sizing-templates/logistics.md) |
| Health | [`sizing-templates/health.md`](../sizing-templates/health.md) |
| RMG | [`sizing-templates/rmg.md`](../sizing-templates/rmg.md) |

Grant-ten extras (optional): education, ICT, retail, sports in the same folder, marked grant-pack only.
