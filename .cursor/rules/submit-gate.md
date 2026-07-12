# Cursor Rules — Submit gate (mandatory QA)

## Hard rule
Before calling `npm run submit` or `scripts/submit_data.ts`, you MUST run mechanical QA in the shell and confirm exit code 0 (zero `FAIL` records).

```bash
npx tsx scripts/utils/validate-analyst-data.ts data/pending/<file>.json --type <organization|product|landscape|expert>
```

Then open `data/qa-reports/<basename>-executive-summary.json` and address the `human_review_queue`.

## Never
- Never submit while any record status is `FAIL`.
- Never pass `--skip-qa` unless a human admin explicitly ordered it in this chat.
- Never invent a “validation passed” claim without showing the command output.

## What submit already does
`npm run submit` auto-runs Stage 1 mechanical QA again and blocks on FAIL. That does **not** replace running QA yourself first so you can fix the JSON.

## Optional Stage 2
`--deep-check` on `scripts/qa_agent.ts` uses Tavily then Exa (optional Anthropic). Not required for the submit gate.

## Canonical docs
- `skills/validation_submission.md`
- `.cursor/rules/qa-reviewer.md`
- `scripts/README.md`
