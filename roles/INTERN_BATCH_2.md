# Intern batch 2 — three months

This note is for the second intern batch. You have the same tools as the first batch: the Analyst Dashboard, this workbench repo, Cursor, and a workbench API key. You do the same kind of work. You do less of it, and you write more of the reasoning down.

The first review of everything you produce goes through the founder. Nothing is live until that happens.

The map is the [ICT Division ten sectors](../docs/onboarding/GRANT_TEN_SECTORS.md). Start with a light look at all ten. Later you will go deeper on the four sectors that still need work. The founder will name those four. Until then, do not guess, and do not invent landscapes for empty shells such as e-commerce.

---

## What a good three months looks like

By the end of the contract you should be able to show:

1. A short coverage note for all ten grant sectors: what Moncho already has, what is thin, and one honest gap per sector.
2. A small, clean slice of organisations and products (names, sources, scores). Quality over count. Far fewer rows than the first intern wave.
3. At least a few **sizing factor** notes: what is bought, who buys it, which official table, which year. Review cards are welcome. Market-size totals are not yours to write.
4. At least one **value-chain** write-up that uses the real nouns: a transformation is input → verb → output. A company is not a step. A missing HS code stays missing.
5. Deeper work on the remaining four sectors, once named, still at this smaller scale.

That is enough. It is also the ceiling unless the founder adds a ticket.

---

## What is not doable in three months

Do not plan to:

- Write or publish a TAM, a flashcard, or a `tam_total` row
- Publish a value chain, invent HS codes, or treat a company as a production step
- Match the first intern wave on volume
- Open Malaysia, Vietnam, Indonesia, the Philippines, or the Gulf. Keep Bangladesh notes reusable (publisher, grain, year) so that work can travel later
- Edit production data, run injects, or push to `main`
- Fill a blank year or average two sources so a chart looks finished
- Post about unreleased product or grant data

If a page looks empty, say it is empty. That is useful. Inventing the number is not.

---

## First review through the founder

Every draft, pull request, spreadsheet, and review card lands with the founder first.

Use this loop:

1. You work on a branch and open a PR, or you send a short file.
2. The founder reviews. Expect questions about grain, source, and whether a company snuck in as a step.
3. You revise. Only then does anything get injected or shown more widely.

There is a checkpoint at the end of week 2: your ten-sector snapshot plus the first small task (see below). After that, you and the founder agree a two-month plan from the [template](./TWO_MONTH_PLAN_TEMPLATE.md). Do not start a large harvest before that plan is approved.

If you are stuck, write the blocker in one paragraph. Do not wait a week in silence, and do not “just put something” in the cell.

---

## Week 0 and week 1

Get access, then read, then do one small piece of work.

**Access:** signed paperwork and bank details; [become an analyst](https://app.moncho.ai/analyst/apply) and copy the API key; clone **Moncho-Analysts** on a branch; put secrets only in `.env` (never in git); use WhatsApp or the channel the founder names.

**Read, in this order:**

1. [ICT grant onboarding](../docs/onboarding/ICT_GRANT_ONBOARDING.md)
2. [The ten sectors](../docs/onboarding/GRANT_TEN_SECTORS.md)
3. [Handbook](../docs/onboarding/HANDBOOK.md) (setup and first hunt only)
4. [Dashboard walkthrough](../docs/onboarding/DASHBOARD_WALKTHROUGH.md)
5. [Data Ops role](./DATA_OPS_ONBOARDING.md) (how scoring works; ignore first-wave volume)
6. [Market sizing brief](./INTERN_MARKET_SIZING_BRIEF.md)
7. [Value chain brief](./INTERN_VALUE_CHAIN_BRIEF.md)
8. [Mistakes to avoid](../docs/reference/IDE_AGENT_MISTAKES.md) (skim)

After the founder says the discovery MCP is live, add [MCP setup](../docs/discovery/ANALYST_DISCOVERY_MCP.md).

**First work (both of you):**

- Fill the coverage table: one row per grant sector, traffic-light depth, one gap. Keep it short. Use section 1 of the two-month plan template.
- Then pick, with the founder, **one** of: a small org and SKU slice on one landscape, **or** three value-chain nodes (input, verb, output; say if each is a transform, an actor, or capture), **or** a sizing review card with factors only and no total.

Missing data stays missing. A company is not a production step. Do not invent prices or HS codes.

---

## The rest of the three months

**Weeks 2–8.** Only the approved plan. Stay on the ten grant sectors. The paid consultant pack (including jute) is off unless the founder says otherwise. Once the remaining four sectors are named, that is the depth work. Each week, send something the founder can open: a PR or a short review file. A status paragraph is not the deliverable.

**Weeks 9–12.** Finish the four-sector depth if it is still open. Help with grant checkpoint notes if asked. Still no TAM writes and still no second country.

---

## How the two of you split time

You will both learn sizing and value chains. In practice, one person will spend more time on products and sources, and the other more time on chain grammar and checks. The founder will say which is which in week 0. The briefs are shared reading either way.
