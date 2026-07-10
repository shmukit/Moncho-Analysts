# Moncho.ai — Analyst QA Toolkit

Drop-in additions to your existing analyst repo:

```
cursor-rules/
  discovery-analyst.md   → paste into Cursor "Rules for AI" for the analyst who researches/extracts
  qa-reviewer.md         → paste into a SEPARATE Cursor workspace/rule for the QA pass
scripts/
  qa_reviewer.ts         → real, runnable first-pass QA over analyst submissions
data/pending/
  test-batch.json        → example file showing what the checker catches
```

## What this actually does (and doesn't)

**Does, for real, at scale:**
- Fetches every `website_url` / `logo_url` / `product_media[].image_url` with a
  real HTTP request (with a browser User-Agent, so it doesn't false-positive
  on Cloudflare-protected sites) and reports the true status code.
- Validates every record against the Organization/Product schema shape.
- Flags duplicates within a batch and against an existing DB export
  (`--db path/to/export.json`).
- Flags non-kebab-case slugs, implausible founded_years, and non-omitted
  `id` fields on what should be new records.
- Flags rationales that read as opinion rather than evidence (no number,
  date, %, or named entity — matching the "Bad vs Good" example in your own
  `SCORING_STANDARDS.md`).
- Flags copy-pasted / boilerplate descriptions across a batch.

**Does NOT do, on purpose:**
- Does not confirm that a revenue figure, funding round, patent, or award
  is *true*. It can confirm the source URL for the claim resolves — it
  cannot confirm the claim's substance. That's still a two-source human
  check, or a deliberate (slower, API-metered) LLM research pass you'd
  add separately.
- Does not auto-approve anything. Every output is PASS / FLAGGED / FAIL
  with `requires_human_review`, feeding the same Change Request → Senior
  Analyst → Admin pipeline you already have. Nothing here writes to a
  database or calls `submit_data.ts` for you.
- Does not claim to review "millions of data points instantly" with full
  fact-verification — mechanical checks scale fine (network-bound,
  parallelized); genuine fact-checking is inherently rate-limited by how
  fast real sources can be checked, whether by API or human.

## Usage

```bash
cd scripts
npm install -D typescript tsx @types/node   # one-time

npx tsx qa_reviewer.ts \
  --file data/pending/2026-01-25-onboarding-YOURNAME.json \
  --type organization \
  --db data/exports/existing-organizations.json \
  --concurrency 20 \
  --timeout 8000 \
  --out data/qa-reports/
```

Exit code is non-zero if any record FAILs — wire this into a pre-submit
git hook or CI step so a batch with hard failures (dead links, duplicates)
can't reach `submit_data.ts` in the first place. FLAGGED records still
require a human look but don't block submission.

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
