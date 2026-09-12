# Loop-Aware Data Work (for analysts)

**Status:** Shareable with contract analysts and external analyst groups  
**Last updated:** 2026-07-26  
**Audience:** Anyone using the [Moncho-Analysts](https://github.com/shmukit/Moncho-Analysts) workbench  
**Related:** [`HANDBOOK.md`](./HANDBOOK.md) · [`ANALYST_DISCOVERY_MCP.md`](../discovery/ANALYST_DISCOVERY_MCP.md) · [`skills/validation_submission.md`](../../skills/validation_submission.md)

---

## Why this note exists

Moncho is moving from “open the IDE and invent a hunt every day” toward **loop-aware** data work: machines and scheduled platform jobs handle a lot of repetitive discovery, while analysts spend time on **judgment, hard research, and quality**.

You do **not** need Moncho’s internal engineering systems. You keep using this workbench: skills, MCP, submit scripts, and the Analyst Dashboard.

If something in this note conflicts with your founder brief for a specific engagement, follow the brief.

---

## The simple idea

A “loop” is not a smarter chatbot. It is a repeatable cycle:

1. **See what is missing** (coverage, gaps, review queue)  
2. **Do one unit of work** (research, extract, fix)  
3. **Check the work** (schema, duplicate check, scoring)  
4. **Submit** (change request or staged market fact)  
5. **Stop or pick the next gap** (don’t grind forever on the same thin lead)

Your job is still human judgment. The change is that you **start from gaps and queues**, not from a blank search box.

---

## What stays the same (your two hubs)

### Hub 1 — IDE (this workbench)

- Research with your AI IDE and the skill pack  
- Draft JSON that matches `samples/`  
- Run QA and submit via `npm run submit` / `scripts/submit_data.ts`  
- Use Discovery MCP for coverage, orgs, products, facts, and duplicate checks  

### Hub 2 — Dashboard

- [Analyst Dashboard](https://app.moncho.ai/analyst/dashboard)  
- Workbench Access API key (`MONCHO_AUTH_TOKEN`)  
- My Work → Submissions (pending / in review / completed / rejected)  

Setup details: [`HANDBOOK.md`](./HANDBOOK.md) and [`MCP_SETUP_AFTER_MERGE.md`](./MCP_SETUP_AFTER_MERGE.md).

---

## Three modes of analyst work

Pick a mode on purpose before you start a long IDE session.

| Mode | When to use it | What you do |
|------|----------------|-------------|
| **Fill gaps** | Coverage is thin, or your brief names a hard gap machines won’t solve | Deep research: edge orgs, messy catalogs, PDFs, unclear ownership |
| **Review / correct** | Submissions need fixes, or you were asked to clean duplicates / bad URLs | Update by existing `entity_id`, fix fields, resubmit; don’t recreate |
| **Define standards** | New segment mapping, scoring edge cases, landscape placement rules | Write clear notes + sample JSON so the next person (or platform job) can repeat the pattern |

**Volume** (many similar orgs in a well-known segment) increasingly comes from platform automation. **Judgment** stays with you.

---

## Loop-aware daily workflow

### 1. Orient before you hunt

Before opening twenty browser tabs:

1. Read your founder / engagement brief (sector, country, entity types, targets).  
2. Use Discovery MCP (or CLI) for **coverage** on your `sector_slug`.  
3. Search existing **orgs** / **products** so you don’t recreate what already exists.  
4. Check **Submissions** on the dashboard for your own pending items and reviewer feedback.

Example prompts for your IDE agent:

- “Use Moncho MCP: coverage for sector `ict-services`”  
- “Search orgs named … in Bangladesh for this sector”  
- “Check duplicate org before I draft CREATE JSON”

### 2. Prefer the highest-leverage work

| Prefer | Deprioritize (unless brief says otherwise) |
|--------|---------------------------------------------|
| Products for orgs that already exist and are approved | Another generic org scrape of a segment that is already dense |
| Orgs with weak websites / ambiguous identity | Re-listing companies that MCP already returns |
| Market facts with a clear official source | Guessing metrics without a citeable source |
| Fixing rejected submissions with reviewer notes | Submitting a second CREATE for a likely duplicate |

### 3. Draft → QA → duplicate check → submit

Unchanged discipline:

1. Match `samples/` for the entity type.  
2. Follow [`skills/validation_submission.md`](../../skills/validation_submission.md).  
3. Run `moncho_check_duplicate` before every **new** organization CREATE.  
4. Submit:

```bash
npm run submit -- --file data/pending/orgs.json --type organization
npm run submit -- --file data/pending/products.json --type product
npm run submit -- --file data/pending/facts.json --type market_fact
```

Batch limit: max **50** objects per file. Never use `--skip-qa` unless an admin explicitly told you to.

### 4. Close the loop after review

- **Approved / applied:** note what worked (source pattern, segment placement).  
- **Rejected:** fix root cause; update your local notes or ask to improve a skill/sample.  
- **Duplicate / merge guidance:** update the existing record; do not force a new CREATE.

Your reject and approve patterns help Moncho improve automated discovery later. Careful feedback is part of the job.

---

## How your work meets platform automation

You do not run Moncho’s internal job runners. You only need this mental model:

```text
You (workbench) ──submit──► Review queue / staging ──agent tag──► Human approve ──► Live Moncho data
Platform jobs ──stage──►     same review surfaces ───────────────────────────────► Live Moncho data
```

After you stage market facts (Bulk inject / CLI), a **DeepSeek agent** may tag rows with Accept / Reject / Changes plus a short reason. That tag is a **recommendation only**: you or a senior reviewer still clicks **Approve & publish** on the Review Queue. Filter **Agent accept** to bulk-publish high-confidence rows; spot-check Reject and Changes. Same pattern applies to Sherpa research candidates before queue-for-data-review.

Both paths land in the **same review and apply process**. That means:

- Always check coverage and duplicates first.  
- If a segment already looks crowded, ask whether you should deepen **products** or **facts** instead of more orgs.  
- Do not invent a second private schema. Use the published samples and submit types.

Entity pipelines (summary):

| Type | What you submit | After approval |
|------|-----------------|----------------|
| `organization` | Change request | Live organization record |
| `product` | Change request | Live product / metrics path |
| `market_fact` | Staged fact for SML review | Live `market_facts` when approved |
| `landscape` / `metadata` / `expert` | Change request (as briefed) | Live metadata / landscape / experts |

Details: [`skills/validation_submission.md`](../../skills/validation_submission.md) and [`DATABASE_SCHEMA_OVERVIEW.md`](../reference/DATABASE_SCHEMA_OVERVIEW.md).

---

## What you should not do

- Ask for database credentials or “production write” access  
- Bypass duplicate check or mechanical QA  
- Recreate an org MCP already finds (update by id instead)  
- Treat every empty cell as a personal research epic when your brief says another lane is covering volume  
- Commit API keys or `.env` files  
- Share internal Moncho engineering docs that were not meant for your group  

If you are unsure whether a gap is yours, ask the founder or engagement lead before spending a full day on it.

---

## Quality bar (short)

- **Truth over volume.** No invented websites or metrics.  
- **Score orgs** with [`SCORING_STANDARDS.md`](../reference/SCORING_STANDARDS.md) when your role requires it.  
- **Cite sources** for facts (`source_name`, URL or document when available).
- **Tag market facts** with `sector_slug` and `fact_type` at submit. Untagged rows are rejected.  
- **Map to the right sector / segment** using taxonomy tools and your brief.  
- Skim [`IDE_AGENT_MISTAKES.md`](../reference/IDE_AGENT_MISTAKES.md) before long discovery sessions.

---

## Example week (what “good” looks like)

| Day | Useful analyst focus |
|-----|----------------------|
| Mon | Coverage check; claim a clear gap (e.g. products for 5 known orgs) |
| Tue | Research + draft JSON; duplicate checks; submit a clean batch |
| Wed | Respond to reviewer feedback; fix rejects the same day when possible |
| Thu | Hard case: PDF or directory source; stage facts or orgs with strong provenance |
| Fri | Short note: what filled, what is still thin, what should be next week’s brief |

Your success is not “most browser tabs.” It is **approved, correctly mapped data** and clearer coverage than when you started.

---

## FAQ

**Do I need Moncho-V1 or internal job tools?**  
No. This workbench + dashboard + API key is enough.

**Will automation replace analysts?**  
No. Automation takes repetitive volume. Analysts remain for judgment, messy sources, scoring, and standards.

**What if MCP says coverage is already high?**  
Ask for a product, fact, or landscape task. Don’t force more low-quality orgs.

**Where do I get help?**  
Founder / engagement lead for scope. Workbench docs for how-to. Dashboard Submissions for status of what you already sent.

---

## Quick links

| Doc | Use |
|-----|-----|
| [`HANDBOOK.md`](./HANDBOOK.md) | Setup and two-hub operating manual |
| [`ANALYST_DISCOVERY_MCP.md`](../discovery/ANALYST_DISCOVERY_MCP.md) | Coverage, lookup, duplicate check |
| [`MCP_SETUP_AFTER_MERGE.md`](./MCP_SETUP_AFTER_MERGE.md) | Wire MCP in your IDE |
| [`skills/validation_submission.md`](../../skills/validation_submission.md) | QA + submit rules |
| [`SCORING_STANDARDS.md`](../reference/SCORING_STANDARDS.md) | Org quality rubric |
| [`IDE_AGENT_MISTAKES.md`](../reference/IDE_AGENT_MISTAKES.md) | Common failure patterns |

Welcome to loop-aware work: start from the gap, verify, submit, and move to the next real gap.
