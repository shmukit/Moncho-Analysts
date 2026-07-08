#!/usr/bin/env node
/**
 * Canonical analyst validation (handbook path).
 * Runs mechanical QA — exits 0 only when no records FAIL.
 *
 * Usage:
 *   npx tsx scripts/utils/validate-analyst-data.ts data/pending/file.json
 *   npx tsx scripts/utils/validate-analyst-data.ts data/pending/file.json --type organization
 *   npx tsx scripts/utils/validate-analyst-data.ts data/pending/file.json --full --deep-check
 */

import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { loadEnv } from "../lib/load_env.js";

loadEnv();

const SCRIPTS = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function parseArgs() {
  const argv = process.argv.slice(2);
  const file = argv.find((a) => !a.startsWith("--") && a.endsWith(".json"));
  const get = (n: string) => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return {
    file,
    type: get("type") || "auto",
    full: argv.includes("--full"),
    deepCheck: argv.includes("--deep-check"),
    concurrency: get("concurrency") || "30",
  };
}

function main() {
  const args = parseArgs();
  if (!args.file) {
    console.error("❌ Usage: npx tsx scripts/utils/validate-analyst-data.ts <file.json> [--type organization] [--full] [--deep-check]");
    process.exit(1);
  }

  const filePath = path.resolve(args.file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`🔍 Validating ${path.basename(filePath)} (type: ${args.type})...`);

  const script = args.full || args.deepCheck ? "qa_agent.ts" : "qa_reviewer.ts";
  const scriptArgs = [
    "tsx",
    path.join(SCRIPTS, script),
    "--file",
    filePath,
    "--type",
    args.type,
    "--out",
    "data/qa-reports/",
    "--concurrency",
    args.concurrency,
  ];

  if (script === "qa_agent.ts") {
    if (args.deepCheck) scriptArgs.push("--deep-check");
  } else {
    const sample =
      args.type === "product"
        ? "samples/product_sample.json"
        : args.type === "landscape"
          ? "samples/landscape_sample.json"
          : args.type === "expert"
            ? "samples/expert_sample.json"
            : undefined;
    if (sample && fs.existsSync(sample)) scriptArgs.push("--sample", sample);
    const sectorIds = "data/reference/valid-sector-ids.json";
    const segmentIds = "data/reference/valid-segment-ids.json";
    if (fs.existsSync(sectorIds)) scriptArgs.push("--valid-sector-ids", sectorIds);
    if (fs.existsSync(segmentIds)) scriptArgs.push("--valid-segment-ids", segmentIds);
  }

  const result = spawnSync("npx", scriptArgs, { stdio: "inherit", shell: true, env: process.env });
  const base = path.basename(filePath).replace(/\.json$/, "");
  const reportPath = path.join("data/qa-reports", `${base}-qa-report.json`);

  if (!fs.existsSync(reportPath)) {
    console.error("❌ QA report was not produced.");
    process.exit(result.status ?? 2);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
  const { pass, flagged, fail, total } = report.summary;

  console.log(`\n=== VALIDATION RESULT ===`);
  console.log(`PASS: ${pass}  FLAGGED: ${flagged}  FAIL: ${fail}  (total ${total})`);

  if (fail > 0) {
    console.error(`\n❌ Validation failed — fix ${fail} FAIL record(s) before submit.`);
    process.exit(1);
  }

  if (flagged > 0) {
    console.log(`\n⚠️  ${flagged} record(s) flagged — review recommended before submit.`);
  } else {
    console.log(`\n✅ Success! ${pass} record(s) passed mechanical validation.`);
  }

  process.exit(0);
}

main();
