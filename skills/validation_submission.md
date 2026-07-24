## Skill: Validation, QA Review & Submission

Use this skill **every time** you are about to submit data. IDE agents must treat QA as mandatory, not optional.

---

### 1. When to use this skill

- After you have a draft JSON file matching one of the `samples/*.json` schemas.
- Before **every** call to `npm run submit` / `scripts/submit_data.ts`.
- When fixing feedback from reviewers about bad fields, missing slugs, or broken URLs.

---

### 2. Entity types and pipelines

| `--type` / Bulk inject | Pipeline | Live table (after approval) |
|------------------------|----------|-----------------------------|
| `organization` | Change request → review → CMS apply | `metadata_organization` |
| `product` | Change request → review → CMS apply | `product_metrics` |
| `metadata` | Change request | sector/segment/need metadata |
| `landscape` | Change request | landscapes |
| `market_fact` | Stage for SML review | `staging_market_facts` → `market_facts` |
| `expert` | Change request (workbench QA) | experts |

**Market facts** do not go through the org change-request API. Required fields: `metric_key`, `country`, `year`, `value`, `unit`, `source_name`. See `samples/market_fact_sample.json`.

**Batch limit:** max **50 JSON objects** per file or Bulk inject paste (50 orgs, 50 products, or 50 facts — not “50 lines”).

---

### 3. What happens automatically vs what you must run

| Action | Automatic? | Notes |
|--------|------------|--------|
| Stage 1 mechanical QA on `npm run submit` | **Yes** (org/product/landscape/expert) | `submit_data.ts` calls `validate-analyst-data.ts`. Blocks on **FAIL**. |
| QA for `market_fact` | **Inline in submit script** | Required fields checked before POST to staging API. Still match `samples/market_fact_sample.json` before submit. |
| Running QA in the IDE before submit | **You / IDE agent must do this** | Fix FAIL/FLAGGED rows before wasting a submit. |
| Stage 2 deep fact-check (`--deep-check`) | **No** | Optional. Needs Tavily/Exa (+ optional Anthropic). |
| Senior Analyst / Admin approval | Separate | Change requests: **Review Queue → Analyst submissions**. Analyst market facts: **Review Queue → Staged market facts**. AI/agent facts: CMS → AI Scraping → Market Facts. |
| Auto reviewer agent (org/product) | **Yes** | Runs after submit (~30s max stagger). Verdict appears in Review Queue; human still approves before CMS apply. |

**Never use `--skip-qa`** unless a human admin explicitly told you to.

---

### 4. Analyst access (trial vs earned)

- **3-day trial:** unlimited submissions after `/analyst/apply`.
- **After trial:** 3 pending submissions per rolling week unless **earned** (one applied approval) or Paid.
- **403 + “Weekly submission limit”** = API key is fine; entitlement cap. Ask founder for earned access or get one row approved and applied.
- **401 Unauthorized** = regenerate API key in **Settings → Developer** (`/analyst/settings`).

---

### 5. File shape & naming

- **Top-level shape**: one object or an array of objects. Each object = one change request or one staged fact.
- **Schema**: must follow the matching sample in `samples/`.
- **IDs**: omit `id` for new records; include existing `id` for updates.
- **Naming**: `data/pending/YYYY-MM-DD-topic-YOURNAME.json`

---

### 6. Mandatory QA workflow (run this in the IDE)

```bash
# Organizations — check for duplicates BEFORE submitting (hard stop, not optional)
# via MCP: moncho_check_duplicate, or REST:
curl -s -X POST -H "Authorization: Bearer $MONCHO_AUTH_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_type":"organization","name":"Acme Ltd","website_url":"https://acme.com"}' \
  "$MONCHO_API_URL/api/v1/analyst/discovery/check-duplicate"

npx tsx scripts/utils/validate-analyst-data.ts data/pending/your-file.json --type organization
npx tsx scripts/qa_agent.ts --file data/pending/your-file.json --type organization

# Products
npx tsx scripts/utils/validate-analyst-data.ts data/pending/your-file.json --type product

# Market facts — check sample shape manually or with JSON schema tools
# Required: metric_key, country, year, value, unit, source_name
```

**Statuses:**
- **PASS** — ok to submit (Senior Analyst may still spot-check).
- **FLAGGED** — submit allowed by gate; fix when possible.
- **FAIL** — **do not submit**. Fix and re-run QA.

**Duplicate check is a hard stop for organization CREATE.** `POST /api/analyst/change-requests` returns **409** on **any** `isDuplicate: true` result from the check, including fuzzy `suggestedAction: "review"` name matches, not only exact `merge` matches. If `moncho_check_duplicate` (or the CLI check above) flags `isDuplicate: true`, do not create a new org: submit an **update** against the existing `entity_id` instead, or escalate to a Senior Analyst if you believe the match is wrong.

**Domains:** prefer apex hostnames (`example.com`, `kmc.gov.bd`). Multi-part public suffixes (`gov.bd`, `co.uk`, …) are recognized via the Public Suffix List (`tldts`); the reviewer no longer treats those apex domains as “subdomains.” Prefer not to submit `www.` or path-only country sites when an apex URL exists.

---

### 7. Submission (only after QA is green)

```bash
npm run submit -- --file data/pending/orgs.json --type organization
npm run submit -- --file data/pending/products.json --type product
npm run submit -- --file data/pending/facts.json --type market_fact
```

Or **Bulk inject** in the Analyst Dashboard: `/analyst/bulk-inject` (same types, max 50 objects).

Requires `.env`: `MONCHO_API_URL`, `MONCHO_AUTH_TOKEN`.

---

### 8. After submit

- Track org/product/metadata/landscape rows in **My Work → Submissions**.
- Market facts: reviewers approve on **Review Queue → Staged market facts** (`POST /api/reviewer/staged-market-facts`). CMS Market Facts tab is for AI/agent pipelines only.
- Rejection notes appear in Submissions; fix JSON and resubmit.

See also: `docs/onboarding/DASHBOARD_WALKTHROUGH.md` § Bulk inject notes.
