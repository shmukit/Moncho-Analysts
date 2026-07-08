#!/usr/bin/env node
/**
 * Moncho.ai — QA Agent v3 (full automated pipeline)
 * -------------------------------------------------
 * Stage 1: Mechanical QA — schema, URLs, duplicates, slugs, landscape/expert IDs
 * Stage 2: Agentic fact-check — Tavily/Exa search + Anthropic LLM entailment
 * Output:  mechanical report + factcheck report + executive summary + unified report
 *
 * Usage:
 *   npx tsx scripts/qa_agent.ts --file data/pending/test-batch.json --type organization --deep-check
 *   npx tsx scripts/qa_agent.ts --file data/pending/test-landscape-real.json --type landscape --deep-check
 *   npx tsx scripts/qa_agent.ts --file data/pending/test-expert-real.json --type expert
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { loadEnv } from "./lib/load_env.js";
import { buildUnifiedReport } from "./lib/unified_report.js";

loadEnv();

const REF_DIR = path.resolve("data/reference");

function detectOrgSamplePath(filePath: string): string {
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const records = Array.isArray(raw) ? raw : [raw];
    const anyId = records.some(
      (r: Record<string, unknown>) => r.sector_id !== undefined || r.segment_ids !== undefined
    );
    const anySlug = records.some(
      (r: Record<string, unknown>) =>
        r.sector_slug !== undefined || r.segment_slugs !== undefined || r.segment_slug !== undefined
    );
    if (anySlug && !anyId) return path.resolve("samples/organization_slug_sample.json");
  } catch {
    /* fall through */
  }
  return path.resolve("samples/organization_sample.json");
}

type Args = {
  file: string;
  type: string;
  db?: string;
  sample?: string;
  validSectorIds?: string;
  validSegmentIds?: string;
  out: string;
  concurrency: number;
  deepConcurrency: number;
  timeout: number;
  deepCheck: boolean;
  onlyFlagged: boolean;
  confidenceThreshold: number;
  sampleRate: number;
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
    type: get("type", "auto")!,
    db: get("db"),
    sample: get("sample"),
    validSectorIds: get("valid-sector-ids"),
    validSegmentIds: get("valid-segment-ids"),
    out: get("out", "data/qa-reports/")!,
    concurrency: parseInt(get("concurrency", "15")!, 10),
    deepConcurrency: parseInt(get("deep-concurrency", "10")!, 10),
    timeout: parseInt(get("timeout", "8000")!, 10),
    deepCheck: has("deep-check"),
    onlyFlagged: has("only-flagged"),
    confidenceThreshold: parseFloat(get("confidence-threshold", "0.75")!),
    sampleRate: parseFloat(get("sample-rate", "1.0")!),
  };
}

function runStage(script: string, scriptArgs: string[]): number {
  const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
  const scriptPath = path.join(scriptsDir, script);
  const result = spawnSync("npx", ["tsx", scriptPath, ...scriptArgs], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  return result.status ?? 1;
}

function resolveDefault(pathArg: string | undefined, fallback: string): string | undefined {
  if (pathArg) return path.resolve(pathArg);
  const candidate = path.resolve(fallback);
  return fs.existsSync(candidate) ? candidate : undefined;
}

function buildExecutiveSummary(
  mechReport: {
    summary: { total: number; pass: number; flagged: number; fail: number };
    batch_warning: string | null;
    records: { record_id: string; status: string; reasons: string[] }[];
  },
  factReport?: {
    summary: { total_claims_checked: number; ai_verified: number; requires_human_review: number };
    results: { orgName: string; field: string; claim: string; verdict: string; confidence: number }[];
  },
  unified?: { summary: { ready_for_submission: number; fail: number } }
) {
  const actions: string[] = [];

  if (mechReport.summary.fail > 0) {
    actions.push(`Fix ${mechReport.summary.fail} mechanical FAIL record(s) before submission.`);
  }
  if (mechReport.summary.flagged > 0) {
    actions.push(`Review ${mechReport.summary.flagged} FLAGGED record(s) for vague rationales or slug issues.`);
  }
  if (mechReport.batch_warning) actions.push(mechReport.batch_warning);
  if (factReport && factReport.summary.requires_human_review > 0) {
    actions.push(
      `Deep-check: ${factReport.summary.requires_human_review} claim(s) need human verification.`
    );
  }
  if (unified) {
    actions.push(
      `${unified.summary.ready_for_submission}/${mechReport.summary.total} record(s) ready for submission after unified review.`
    );
  }
  if (mechReport.summary.fail === 0 && mechReport.summary.flagged === 0 && !factReport?.summary.requires_human_review) {
    actions.push("Batch is clean — proceed to Senior Analyst spot-check, then submit.");
  }

  return {
    generated_at: new Date().toISOString(),
    mechanical: mechReport.summary,
    fact_check: factReport?.summary || null,
    unified: unified?.summary || null,
    batch_warning: mechReport.batch_warning,
    recommended_actions: actions,
    human_review_queue: [
      ...mechReport.records
        .filter((r) => r.status !== "PASS")
        .map((r) => ({ type: "mechanical", record_id: r.record_id, status: r.status, reasons: r.reasons })),
      ...(factReport?.results || [])
        .filter((r) => r.verdict !== "supported" || r.confidence < 0.75)
        .map((r) => ({
          type: "fact_check",
          record_id: r.orgName,
          field: r.field,
          claim: r.claim,
          verdict: r.verdict,
          confidence: r.confidence,
        })),
    ],
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const filePath = path.resolve(args.file);
  const outDir = path.resolve(args.out);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log("\n" + "█".repeat(72));
  console.log("  MONCHO QA AGENT v3 — Automated Market Intelligence Review");
  console.log("█".repeat(72));
  console.log(`\nInput:   ${filePath}`);
  console.log(`Type:    ${args.type}`);
  console.log(`Stage 1: Mechanical QA (schema, URLs, IDs, duplicates)`);
  console.log(`Stage 2: ${args.deepCheck ? "Agentic deep fact-check (ENABLED)" : "Skipped — pass --deep-check"}`);

  const mechArgs = [
    "--file", filePath,
    "--type", args.type,
    "--out", outDir,
    "--concurrency", String(args.concurrency),
    "--timeout", String(args.timeout),
  ];
  if (args.db) mechArgs.push("--db", args.db);

  const samplePath = args.sample
    ? resolveDefault(args.sample, "")
    : args.type === "landscape"
      ? resolveDefault(undefined, "samples/landscape_sample.json")
        : args.type === "expert"
          ? resolveDefault(undefined, "samples/expert_sample.json")
          : args.type === "product"
            ? resolveDefault(undefined, "samples/product_sample.json")
          : args.type === "organization"
          ? detectOrgSamplePath(filePath)
          : undefined;
  if (samplePath) mechArgs.push("--sample", samplePath);

  const sectorIdsPath = resolveDefault(args.validSectorIds, path.join(REF_DIR, "valid-sector-ids.json"));
  const segmentIdsPath = resolveDefault(args.validSegmentIds, path.join(REF_DIR, "valid-segment-ids.json"));
  if (sectorIdsPath) mechArgs.push("--valid-sector-ids", sectorIdsPath);
  if (segmentIdsPath) mechArgs.push("--valid-segment-ids", segmentIdsPath);

  const mechExit = runStage("qa_reviewer.ts", mechArgs);

  const baseName = path.basename(filePath).replace(/\.json$/, "");
  const mechReportPath = path.join(outDir, `${baseName}-qa-report.json`);
  if (!fs.existsSync(mechReportPath)) {
    console.error("Mechanical QA report was not produced.");
    process.exit(mechExit || 2);
  }

  const mechReport = JSON.parse(fs.readFileSync(mechReportPath, "utf-8"));
  let factReport:
    | {
        confidence_threshold: number;
        summary: { total_claims_checked: number; ai_verified: number; requires_human_review: number };
        results: {
          orgName: string;
          field: string;
          claim: string;
          verdict: string;
          confidence: number;
          evidence?: { url: string; note: string }[];
          explanation?: string;
        }[];
      }
    | undefined;

  if (args.deepCheck) {
    console.log("\n--- Stage 2: Agentic claim verification (Tavily/Exa + Anthropic) ---\n");
    const deepArgs = [
      "--file", filePath,
      "--report", mechReportPath,
      "--out", outDir,
      "--confidence-threshold", String(args.confidenceThreshold),
      "--concurrency", String(args.deepConcurrency),
      "--sample-rate", String(args.sampleRate),
    ];
    if (args.onlyFlagged) deepArgs.push("--only-flagged");
    runStage("deep_fact_check.ts", deepArgs);

    const factReportPath = path.join(outDir, `${baseName}-factcheck-report.json`);
    if (fs.existsSync(factReportPath)) {
      factReport = JSON.parse(fs.readFileSync(factReportPath, "utf-8"));
    }
  }

  const unified = buildUnifiedReport(mechReport, factReport, args.confidenceThreshold);
  const unifiedPath = path.join(outDir, `${baseName}-unified-qa-report.json`);
  fs.writeFileSync(unifiedPath, JSON.stringify(unified, null, 2));

  const executive = buildExecutiveSummary(mechReport, factReport, unified);
  const execPath = path.join(outDir, `${baseName}-executive-summary.json`);
  fs.writeFileSync(execPath, JSON.stringify(executive, null, 2));

  console.log("\n" + "═".repeat(72));
  console.log("  EXECUTIVE SUMMARY");
  console.log("═".repeat(72));
  executive.recommended_actions.forEach((a, i) => console.log(`  ${i + 1}. ${a}`));
  console.log(`\nReports:`);
  console.log(`  Mechanical:  ${mechReportPath}`);
  if (factReport) console.log(`  Fact-check:  ${path.join(outDir, `${baseName}-factcheck-report.json`)}`);
  console.log(`  Unified:     ${unifiedPath}`);
  console.log(`  Executive:   ${execPath}`);

  if (executive.human_review_queue.length) {
    console.log(`\nHuman review queue: ${executive.human_review_queue.length} item(s)`);
  }

  process.exit(mechExit);
}

main().catch((err) => {
  console.error("QA agent failed:", err);
  process.exit(2);
});
