# Analyst Data Validation

Canonical validation entrypoint referenced in the handbook and `.cursorrules`.

**File:** `validate-analyst-data.ts`

This is the **required gate** before submission. It runs mechanical QA and exits with code `0` only when no records **FAIL**.

---

## Usage

```bash
# Standard (mechanical QA)
npx tsx scripts/utils/validate-analyst-data.ts data/pending/your-file.json --type organization

# Shorthand via npm
npm run validate -- data/pending/your-file.json --type organization

# Full pipeline including agentic deep-check
npx tsx scripts/utils/validate-analyst-data.ts data/pending/your-file.json --type organization --full --deep-check
```

### Supported `--type` values

- `organization`
- `product`
- `landscape`
- `expert`
- `auto` (infer from record shape)

---

## What it runs

| Mode | Backend | When |
|------|---------|------|
| Default | `qa_reviewer.ts` | Fast mechanical validation |
| `--full` or `--deep-check` | `qa_agent.ts` | Mechanical + agentic fact-check |

Reports are written to `data/qa-reports/`.

---

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | No FAIL records — safe to proceed to submit (review FLAGGED if any) |
| `1` | One or more FAIL records — fix before submit |
| `2` | Script error (missing file, report not produced) |

---

## Integration with submit

`scripts/submit_data.ts` calls this validator automatically unless `--skip-qa` is passed (admin override only). Submit blocks on mechanical **FAIL** records only; run `qa_agent.ts --deep-check` separately for the full pipeline.

```bash
npm run submit -- --file data/pending/your-file.json --type organization
```

---

See [`../README.md`](../README.md) for the full agentic QA system.
