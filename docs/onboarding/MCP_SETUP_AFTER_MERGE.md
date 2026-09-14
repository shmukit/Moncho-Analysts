# Analyst Discovery MCP — setup after workbench merge

**Audience:** Contract analysts (ICT grant and future cohorts).  
**When:** After the Moncho team merges `feat/analyst-discovery-mcp` into the [Moncho-Analysts](https://github.com/shmukit/Moncho-Analysts) `main` branch and deploys the Moncho API.

---

## What you get

- Read-only **discovery** in your IDE (sectors, orgs, products, pricing, coverage, duplicates, market facts)
- No database credentials in your workbench repo
- Same API key you already use for submissions

---

## Step 1 — Update your workbench repo

```bash
cd Moncho-Analysts
git checkout main
git pull origin main
```

Confirm these files exist:

- `docs/discovery/ANALYST_DISCOVERY_MCP.md`
- `docs/onboarding/MCP_SETUP_AFTER_MERGE.md`
- `.cursor/mcp.json.example`
- `scripts/discovery/lookup.ts`
- `scripts/discovery/check-duplicate.ts`

---

## Step 2 — API key

1. Open [Analyst Dashboard](https://app.moncho.ai/analyst/dashboard) → **Workbench Access**
2. Copy your API key (or regenerate if needed)
3. In your workbench root, set `.env` (never commit):

```bash
MONCHO_API_URL="https://app.moncho.ai"
MONCHO_AUTH_TOKEN="your_api_key_here"

# Your existing discovery keys (Tavily, Exa, Logo.dev) stay unchanged
```

---

## Step 3 — MCP server (any MCP-compatible host)

The MCP server is published to npm as `@moncho-ai/analyst-discovery-mcp`. **No Moncho-V1 repo access, no local build, no shared files.**

Copy [`.cursor/mcp.json.example`](../../.cursor/mcp.json.example) to `.cursor/mcp.json` in this workbench (or paste the block below). Cursor loads `MONCHO_AUTH_TOKEN` from the repo-root `.env` via `envFile`. Do not use `${env:MONCHO_AUTH_TOKEN}` unless that variable is already in your **OS** environment; Cursor does not read `.env` for `${env:}` interpolation.

```json
{
  "mcpServers": {
    "moncho-discovery": {
      "command": "npx",
      "args": ["-y", "@moncho-ai/analyst-discovery-mcp"],
      "env": {
        "MONCHO_API_URL": "https://app.moncho.ai"
      },
      "envFile": "${workspaceFolder}/.env"
    }
  }
}
```

`envFile` is Cursor-specific. Claude Desktop / Claude Code / Windsurf: put `MONCHO_AUTH_TOKEN` in the server `env` object (or your host's env UI). This server is **stdio + API key**, not OAuth. Do **not** run Cursor `mcp_auth` against it.

Fully quit and reopen the IDE after saving. A window reload is not enough.

---

## Step 4 — Verify MCP

In Cursor chat, try:

- "Use Moncho MCP: coverage for sector `ict-services`"
- "Search orgs named Grameen with country Bangladesh"
- "Check duplicate org: name=Acme Ltd website=https://acme.com"

Success: JSON with `data` and `meta` fields.

---

## Step 5 — CLI fallback (optional)

If MCP is not configured, or Cursor Agent says the process client is not registered, use REST or the CLI (same API key). Run from the workbench root after `npm install`:

```bash
npx tsx scripts/discovery/lookup.ts coverage --sector_slug=ict-services
npx tsx scripts/discovery/check-duplicate.ts organization "Acme Ltd" https://acme.com
```

Or: `npm run discovery:lookup -- coverage --sector_slug=ict-services`

The CLIs load `.env` via `scripts/lib/load_env.ts` (same helper as submit). They do not use the `dotenv` npm package.

---

## Limits to know

| Limit | Value |
|-------|------:|
| Requests per minute | 60 |
| Requests per day | 500 |
| `market-facts` per minute | 20 |
| Rows per lookup (default / max) | 20 / 50 |

If rate limited, the tool returns structured text with **Retry after N seconds**. Wait, then use narrower filters (`sector_slug`, `q`, `country`).

---

## Workflow reminder

1. **Orient** — `taxonomy` or `coverage` for your sector  
2. **Research** — web search (Tavily/Exa) as before  
3. **Check duplicates** — MCP or CLI before drafting JSON  
4. **Score** — `SCORING_STANDARDS.md` + `PRODUCT_ORG_RUBRICS.md`  
5. **Submit** — `scripts/submit_data.ts` → change request (unchanged)

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| 401 Unauthorized | Regenerate API key; check `MONCHO_AUTH_TOKEN` in `.env`. Confirm `envFile` points at that file (Cursor) or the token is in MCP `env`. |
| MCP not listed | Run `npx -y @moncho-ai/analyst-discovery-mcp` in a terminal; fully quit Cursor and reopen |
| `Cannot call tool before MCP process client is registered` | Cursor Agent bridge, not a Moncho 401. Do not call `mcp_auth`. Toggle `moncho-discovery` off/on, fully quit Cursor, new chat. Cloud Agent cannot use local `npx` stdio. Use REST or the CLI until MCP reconnects. |
| 429 rate limit | Wait for `retry_after_sec`; narrow queries |
| `unknown_resource` | Use `hs-codes`, `market-facts`, `taxonomy-standards` (hyphenated) |

Full reference: [`ANALYST_DISCOVERY_MCP.md`](../discovery/ANALYST_DISCOVERY_MCP.md)

---

## What analysts do **not** need

- Moncho-V1 repository access  
- Supabase or service-role keys  
- `npm run db:*` commands  
- Raw SQL
