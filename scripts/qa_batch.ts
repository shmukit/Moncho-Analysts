#!/usr/bin/env node
/**
 * Moncho.ai — Scalable Batch QA
 * -----------------------------
 * Run QA across many files or million-record JSON arrays.
 *
 * Stage 1 (mechanical) scales to millions — URL dedup + high concurrency.
 * Stage 2 (deep-check) is API-bound — use --sample-rate for spot checks.
 *
 * Usage:
 *   # QA every JSON file in a folder (mechanical, fast)
 *   npx tsx scripts/qa_batch.ts --dir data/pending --type organization
 *
 *   # Large file: auto-chunk into 10k-record batches
 *   npx tsx scripts/qa_batch.ts --file data/exports/orgs-500k.json --chunk-size 10000 --concurrency 50
 *
 *   # Bulk + sampled deep fact-check (10% of claims)
 *   npx tsx scripts/qa_batch.ts --dir data/pending --deep-check --sample-rate 0.1 --only-flagged
 */

import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { loadEnv } from "./lib/load_env.js";

loadEnv();

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));

type Args = {
  file?: string;
  dir?: string;
  type: string;
  out: string;
  chunkSize: number;
  concurrency: number;
  deepConcurrency: number;
  parallelFiles: number;
  timeout: number;
  deepCheck: boolean;
  onlyFlagged: boolean;
  sampleRate: number;
  confidenceThreshold: number;
  db?: string;
};

type MechReport = {
  file: string;
  generated_at: string;
  batch_warning: string | null;
  summary: { total: number; pass: number; flagged: number; fail: number };
  records: { record_id: string; status: string; reasons: string[] }[];
};

function parseArgs(argv: string[]): Args {
  const get = (name: string, def?: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : def;
  };
  const has = (name: string) => argv.includes(`--${name}`);
  const file = get("file");
  const dir = get("dir");
  if (!file && !dir) {
    console.error("Provide --file <path> or --dir <folder>");
    process.exit(1);
  }
  if (file && dir) {
    console.error("Use only one of --file or --dir");
    process.exit(1);
  }
  return {
    file,
    dir,
    type: get("type", "organization")!,
    out: get("out", "data/qa-reports/")!,
    chunkSize: parseInt(get("chunk-size", "10000")!, 10),
    concurrency: parseInt(get("concurrency", "50")!, 10),
    deepConcurrency: parseInt(get("deep-concurrency", "10")!, 10),
    parallelFiles: parseInt(get("parallel-files", "4")!, 10),
    timeout: parseInt(get("timeout", "8000")!, 10),
    deepCheck: has("deep-check"),
    onlyFlagged: has("only-flagged"),
    sampleRate: parseFloat(get("sample-rate", "0.1")!),
    confidenceThreshold: parseFloat(get("confidence-threshold", "0.75")!),
    db: get("db"),
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

function listJsonFiles(dirPath: string): string[] {
  return fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".json") && !f.startsWith("."))
    .map((f) => path.resolve(dirPath, f))
    .sort();
}

function loadRecords(filePath: string): unknown[] {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return Array.isArray(parsed) ? parsed : [parsed];
}

function chunkLargeFile(filePath: string, chunkSize: number, tempDir: string): string[] {
  const records = loadRecords(filePath);
  if (records.length <= chunkSize) return [filePath];

  fs.mkdirSync(tempDir, { recursive: true });
  const base = path.basename(filePath, ".json");
  const chunkPaths: string[] = [];

  for (let i = 0; i < records.length; i += chunkSize) {
    const slice = records.slice(i, i + chunkSize);
    const chunkIndex = Math.floor(i / chunkSize);
    const chunkPath = path.join(tempDir, `${base}.chunk-${String(chunkIndex).padStart(5, "0")}.json`);
    fs.writeFileSync(chunkPath, JSON.stringify(slice));
    chunkPaths.push(chunkPath);
  }

  console.log(`  Split ${records.length} records → ${chunkPaths.length} chunk(s) of ≤${chunkSize}`);
  return chunkPaths;
}

function runQaAgent(filePath: string, args: Args): number {
  const agentArgs = [
    "tsx",
    path.join(SCRIPTS_DIR, "qa_agent.ts"),
    "--file",
    filePath,
    "--type",
    args.type,
    "--out",
    path.resolve(args.out),
    "--concurrency",
    String(args.concurrency),
    "--timeout",
    String(args.timeout),
    "--deep-concurrency",
    String(args.deepConcurrency),
    "--sample-rate",
    String(args.sampleRate),
    "--confidence-threshold",
    String(args.confidenceThreshold),
  ];
  if (args.db) agentArgs.push("--db", args.db);
  if (args.deepCheck) agentArgs.push("--deep-check");
  if (args.onlyFlagged) agentArgs.push("--only-flagged");

  const result = spawnSync("npx", agentArgs, { stdio: "inherit", shell: true, env: process.env });
  return result.status ?? 1;
}

function readMechReport(filePath: string, outDir: string): MechReport | null {
  const baseName = path.basename(filePath).replace(/\.json$/, "");
  const reportPath = path.join(outDir, `${baseName}-qa-report.json`);
  if (!fs.existsSync(reportPath)) return null;
  return JSON.parse(fs.readFileSync(reportPath, "utf-8"));
}

function mergeChunkReports(sourceFile: string, chunkFiles: string[], outDir: string): MechReport {
  const merged: MechReport = {
    file: sourceFile,
    generated_at: new Date().toISOString(),
    batch_warning: null,
    summary: { total: 0, pass: 0, flagged: 0, fail: 0 },
    records: [],
  };

  for (const chunk of chunkFiles) {
    const report = readMechReport(chunk, outDir);
    if (!report) continue;
    merged.records.push(...report.records);
    merged.summary.total += report.summary.total;
    merged.summary.pass += report.summary.pass;
    merged.summary.flagged += report.summary.flagged;
    merged.summary.fail += report.summary.fail;
  }

  const failRate = merged.summary.total ? merged.summary.fail / merged.summary.total : 0;
  if (failRate > 0.15) {
    merged.batch_warning = `${(failRate * 100).toFixed(0)}% of this batch FAILed mechanical checks — escalate to a Senior Analyst conversation with the submitting analyst rather than reviewing record-by-record.`;
  }

  const baseName = path.basename(sourceFile).replace(/\.json$/, "");
  const mergedPath = path.join(outDir, `${baseName}-qa-report.json`);
  fs.writeFileSync(mergedPath, JSON.stringify(merged, null, 2));
  return merged;
}

type JobResult = {
  sourceFile: string;
  exitCode: number;
  summary: MechReport["summary"];
  batchWarning: string | null;
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(args.out);
  fs.mkdirSync(outDir, { recursive: true });

  const sourceFiles = args.dir ? listJsonFiles(path.resolve(args.dir)) : [path.resolve(args.file!)];
  if (!sourceFiles.length) {
    console.error("No JSON files found.");
    process.exit(1);
  }

  const tempDir = path.join(outDir, ".chunks");
  const jobs: { sourceFile: string; runFile: string; isChunk: boolean; chunkGroup?: string[] }[] = [];

  for (const sourceFile of sourceFiles) {
    const recordCount = loadRecords(sourceFile).length;
    if (recordCount > args.chunkSize) {
      const chunks = chunkLargeFile(sourceFile, args.chunkSize, tempDir);
      for (const chunk of chunks) {
        jobs.push({ sourceFile, runFile: chunk, isChunk: true, chunkGroup: chunks });
      }
    } else {
      jobs.push({ sourceFile, runFile: sourceFile, isChunk: false });
    }
  }

  console.log("\n" + "█".repeat(72));
  console.log("  MONCHO BATCH QA — Scalable Data Operations");
  console.log("█".repeat(72));
  console.log(`\nSource files:     ${sourceFiles.length}`);
  console.log(`Total jobs:       ${jobs.length}`);
  console.log(`Record type:      ${args.type}`);
  console.log(`URL concurrency:  ${args.concurrency}`);
  console.log(`Chunk size:       ${args.chunkSize}`);
  console.log(`Parallel files:   ${args.parallelFiles}`);
  console.log(
    `Deep-check:       ${args.deepCheck ? `ON (sample-rate ${args.sampleRate}, concurrency ${args.deepConcurrency})` : "OFF — mechanical only (recommended for millions)"}`
  );
  console.log("");

  const started = Date.now();
  const results: JobResult[] = [];
  const chunkGroupsDone = new Set<string>();

  await mapWithConcurrency(jobs, args.parallelFiles, async (job, idx) => {
    console.log(`\n[${idx + 1}/${jobs.length}] QA → ${path.basename(job.runFile)}`);
    const exitCode = runQaAgent(job.runFile, args);

    if (job.isChunk && job.chunkGroup) {
      const groupKey = job.sourceFile;
      const allChunksDone = job.chunkGroup.every((c) => {
        const base = path.basename(c).replace(/\.json$/, "");
        return fs.existsSync(path.join(outDir, `${base}-qa-report.json`));
      });

      if (allChunksDone && !chunkGroupsDone.has(groupKey)) {
        chunkGroupsDone.add(groupKey);
        const merged = mergeChunkReports(groupKey, job.chunkGroup, outDir);
        results.push({
          sourceFile: groupKey,
          exitCode: merged.summary.fail > 0 ? 1 : 0,
          summary: merged.summary,
          batchWarning: merged.batch_warning,
        });
      }
      return;
    }

    const report = readMechReport(job.runFile, outDir);
    results.push({
      sourceFile: job.sourceFile,
      exitCode,
      summary: report?.summary ?? { total: 0, pass: 0, flagged: 0, fail: 0 },
      batchWarning: report?.batch_warning ?? null,
    });
  });

  const rollup = {
    generated_at: new Date().toISOString(),
    duration_seconds: Math.round((Date.now() - started) / 1000),
    config: {
      type: args.type,
      concurrency: args.concurrency,
      chunk_size: args.chunkSize,
      deep_check: args.deepCheck,
      sample_rate: args.sampleRate,
    },
    files_processed: sourceFiles.length,
    summary: {
      total_records: 0,
      pass: 0,
      flagged: 0,
      fail: 0,
    },
    files: [] as { file: string; pass: number; flagged: number; fail: number; total: number; batch_warning: string | null }[],
  };

  const seen = new Set<string>();
  for (const r of results) {
    if (seen.has(r.sourceFile)) continue;
    seen.add(r.sourceFile);
    rollup.summary.total_records += r.summary.total;
    rollup.summary.pass += r.summary.pass;
    rollup.summary.flagged += r.summary.flagged;
    rollup.summary.fail += r.summary.fail;
    rollup.files.push({
      file: r.sourceFile,
      total: r.summary.total,
      pass: r.summary.pass,
      flagged: r.summary.flagged,
      fail: r.summary.fail,
      batch_warning: r.batchWarning,
    });
  }

  const rollupPath = path.join(outDir, `batch-rollup-${Date.now()}.json`);
  fs.writeFileSync(rollupPath, JSON.stringify(rollup, null, 2));

  const elapsed = rollup.duration_seconds;
  const rps = rollup.summary.total_records && elapsed ? (rollup.summary.total_records / elapsed).toFixed(1) : "—";

  console.log("\n" + "═".repeat(72));
  console.log("  BATCH ROLLUP");
  console.log("═".repeat(72));
  console.log(`  Records:   ${rollup.summary.total_records}`);
  console.log(`  PASS:      ${rollup.summary.pass}`);
  console.log(`  FLAGGED:   ${rollup.summary.flagged}`);
  console.log(`  FAIL:      ${rollup.summary.fail}`);
  console.log(`  Duration:  ${elapsed}s (~${rps} records/sec mechanical)`);
  console.log(`  Rollup:    ${rollupPath}`);

  if (rollup.summary.fail > 0) {
    console.log(`\n  ⚠️  ${rollup.summary.fail} record(s) failed — do not submit until fixed.`);
    process.exit(1);
  }
  if (rollup.summary.flagged > 0) {
    console.log(`\n  ℹ️  ${rollup.summary.flagged} record(s) flagged — review before submit.`);
  } else {
    console.log("\n  ✅ All records passed mechanical QA.");
  }
}

main().catch((err) => {
  console.error("Batch QA failed:", err);
  process.exit(2);
});
