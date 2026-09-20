#!/usr/bin/env npx tsx
/**
 * Every samples/*.json must pass mechanical QA. Run before accepting sample edits.
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CASES: Array<[string, string]> = [
  ["samples/organization_sample.json", "organization"],
  ["samples/organization_slug_sample.json", "organization"],
  ["samples/product_sample.json", "product"],
  ["samples/landscape_sample.json", "landscape"],
  ["samples/expert_sample.json", "expert"],
  ["samples/market_fact_sample.json", "market_fact"],
  ["samples/sports_revenue_sample.json", "product"],
];

let failed = 0;
for (const [file, type] of CASES) {
  const result = spawnSync(
    "npx",
    ["tsx", "scripts/utils/validate-analyst-data.ts", file, "--type", type],
    { cwd: ROOT, encoding: "utf8", shell: true },
  );
  const code = result.status ?? 1;
  if (code !== 0) {
    failed += 1;
    console.error(`FAIL ${file} --type ${type} (exit ${code})`);
    if (result.stdout) console.error(result.stdout);
    if (result.stderr) console.error(result.stderr);
  } else {
    console.log(`PASS ${file} --type ${type}`);
  }
}

if (failed) {
  console.error(`\n${failed} sample(s) failed mechanical QA. Samples must pass the same gate analysts use.`);
  process.exit(1);
}
console.log("\nAll samples passed mechanical QA.");
