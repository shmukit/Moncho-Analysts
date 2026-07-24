# Analyst Discovery MCP

**Audience:** Contract analysts on the Moncho-Analysts workbench (Cursor, Antigravity, or any MCP client).

This is Moncho's **first MCP server**. It gives your IDE agent read-only access to core platform data **without** a database key or `npm run db:*` commands.

---

## What it can query

| Resource | Tables / data | Notes |
|----------|---------------|-------|
| `taxonomy` | sectors, landscapes, segments | Full reference graph; filter with `sector_slug` |
| `coverage` | counts per sector | Requires `sector_slug`; orgs, products, pricing, market_facts, needs links |
| `orgs` | `metadata_organization` | Search by name, website, country, sector |
| `products` | `products` | Search by name/group/category; sector/segment via org linkage |
| `pricing` | `product_metrics` | Brand/SKU pricing rows |
| `needs` | `needs` + `segment_needs` | Segment needs titles |
| `hs-codes` | `hs_codes` | HS2/4/6 lookup |
| `taxonomy-standards` | `taxonomy_standards` | ISIC and other standards |
| `market-facts` | `market_facts` | **Not** a full dump |
| `analysis-structure` | Sherpa analysis plan (in-memory) | **Preview only** — section outline for sector + home workflow + depth (0 credits, no LLM) |

### `market_facts` limits

- **`mode=summary`**: counts by `metric_key` (up to 5,000 matching rows sampled)
- **`mode=search`**: row detail, **max 25 rows**, requires at least one filter (`metric_key`, `sector_slug`, `fact_type`, `year`, `hs_code`, or `q`)
- Default country scope: **Bangladesh** (`country` or `iso_code=BD`)

Analysts use this to answer "do we already have trade data for HS X?" or "what metric keys exist for ICT?" — not to export the full fact table.

### International trade data lives in `market_facts` — not a separate table

There is no dedicated trade table. Import/export values are `market_facts` rows with:

- `metric_key`: `import_trade_value_usd` or `export_trade_value_usd`
- `fact_type`: `trade`
- `dimensions`: `hs2_code`/`hs4_code`/`hs6_code` (+ `_name`) identifying the HS classification level, plus `section`/`section_id`

To check whether trade data exists for a specific HS code, filter `market-facts` with `fact_type=trade` and `hs_code=<HS2|HS4|HS6 digits>` (e.g. `hs_code=8471`), not `hs-codes` (that resource is taxonomy lookup only — HS names/levels, no trade values).

**Do not conclude trade data is missing from `coverage.market_facts_with_sector_tag` alone.** That count only includes rows tagged with a `sector_slug`; OEC trade rows are frequently ingested without one, so a low or zero coverage count does not mean the country/HS code has no trade data — query `market-facts` with `fact_type=trade` directly to confirm.

### `analysis-structure` (Sherpa preview)

Preview which analysis sections Sherpa would plan for a sector before you run a report turn. Requires `sector_slug`; optional `home_mode` (default `draft_report`) and `depth` (`standard` or `deep`).

Returns `{ sector_slug, home_mode, depth, outline: { archetypeId, sections[] } }` inside the usual `{ data, meta }` envelope. Section keys and titles are consumer-safe (no internal builder ids).

Example:

```bash
curl -s -H "Authorization: Bearer $MONCHO_AUTH_TOKEN" \
  "https://app.moncho.ai/api/v1/analyst/discovery/analysis-structure?sector_slug=agriculture&home_mode=draft_report"
```

CLI: `npx tsx scripts/discovery/lookup.ts analysis-structure --sector_slug=agriculture --home_mode=draft_report`

---

## Rate limits and row caps

Limits apply per **analyst API key** (MCP, REST, and CLI scripts share the same quota).

### Request rate

| Window | Max requests | Notes |
|--------|-------------:|-------|
| 1 minute | 60 | All discovery calls (`lookup` + `check-duplicate`) |
| 1 day | 500 | All discovery calls |
| 1 minute | 20 | `market-facts` only (stricter burst cap) |

If you hit a limit, the API returns **429**. MCP and CLI scripts return **structured text** (not a tool crash) with retry timing and guidance:

```
Moncho discovery request did not succeed.
Status: 429
Code: RATE_LIMITED
Message: Analyst discovery rate limit exceeded. Wait and retry with narrower queries.
Limit tier: per_minute
Retry after: 38 seconds
Guidance: Minute burst limit reached (60/min). Wait for retry_after_sec, then retry with narrower filters (sector_slug, q, country).

{
  "ok": false,
  "error": { ... }
}
```

`Limit tier` may be `per_minute`, `per_day`, or `market_facts_per_minute`.

### Rows per response

| Resource | Default rows | Max rows |
|----------|-------------:|---------:|
| `orgs`, `products`, `pricing`, `needs`, `hs-codes`, `taxonomy-standards` | 20 | 50 |
| `market-facts` (`mode=search`) | 20 | 25 |
| `market-facts` (`mode=summary`) | aggregates only | sampled up to 5,000 matching rows |
| `taxonomy` | full reference graph | cached |
| `coverage` | counts only | no row list |
| `analysis-structure` | one outline object | section count in `meta.count` |

Pass `limit=50` on list resources when you need the maximum page size. If `meta.truncated` is `true`, refine your query (`sector_slug`, `q`, `country`) rather than requesting again with the same filters.

---

## What it cannot do

- Raw SQL or arbitrary table browse
- Write or inject data (submissions still go through `POST /api/analyst/change-requests`)
- Service-role or Supabase credentials in the workbench repo
- Unbounded `market_facts` export

---

## Setup (Cursor)

### 1. API key

1. Open [Analyst Dashboard](https://app.moncho.ai/analyst/dashboard) → **Workbench Access**
2. Copy your API key into `.env` (never commit):

```bash
MONCHO_API_URL="https://app.moncho.ai"
MONCHO_AUTH_TOKEN="your_api_key_here"
```

### 2. MCP server via npm (no build step)

The MCP server is published to npm. **No Moncho-V1 access, no local build, no Node build tooling beyond npx.**

### 3. Cursor MCP config

Add to `.cursor/mcp.json` in your **Moncho-Analysts** workspace (or user-level MCP settings):

```json
{
  "mcpServers": {
    "moncho-discovery": {
      "command": "npx",
      "args": ["-y", "@moncho-ai/analyst-discovery-mcp"],
      "env": {
        "MONCHO_API_URL": "https://app.moncho.ai",
        "MONCHO_AUTH_TOKEN": "${env:MONCHO_AUTH_TOKEN}"
      }
    }
  }
}
```

This same config shape (`command: npx`, `args: ["-y", "@moncho-ai/analyst-discovery-mcp"]`) works in Claude Desktop, Claude Code (`claude mcp add`), Windsurf, VS Code MCP extensions, and any other host that supports local stdio MCP servers — not just Cursor.

Point `MONCHO_AUTH_TOKEN` at your local `.env` value or paste via your host's env UI. Restart your IDE/host after saving.

---

## MCP tools

| Tool | Purpose |
|------|---------|
| `moncho_discovery_lookup` | Read-only search on any resource above (including `analysis-structure`) |
| `moncho_analysis_structure_preview` | Sherpa section plan preview for sector + home workflow + depth |
| `moncho_check_duplicate` | Org/product duplicate check — **required** before every organization CREATE, not optional. Any `isDuplicate: true` (including `suggestedAction: "review"`) will be hard-blocked (409) at submit. |

### Example prompts (IDE)

- "Use Moncho MCP: coverage for sector `ict-services`"
- "Preview Sherpa analysis structure for agriculture draft_report"
- "Search orgs named Grameen in Bangladesh ICT"
- "market_facts summary for sector_slug ict-services"
- "market_facts search for fact_type=trade, hs_code=8471, country=Bangladesh"
- "Check duplicate org: name=… website=…"

---

## REST fallback (no MCP)

Same backend, curl-friendly:

```bash
curl -s -H "Authorization: Bearer $MONCHO_AUTH_TOKEN" \
  "https://app.moncho.ai/api/v1/analyst/discovery/coverage?sector_slug=ict-services"

curl -s -X POST -H "Authorization: Bearer $MONCHO_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_type":"organization","name":"Acme Ltd","website_url":"https://acme.com"}' \
  "https://app.moncho.ai/api/v1/analyst/discovery/check-duplicate"
```

Workbench scripts: `scripts/discovery/lookup.ts`, `scripts/discovery/check-duplicate.ts`.

---

## Analyst workflow

```mermaid
flowchart LR
  A[Orient: taxonomy] --> B[Coverage check]
  B --> C[Web research]
  C --> D[MCP duplicate check]
  D --> E[Draft JSON + score]
  E --> F[Submit change request]
  F --> G[Founder review]
```

Duplicate guard: `POST /api/analyst/change-requests` returns **409** on **any** `isDuplicate: true` result for org CREATE — exact matches (`merge`) and fuzzy name matches (`review`) alike, not only high-confidence ones. This intentionally matches the reviewer agent, which auto-rejects on any duplicate signal; a lenient submit gate would only let you land a submission that gets rejected downstream anyway. **Always run `moncho_check_duplicate` before submitting a new organization** — a `review`-level match usually means a real duplicate; update the existing org via `entity_id` instead of creating a new one.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| 401 Unauthorized | Regenerate API key; check `MONCHO_AUTH_TOKEN` |
| 429 rate limit | Read the structured MCP response: `Retry after`, `Limit tier`, and `Guidance` lines; wait, then narrow filters |
| `unknown_resource` | Use hyphenated names: `hs-codes`, `market-facts`, `taxonomy-standards` |
| `filter_required` on market-facts | Add `mode=summary` or a search filter (`metric_key`, `sector_slug`, `fact_type`, `year`, `hs_code`, or `q`) |
| "Trade data missing" but you expect it to exist | Don't rely on `coverage.market_facts_with_sector_tag` — query `market-facts` directly with `fact_type=trade` (+ `hs_code`, `country`); `hs-codes` resource has no trade values |
| MCP not listed in Cursor | Check `npx` resolves `@moncho-ai/analyst-discovery-mcp`; run `npx -y @moncho-ai/analyst-discovery-mcp` in a terminal to confirm it installs and starts |

---

## Related docs

- [`DATABASE_SCHEMA_OVERVIEW.md`](DATABASE_SCHEMA_OVERVIEW.md)
- [`GRANT_TEN_SECTORS.md`](GRANT_TEN_SECTORS.md)
- Engineering spec (Moncho-V1): `docs/04-ai-and-agents/specs/analyst-discovery-mcp.md`
