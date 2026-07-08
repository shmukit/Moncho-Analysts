# Moncho.ai — Analyst QA Toolkit

Drop-in additions to your existing analyst repo:

```
cursor-rules/
  discovery-analyst.md   → paste into Cursor "Rules for AI" for the analyst who researches/extracts
  qa-reviewer.md         → paste into a SEPARATE Cursor workspace/rule for the QA pass
scripts/
  qa_reviewer.ts         → mechanical QA: schema, URLs, duplicates, slugs, vague-rationale detection
  deep_fact_check.ts     → claim-level QA: web search + LLM entailment judgment on rationales
test/
  mock_deep_fact_check_v2.ts → in-process test proving deep_fact_check's logic works, using a
                               stubbed fetch (no live API keys needed to verify the control flow)
data/pending/
  test-batch.json                 → organization fixture (dead link, duplicate, vague rationale)
  test-landscape-expert.json      → landscape/expert fixture
```

## How this minimizes manual review (without pretending it's zero)

Two-stage pipeline, both stages run by the AI agent, human only touches the output of stage 2:

**Stage 1 — `qa_reviewer.ts` (mechanical, always runs, real HTTP calls):**
schema shape, URL liveness, duplicates, slug format, vague-language detection.
Fast, cheap, runs on every record.

**Stage 2 — `deep_fact_check.ts` (claim-level, runs with `--deep-check` or standalone):**
For every rationale with a concrete claim, it actually searches the web
(Tavily) and asks an LLM to judge — *only from the retrieved evidence* —
whether the claim is supported, contradicted, or unclear, with a
confidence score and cited URLs. Claims the AI itself judges as
high-confidence-supported are marked `ai_verified` with evidence attached.
Everything else (contradicted, unclear, low-confidence, search-came-up-empty)
is routed to `requires_human_review`.

**What a human actually looks at, in practice:** only the
`requires_human_review` list from stage 2, plus any `FLAGGED`/`FAIL` batch
warnings from stage 1. For a clean batch from an experienced analyst, that's
often a small fraction of records — but it is never zero by design, because:
- `ai_verified` still means "the AI found evidence it judged sufficient,"
  not "a second independent party checked it." Your own workflow doc
  requires a Senior Analyst review layer and an Admin approval gate for a
  reason — this tool feeds those gates better data, it doesn't replace them.
- The first time you run this against your real API keys, spot-check 10-15
  of the `ai_verified` claims by hand. That's a one-time calibration cost
  to find out if the confidence threshold (`--confidence-threshold`,
  default 0.75) is set right for your data. After that, trust scales.

## What this actually does (and doesn't)

**Does, for real, at scale (Stage 1):**
- Fetches every `website_url` / `logo_url` / `product_media[].image_url` with a
  real HTTP request (with a browser User-Agent, so it doesn't false-positive
  on Cloudflare-protected sites) and reports the true status code.
- Validates Organization and Product records against their exact schema.
- Validates Landscape and Expert records against a **best-effort** schema
  (see caveat below) plus a generic sample-driven cross-check via `--sample`.
- Flags duplicates within a batch and against an existing DB export
  (`--db path/to/export.json`).
- Flags non-kebab-case slugs, implausible founded_years, non-omitted `id`
  fields on new records, and copy-pasted/boilerplate descriptions.
- Flags rationales that read as opinion rather than evidence (no number,
  date, %, or named entity — matching the "Bad vs Good" example in your own
  `SCORING_STANDARDS.md`).

**Does, for real, per-claim (Stage 2 — genuinely automates fact-checking, doesn't fake it):**
- Actually searches the web per claim and asks an LLM to judge strictly
  from retrieved evidence — no outside-knowledge guessing permitted by the
  prompt.
- Surfaces exactly which claims it's unsure about, with its reasoning,
  instead of a blanket "verified" stamp.

**Does NOT do, on purpose, in either stage:**
- Does not silently auto-approve anything or write to a database. Every
  output is PASS/FLAGGED/FAIL + requires_human_review, feeding your existing
  Change Request → Senior Analyst → Admin pipeline.
- Does not claim instant, cost-free, human-free fact-verification "at
  millions of data points." Stage 1 is genuinely instant and free at scale.
  Stage 2 is real network- and API-bound work — cost and time scale with
  the number of claims, same as it would for a human, just much faster and
  much cheaper per claim.

## ⚠️ Landscape/Expert schema caveat

`validateLandscapeSchema()` and `validateExpertSchema()` in `qa_reviewer.ts`
are **best-effort guesses** based on the table description you gave
("Landscape with segments and TAM", "Expert profile and segment mapping") —
`landscape_sample.json` and `expert_sample.json` weren't provided. Two ways
to close this gap:
1. Share the real sample files and I'll hardcode exact validators.
2. Or just pass `--sample samples/landscape_sample.json` — the generic
   sample-driven cross-check (`validateAgainstSampleShape`) will infer
   required fields directly from whatever the real sample contains, no
   code changes needed. Both can run together (hardcoded + generic) for
   defense in depth.


## Usage

```bash
cd scripts
npm install -D typescript tsx @types/node   # one-time

# Stage 1: mechanical QA (always run this first)
npx tsx qa_reviewer.ts \
  --file data/pending/2026-01-25-onboarding-YOURNAME.json \
  --type organization \
  --db data/exports/existing-organizations.json \
  --sample samples/organization_sample.json \
  --concurrency 20 \
  --timeout 8000 \
  --out data/qa-reports/ \
  --deep-check   # optional: chain straight into stage 2 below

# Stage 2: claim-level fact-check (standalone, or via --deep-check above)
export TAVILY_API_KEY=your_key
export ANTHROPIC_API_KEY=your_key
npx tsx deep_fact_check.ts \
  --file data/pending/2026-01-25-onboarding-YOURNAME.json \
  --report data/qa-reports/2026-01-25-onboarding-YOURNAME-qa-report.json \
  --confidence-threshold 0.75 \
  --concurrency 5 \
  --sample-rate 1.0 \
  --only-flagged   # optional: only deep-check claims stage 1 already flagged as vague
```

Exit code is non-zero if any record FAILs stage 1 — wire this into a
pre-submit git hook or CI step so a batch with hard failures (dead links,
duplicates) can't reach `submit_data.ts` in the first place. `FLAGGED`
records and stage-2 `requires_human_review` claims still need a human
look but don't block submission on their own.

**Cost control at scale:** `--sample-rate` lets you deep-check 100% of
claims for high-priority batches and a smaller random sample (e.g. `0.2`)
for lower-stakes ones, while still always checking anything stage 1 already
flagged as vague. This is the same tradeoff a fully-staffed human QA team
would make — spend the expensive verification step where it matters most.

## Suggested pipeline position

```
Analyst (Cursor + discovery-analyst.md)
        ↓ produces data/pending/*.json
qa_reviewer.ts   ← run this before submit_data.ts, always
        ↓ PASS/FLAGGED records
Senior Analyst reviews FLAGGED + spot-checks PASS
        ↓
submit_data.ts → Change Request
        ↓
Admin clicks Apply → production DB, reputation updates
```

## Extending it

- **Landscape / Expert schemas**: only Organization and Product validators
  are filled in above because those were the schemas fully specified.
  Add `validateLandscapeSchema()` / `validateExpertSchema()` following the
  same pattern once you share `landscape_sample.json` / `expert_sample.json`.
- **Deeper fact-checking pass**: if you want an optional second stage that
  uses Tavily/OpenAI (or the Anthropic API) to cross-check a rationale's
  claim against a live search, that's a legitimate next step — but budget
  real time/cost per record for it, since that's what distinguishes actual
  verification from a rubber stamp.
