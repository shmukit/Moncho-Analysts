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

- `ANALYST_DISCOVERY_MCP.md`
- `PRODUCT_ORG_RUBRICS.md`
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

Add to `.cursor/mcp.json` in your **Moncho-Analysts** workspace (Cursor). The same shape works in Claude Desktop, Claude Code, Windsurf, and VS Code MCP extensions:

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

Restart your IDE/host after saving.

---

## Step 4 — Verify MCP

In Cursor chat, try:

- "Use Moncho MCP: coverage for sector `ict-services`"
- "Search orgs named Grameen with country Bangladesh"
- "Check duplicate org: name=Acme Ltd website=https://acme.com"

Success: JSON with `data` and `meta` fields.

---

## Step 5 — CLI fallback (optional)

If MCP is not configured yet:

```bash
npx tsx scripts/discovery/lookup.ts coverage --sector_slug=ict-services
npx tsx scripts/discovery/check-duplicate.ts organization "Acme Ltd" https://acme.com
```

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
| 401 Unauthorized | Regenerate API key; check `MONCHO_AUTH_TOKEN` in `.env` |
| MCP not listed | Run `npx -y @moncho-ai/analyst-discovery-mcp` directly in a terminal to confirm it installs; restart IDE/host |
| 429 rate limit | Wait for `retry_after_sec`; narrow queries |
| `unknown_resource` | Use `hs-codes`, `market-facts`, `taxonomy-standards` (hyphenated) |

Full reference: [`ANALYST_DISCOVERY_MCP.md`](ANALYST_DISCOVERY_MCP.md)

---

## What analysts do **not** need

- Moncho-V1 repository access  
- Supabase or service-role keys  
- `npm run db:*` commands  
- Raw SQL
