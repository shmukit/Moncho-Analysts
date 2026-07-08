#!/usr/bin/env node
/**
 * Moncho.ai — Deep Fact-Check Pass (Stage 2)
 * Version 2: Tavily/Exa web search + LLM entailment judgment on rationales.
 *
 * Env: TAVILY_API_KEY and/or EXA_API_KEY (search)
 *      ANTHROPIC_API_KEY (optional — enables LLM judge; heuristic fallback otherwise)
 */

import * as fs from "fs";
import * as path from "path";
import { loadEnv } from "./lib/load_env.js";
import { verifyClaim, judgeClaim } from "./lib/claim_agent.js";
import { tavilySearch, exaSearch, searchEvidence } from "./lib/search.js";

loadEnv();

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

export async function mapWithConcurrency<T, R>(
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

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!process.env.TAVILY_API_KEY && !process.env.EXA_API_KEY) {
    console.error(
      "TAVILY_API_KEY and/or EXA_API_KEY required for deep fact-check. " +
        "Set them in .env or your shell environment."
    );
    process.exit(2);
  }

  const raw = JSON.parse(fs.readFileSync(args.file, "utf-8"));
  const records: Record<string, unknown>[] = Array.isArray(raw) ? raw : [raw];

  let mechReport: {
    records?: { record_id: string; status: string; checks?: { rationale_quality?: Record<string, string> } }[];
  } | null = null;
  if (args.report && fs.existsSync(args.report)) {
    mechReport = JSON.parse(fs.readFileSync(args.report, "utf-8"));
  }

  type ClaimTask = { orgName: string; field: string; claim: string; recordIndex: number };
  const tasks: ClaimTask[] = [];

  records.forEach((record, idx) => {
    const orgName = String(record.name || record.product_name || `record_${idx}`);
    const mechRecord = mechReport?.records?.find((r) => r.record_id === orgName);

    if (args.onlyFlagged && mechRecord && mechRecord.status === "PASS") return;

    for (const field of RATIONALE_FIELDS) {
      const claim = record[field];
      if (!claim || typeof claim !== "string") continue;
      const mechFlagged = mechRecord?.checks?.rationale_quality?.[field] === "vague";
      const shouldCheck = mechFlagged || Math.random() < args.sampleRate;
      if (!shouldCheck) continue;
      tasks.push({ orgName, field, claim, recordIndex: idx });
    }
  });

  console.log(`Deep-checking ${tasks.length} claim(s) across ${records.length} record(s)...`);
  console.log(
    `Search: ${[process.env.TAVILY_API_KEY && "Tavily", process.env.EXA_API_KEY && "Exa"].filter(Boolean).join(" + ")}`
  );
  console.log(
    `Judge: ${process.env.ANTHROPIC_API_KEY ? "Anthropic LLM entailment" : "heuristic evidence agent (set ANTHROPIC_API_KEY for LLM)"}`
  );

  const results = await mapWithConcurrency(tasks, args.concurrency, async (task) => {
    try {
      const verdict = await verifyClaim(task.orgName, task.claim);
      return { ...task, ...verdict, error: null as string | null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ...task,
        verdict: "unclear" as const,
        confidence: 0,
        evidence: [],
        explanation: "Check failed to complete — see error field.",
        agent_steps: ["error"],
        error: message,
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
          "ai_verified means the AI found corroborating evidence above the confidence threshold. " +
          "This does not replace Senior Analyst review or Admin approval.",
        results,
      },
      null,
      2
    )
  );

  console.log("\n=== DEEP FACT-CHECK SUMMARY ===");
  console.log(`AI-verified (>= ${args.confidenceThreshold} confidence): ${aiVerified.length}`);
  console.log(`Requires human review: ${needsHuman.length}`);
  console.log(`Full report: ${outPath}`);

  if (needsHuman.length) {
    console.log("\nClaims a human should look at:");
    needsHuman.forEach((r) => {
      console.log(`\n[${r.verdict.toUpperCase()}${r.error ? " / ERROR" : ""}] ${r.orgName} — ${r.field}`);
      console.log(`   claim: "${r.claim}"`);
      console.log(`   ${r.error ? "error: " + r.error : r.explanation}`);
    });
  }

  process.exit(0);
}

const isDirectRun =
  !!process.argv[1] &&
  /[\\/]deep_fact_check\.ts$/i.test(process.argv[1].replace(/\\/g, "/"));

if (isDirectRun) {
  main().catch((err) => {
    console.error("deep_fact_check failed:", err);
    process.exit(2);
  });
}

export { main, tavilySearch, exaSearch, searchEvidence, judgeClaim, verifyClaim };
