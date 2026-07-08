#!/usr/bin/env node
/**
 * Moncho.ai — Deep Fact-Check Pass
 * --------------------------------
 * This is the "AI does the fact-checking, not just the formatting" layer.
 * For every rationale that contains a concrete, checkable claim (per the
 * mechanical QA pass), it:
 *
 *   1. Searches the live web for evidence (Tavily).
 *   2. Asks an LLM (Anthropic API) to judge, ONLY from the retrieved
 *      snippets, whether the claim is supported, contradicted, or
 *      unverifiable — with a confidence score and cited evidence URLs.
 *   3. Auto-marks high-confidence "supported" claims as AI-verified (with
 *      the evidence shown, not hidden).
 *   4. Routes everything else (contradicted, unclear, low-confidence,
 *      search returned nothing relevant) to `requires_human_review`.
 *
 * This is what actually lets a human review "as little as possible": the
 * human only ever looks at the claims the AI itself flagged as uncertain,
 * not the whole batch. It deliberately does NOT auto-approve low-confidence
 * claims — doing that would just move the fabrication risk from the
 * analyst to this script, and your Admin-approval gate exists precisely
 * because someone has to be accountable for what goes live.
 *
 * IMPORTANT — HONESTY NOTE:
 * This script has been written and syntax-checked, but NOT run end-to-end
 * against live Tavily/Anthropic APIs in the environment that built it,
 * because that sandbox has no API keys and no network path to
 * api.tavily.com. Test it against a small batch (5-10 records) with your
 * real keys before trusting it on a full run, and spot-check a handful of
 * its "supported, high confidence" verdicts by hand the first time you use
 * it — that's a one-time calibration cost, not an ongoing one.
 *
 * Env required:
 *   TAVILY_API_KEY
 *   ANTHROPIC_API_KEY
 *
 * Usage:
 *   npx tsx deep_fact_check.ts \
 *     --file data/pending/2026-01-25-onboarding.json \
 *     --report data/qa-reports/2026-01-25-onboarding-qa-report.json \
 *     --out data/qa-reports/ \
 *     [--confidence-threshold 0.75] \
 *     [--concurrency 5] \
 *     [--sample-rate 1.0] \
 *     [--only-flagged]     # only re-check claims mechanical QA already flagged as vague
 */

import * as fs from "fs";
import * as path from "path";

const RATIONALE_FIELDS = [
  "innovation_rationale",
  "market_traction_rationale",
  "competitiveness_rationale",
  "product_depth_rationale",
  "social_proof_rationale",
];

type Args = {
  file: string;
  report?: string;
  out: string;
  confidenceThreshold: number;
  concurrency: number;
  sampleRate: number;
  onlyFlagged: boolean;
};

function parseArgs(argv: string[]): Args {
  const get = (name: string, def?: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : def;
  };
  const has = (name: string) => argv.includes(`--${name}`);
  const file = get("file");
  if (!file) {
    console.error("Missing required --file <path>");
    process.exit(1);
  }
  return {
    file,
    report: get("report"),
    out: get("out", "data/qa-reports/")!,
    confidenceThreshold: parseFloat(get("confidence-threshold", "0.75")!),
    concurrency: parseInt(get("concurrency", "5")!, 10),
    sampleRate: parseFloat(get("sample-rate", "1.0")!),
    onlyFlagged: has("only-flagged"),
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, idx: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// ---------------------------------------------------------------------------
// Tavily search
// ---------------------------------------------------------------------------
type SearchResult = { title: string; url: string; content: string };

async function tavilySearch(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY not set");
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: 5,
    }),
  });
  if (!res.ok) {
    throw new Error(`Tavily search failed: HTTP ${res.status} ${await res.text().catch(() => "")}`);
  }
  const data = await res.json();
  return (data.results || []).map((r: any) => ({
    title: r.title,
    url: r.url,
    content: (r.content || "").slice(0, 1200),
  }));
}

// ---------------------------------------------------------------------------
// Anthropic API — claim entailment judgment
// ---------------------------------------------------------------------------
type Verdict = {
  verdict: "supported" | "contradicted" | "unclear";
  confidence: number; // 0-1
  evidence: { url: string; note: string }[];
  explanation: string;
};

async function judgeClaim(
  orgName: string,
  claim: string,
  evidence: SearchResult[]
): Promise<Verdict> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const evidenceBlock = evidence.length
    ? evidence
        .map((e, i) => `[${i + 1}] ${e.title} (${e.url})\n${e.content}`)
        .join("\n\n")
    : "(no search results returned)";

  const prompt = `You are a strict fact-checker. You are given a claim made about a company, and search-result snippets. Judge ONLY from the snippets provided — do not use outside knowledge, and do not assume the claim is true just because it sounds plausible.

Company: ${orgName}
Claim: "${claim}"

Search results:
${evidenceBlock}

Respond with ONLY a JSON object, no other text, in this exact shape:
{
  "verdict": "supported" | "contradicted" | "unclear",
  "confidence": <number 0 to 1>,
  "evidence": [{"url": "...", "note": "one sentence on what this source shows"}],
  "explanation": "one or two sentences on why you reached this verdict"
}

Rules:
- "supported" requires at least one snippet that directly corroborates the specific numbers/dates/facts in the claim, not just a general topical match.
- If snippets are irrelevant, off-topic, or don't mention this company, return "unclear" with low confidence — do not guess.
- If a snippet directly conflicts with the claim (different figure, different date, claim about a different company), return "contradicted".
- Never fabricate a URL that wasn't in the search results.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic API failed: HTTP ${res.status} ${await res.text().catch(() => "")}`);
  }
  const data = await res.json();
  const text = (data.content || []).find((b: any) => b.type === "text")?.text || "";
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return {
      verdict: "unclear",
      confidence: 0,
      evidence: [],
      explanation: `Model response was not valid JSON; raw response: ${text.slice(0, 200)}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!process.env.TAVILY_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    console.error(
      "TAVILY_API_KEY and/or ANTHROPIC_API_KEY not set in environment. " +
      "This pass performs real web search + LLM judgment and cannot run without them."
    );
    process.exit(2);
  }

  const raw = JSON.parse(fs.readFileSync(args.file, "utf-8"));
  const records: any[] = Array.isArray(raw) ? raw : [raw];

  let mechReport: any = null;
  if (args.report && fs.existsSync(args.report)) {
    mechReport = JSON.parse(fs.readFileSync(args.report, "utf-8"));
  }

  // Build the list of claims to check: {orgName, field, claim, recordIndex}
  type ClaimTask = { orgName: string; field: string; claim: string; recordIndex: number };
  const tasks: ClaimTask[] = [];

  records.forEach((record, idx) => {
    const orgName = record.name || record.product_name || `record_${idx}`;
    const mechRecord = mechReport?.records?.find((r: any) => r.record_id === orgName);

    if (args.onlyFlagged && mechRecord && mechRecord.status === "PASS") return; // skip clean records if asked

    for (const field of RATIONALE_FIELDS) {
      const claim = record[field];
      if (!claim) continue;
      // Sampling: for cost control at scale, only a fraction of otherwise-
      // clean claims get deep-checked unless sample_rate is 1.0. Anything
      // mechanical QA already flagged is always checked (rate 1.0 for those).
      const mechFlaggedThisField = mechRecord?.checks?.rationale_quality?.[field] === "vague";
      const shouldCheck = mechFlaggedThisField || Math.random() < args.sampleRate;
      if (!shouldCheck) continue;
      tasks.push({ orgName, field, claim, recordIndex: idx });
    }
  });

  console.log(`Deep-checking ${tasks.length} claim(s) across ${records.length} record(s)...`);
  console.log(
    `Estimated: ${tasks.length} Tavily search call(s) + ${tasks.length} Anthropic call(s), ` +
    `concurrency=${args.concurrency}. This is real, rate-limited, network-bound work — ` +
    `budget real time and API cost proportional to ${tasks.length} claims, not "instant."`
  );

  const results = await mapWithConcurrency(tasks, args.concurrency, async (task) => {
    try {
      const query = `${task.orgName} ${task.claim}`.slice(0, 400);
      const evidence = await tavilySearch(query);
      const verdict = await judgeClaim(task.orgName, task.claim, evidence);
      return { ...task, ...verdict, error: null as string | null };
    } catch (err: any) {
      return {
        ...task,
        verdict: "unclear" as const,
        confidence: 0,
        evidence: [],
        explanation: "Check failed to complete — see error field.",
        error: String(err?.message || err),
      };
    }
  });

  const needsHuman = results.filter(
    (r) => r.error || r.verdict !== "supported" || r.confidence < args.confidenceThreshold
  );
  const aiVerified = results.filter(
    (r) => !r.error && r.verdict === "supported" && r.confidence >= args.confidenceThreshold
  );

  fs.mkdirSync(args.out, { recursive: true });
  const baseName = path.basename(args.file).replace(/\.json$/, "");
  const outPath = path.join(args.out, `${baseName}-factcheck-report.json`);
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        file: args.file,
        generated_at: new Date().toISOString(),
        confidence_threshold: args.confidenceThreshold,
        summary: {
          total_claims_checked: results.length,
          ai_verified: aiVerified.length,
          requires_human_review: needsHuman.length,
        },
        note:
          "ai_verified means the AI found and cited corroborating evidence above your " +
          "confidence threshold — it does not mean a human independently confirmed it. " +
          "Spot-check a sample of ai_verified claims periodically to calibrate trust in " +
          "this pass over time.",
        results,
      },
      null,
      2
    )
  );

  console.log("\n=== DEEP FACT-CHECK SUMMARY ===");
  console.log(`AI-verified (>= ${args.confidenceThreshold} confidence, supported): ${aiVerified.length}`);
  console.log(`Requires human review: ${needsHuman.length}`);
  console.log(`Full report: ${outPath}`);

  if (needsHuman.length) {
    console.log("\nClaims a human should actually look at:");
    needsHuman.forEach((r) => {
      console.log(`\n[${r.verdict.toUpperCase()}${r.error ? " / ERROR" : ""}] ${r.orgName} — ${r.field}`);
      console.log(`   claim: "${r.claim}"`);
      console.log(`   ${r.error ? "error: " + r.error : r.explanation}`);
    });
  }

  process.exit(0);
}

const isDirectRun = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  main().catch((err) => {
    console.error("deep_fact_check failed:", err);
    process.exit(2);
  });
}

export { tavilySearch, judgeClaim, mapWithConcurrency, main };
