# QA Agent Tests

Mock tests for the **agentic fact-check** layer (Stage 2). No live API keys required.

---

## Run

```bash
npm run qa:test
```

Runs `mock_deep_fact_check_v2.ts`.

---

## What is tested

1. **Supported claim** — strong evidence → `supported` verdict with high confidence
2. **Vague claim** — no matching evidence → `unclear` verdict
3. **Concurrency helper** — parallel claim processing completes for all items

---

## When to use

- After changing `scripts/lib/claim_agent.ts` or `scripts/deep_fact_check.ts`
- CI smoke check before deploying QA changes
- Verify agentic logic without spending Tavily/Anthropic credits

For end-to-end QA with real data, use:

```bash
npx tsx scripts/qa_agent.ts --file data/pending/qa-user-test-all-pass.json --type organization
npx tsx scripts/qa_agent.ts --file data/pending/test-batch.json --type organization --deep-check
```

See [`../scripts/README.md`](../scripts/README.md) for full documentation.
