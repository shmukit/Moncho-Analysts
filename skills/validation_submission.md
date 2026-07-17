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
| QA for `market_fact` | **Inline in submit script** | Required fields checked before POST to staging API. |
| Running QA in the IDE before submit | **You / IDE agent must do this** | Fix FAIL/FLAGGED rows before wasting a submit. |
| Stage 2 deep fact-check (`--deep-check`) | **No** | Optional. Needs Tavily/Exa (+ optional Anthropic). |
| Senior Analyst / Admin approval | Separate | Change requests: `/analyst/review`. Facts: CMS staging review. |

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
# Organizations
npx tsx scripts/utils/validate-analyst-data.ts data/pending/your-file.json --type organization
npx tsx scripts/qa_agent.ts --file data/pending/your-file.json --type organization

# Products
npx tsx scripts/utils/validate-analyst-data.ts data/pending/your-file.json --type product

# Product shots (any sector) — contact-sheet visual audit before claiming media reviewed
npm run audit:product-images -- --file data/pending/your-file.json
# Then open data/qa-reports/<stem>-image-audit/contact-sheet.html (see skills/product_image_audit.md)

# Market facts — required fields validated by submit script; match samples/market_fact_sample.json
```
**Statuses:**
- **PASS** — ok to submit (Senior Analyst may still spot-check).
- **FLAGGED** — submit allowed by gate; fix when possible.
- **FAIL** — **do not submit**. Fix and re-run QA.

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
- Market facts: founder/CMS reviews `staging_market_facts` before promotion to live SML.
- Rejection notes appear in Submissions; fix JSON and resubmit.

See also: `docs/onboarding/DASHBOARD_WALKTHROUGH.md` § Bulk inject notes.
