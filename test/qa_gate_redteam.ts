#!/usr/bin/env npx tsx
/**
 * Red-team the mechanical QA gate. Forbidden patterns from IDE_AGENT_MISTAKES.md
 * must FAIL (or FLAG where the rule is advisory). Clean fixtures must PASS.
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIX = path.join(ROOT, "test/fixtures/qa-redteam");

type Case = {
  file: string;
  type: string;
  expect: "PASS" | "FAIL";
  reasonIncludes: string;
  skipUrlCheck: boolean;
};

const CASES: Case[] = [
  { file: "org-clean.json", type: "organization", expect: "PASS", reasonIncludes: "", skipUrlCheck: true },
  { file: "org-guessed-ids.json", type: "organization", expect: "FAIL", reasonIncludes: "looks guessed", skipUrlCheck: true },
  { file: "org-linkedin-only.json", type: "organization", expect: "FAIL", reasonIncludes: "LinkedIn", skipUrlCheck: true },
  { file: "org-env-in-field.json", type: "organization", expect: "FAIL", reasonIncludes: "API key or token", skipUrlCheck: true },
  { file: "org-duplicate-trailing-period.json", type: "organization", expect: "FAIL", reasonIncludes: "likely duplicate", skipUrlCheck: true },
  { file: "product-category-only.json", type: "product", expect: "FAIL", reasonIncludes: "category, not a named SKU", skipUrlCheck: true },
  { file: "product-bad-hs.json", type: "product", expect: "FAIL", reasonIncludes: "valid HS code", skipUrlCheck: true },
  { file: "product-aggregator.json", type: "product", expect: "FAIL", reasonIncludes: "aggregator", skipUrlCheck: true },
  { file: "fact-tam-total.json", type: "market_fact", expect: "FAIL", reasonIncludes: "TAM lump", skipUrlCheck: true },
  { file: "fact-untagged.json", type: "market_fact", expect: "FAIL", reasonIncludes: "sector_slug is required", skipUrlCheck: true },
  { file: "org-invented-url.json", type: "organization", expect: "FAIL", reasonIncludes: "website_url unreachable", skipUrlCheck: false },
];

function runCase(c: Case) {
  const filePath = path.join(FIX, c.file);
  const args = [
    "tsx",
    "scripts/qa_reviewer.ts",
    "--file",
    filePath,
    "--type",
    c.type,
    "--out",
    "data/qa-reports/",
    "--valid-sector-ids",
    "test/fixtures/qa-redteam/valid-sector-ids.json",
    "--valid-segment-ids",
    "test/fixtures/qa-redteam/valid-segment-ids.json",
  ];
  if (c.skipUrlCheck) args.push("--skip-url-check");
  const result = spawnSync("npx", args, { cwd: ROOT, encoding: "utf8", shell: true });
  const reportPath = path.join(
    ROOT,
    "data/qa-reports",
    `${path.basename(c.file, ".json")}-qa-report.json`,
  );
  if (!fs.existsSync(reportPath)) {
    return { ok: false, detail: `no report for ${c.file}\n${result.stdout}\n${result.stderr}` };
  }
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const statuses: string[] = (report.records || []).map((r: { status: string }) => r.status);
  const reasons = (report.records || [])
    .flatMap((r: { reasons?: string[] }) => r.reasons || [])
    .join("\n");
  const got = statuses.includes("FAIL") ? "FAIL" : statuses.every((s) => s === "PASS") ? "PASS" : "FLAGGED";
  if (c.expect === "PASS") {
    if (got !== "PASS") return { ok: false, detail: `${c.file} expected PASS, got ${got}\n${reasons}` };
    return { ok: true, detail: c.file };
  }
  if (got !== "FAIL") return { ok: false, detail: `${c.file} expected FAIL, got ${got}\n${reasons}` };
  if (c.reasonIncludes && !reasons.includes(c.reasonIncludes)) {
    return { ok: false, detail: `${c.file} FAIL but missing reason "${c.reasonIncludes}"\n${reasons}` };
  }
  return { ok: true, detail: c.file };
}

let failed = 0;
for (const c of CASES) {
  const r = runCase(c);
  if (r.ok) console.log(`PASS ${c.file}`);
  else {
    failed += 1;
    console.error(`FAIL ${r.detail}`);
  }
}

if (failed) {
  console.error(`\n${failed} red-team case(s) failed.`);
  process.exit(1);
}
console.log("\nAll red-team cases matched expected gate behaviour.");
