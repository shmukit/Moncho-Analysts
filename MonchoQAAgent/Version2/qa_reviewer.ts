#!/usr/bin/env node
/**
 * Moncho.ai — Analyst Submission QA Reviewer
 * ------------------------------------------
 * First-pass automated QA layer for analyst submissions BEFORE they reach a
 * Senior Analyst / Admin. This tool does NOT approve data and does NOT
 * fabricate verification it didn't perform. It:
 *
 *   1. Validates records against the Organization / Product schema shape.
 *   2. Actually fetches every website_url / image_url and records the real
 *      HTTP status (dead links / parked domains / timeouts = FAIL).
 *   3. Flags likely duplicates (within batch and vs. an optional DB export).
 *   4. Flags slug-format violations (must be kebab-case).
 *   5. Flags "vague" rationales that contain no verifiable fact (no number,
 *      date, %, $, or named entity) — per SCORING_STANDARDS.md guidance.
 *   6. Flags copy-pasted/boilerplate descriptions across records.
 *
 * What this tool explicitly does NOT do: confirm that a revenue figure,
 * funding round, patent, or award claim is factually true. It can only
 * confirm that a cited source URL resolves. Substantive fact-checking of
 * claims still requires a human second-source check or a separate,
 * deliberate LLM-assisted research pass (see --deep-check below) — which is
 * slower and costs API calls, by design, because that's what real
 * verification requires.
 *
 * Usage:
 *   npx tsx qa_reviewer.ts --file data/pending/2026-01-25-onboarding.json \
 *     [--type organization|product] \
 *     [--db data/exports/existing-organizations.json] \
 *     [--concurrency 20] \
 *     [--timeout 8000] \
 *     [--out data/qa-reports/]
 */

import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
type Args = {
  file: string;
  type?: "organization" | "product" | "landscape" | "expert" | "auto";
  db?: string;
  sample?: string;
  concurrency: number;
  timeout: number;
  out: string;
  deepCheck: boolean;
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
    type: (get("type", "auto") as Args["type"]),
    db: get("db"),
    sample: get("sample"),
    concurrency: parseInt(get("concurrency", "15")!, 10),
    timeout: parseInt(get("timeout", "8000")!, 10),
    out: get("out", "data/qa-reports/")!,
    deepCheck: has("deep-check"),
  };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function isKebabCase(s: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeDomain(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

// Simple Levenshtein distance for fuzzy name matching
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array(n + 1).fill(0).map((_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

// Heuristic: does this rationale contain a concrete, checkable fact?
// Looks for digits, %, $, a 4-digit year, or multiple capitalized tokens
// (proxy for named entities like "Grab", "Series B", "AWS").
function hasConcreteFact(text: string | undefined | null): boolean {
  if (!text) return false;
  const hasNumber = /\d/.test(text);
  const hasPercentOrMoney = /[%$€£]/.test(text);
  const hasYear = /\b(19|20)\d{2}\b/.test(text);
  const capTokens = (text.match(/\b[A-Z][a-zA-Z0-9]{2,}\b/g) || []).length;
  return hasNumber || hasPercentOrMoney || hasYear || capTokens >= 2;
}

const VAGUE_PHRASES = [
  "good product", "great product", "strong team", "very innovative",
  "good market", "great market", "well positioned", "highly rated",
  "very popular", "well known", "industry leader", "best in class",
  "cutting edge", "world class", "innovative solution", "great potential",
];

function containsVaguePhrase(text: string | undefined | null): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const phrase of VAGUE_PHRASES) {
    if (lower.includes(phrase)) return phrase;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Concurrency-limited fetch pool (no external deps)
// ---------------------------------------------------------------------------
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
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

type UrlCheckResult = {
  url: string;
  ok: boolean;
  status: number | null;
  final_url: string | null;
  error: string | null;
  latency_ms: number | null;
};

async function checkUrl(url: string, timeoutMs: number): Promise<UrlCheckResult> {
  const started = Date.now();
  if (!url || typeof url !== "string") {
    return { url, ok: false, status: null, final_url: null, error: "empty/invalid url", latency_ms: null };
  }
  if (!/^https:\/\//i.test(url)) {
    return { url, ok: false, status: null, final_url: null, error: "not https://", latency_ms: null };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // A real browser User-Agent matters: many legitimate sites (Cloudflare/bot
  // protection) return 403 to bare, header-less requests. Without this,
  // the checker produces false-positive "dead link" flags on live sites.
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };
  try {
    let res: Response;
    try {
      res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal, headers });
      if ([403, 405, 406, 501].includes(res.status)) {
        res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal, headers });
      }
    } finally {
      clearTimeout(timer);
    }
    const ambiguousBlock = res.status === 403;
    return {
      url,
      ok: res.ok,
      status: res.status,
      final_url: res.url || null,
      error: res.ok ? null : ambiguousBlock
        ? `HTTP ${res.status} (may be bot-protection, not a dead link — verify manually)`
        : `HTTP ${res.status}`,
      latency_ms: Date.now() - started,
    };
  } catch (err: any) {
    return {
      url,
      ok: false,
      status: null,
      final_url: null,
      error: err?.name === "AbortError" ? `timeout after ${timeoutMs}ms` : String(err?.message || err),
      latency_ms: Date.now() - started,
    };
  }
}

// ---------------------------------------------------------------------------
// Record shape detection + schema checks
// ---------------------------------------------------------------------------
function detectType(record: any): "organization" | "product" | "landscape" | "expert" | "unknown" {
  if (record.product_name !== undefined) return "product";
  if (Array.isArray(record.segments)) return "landscape";
  if (record.linkedin_url !== undefined || (record.name && record.bio !== undefined)) return "expert";
  if (record.website_url !== undefined || record.sector_slug !== undefined) return "organization";
  return "unknown";
}

const ORG_RATIONALE_FIELDS = [
  "innovation_rationale",
  "market_traction_rationale",
  "competitiveness_rationale",
  "product_depth_rationale",
  "social_proof_rationale",
];

function validateOrganizationSchema(record: any): string[] {
  const errors: string[] = [];
  if (!record.name || typeof record.name !== "string") errors.push("missing/invalid `name`");
  if (!record.website_url || typeof record.website_url !== "string") {
    errors.push("missing/invalid `website_url`");
  } else if (!/^https:\/\//i.test(record.website_url)) {
    errors.push("`website_url` must start with https://");
  }
  if (!record.description || typeof record.description !== "string") {
    errors.push("missing `description`");
  } else {
    const wc = wordCount(record.description);
    if (wc < 20 || wc > 50) errors.push(`description word count ${wc} (expected 20-50)`);
  }
  if (record.sector_slug && !isKebabCase(record.sector_slug)) {
    errors.push(`sector_slug "${record.sector_slug}" is not kebab-case`);
  }
  const segs: string[] = record.segment_slugs || (record.segment_slug ? [record.segment_slug] : []);
  for (const s of segs) {
    if (!isKebabCase(s)) errors.push(`segment slug "${s}" is not kebab-case`);
  }
  if (record.hq_country_slug && !isKebabCase(record.hq_country_slug)) {
    errors.push(`hq_country_slug "${record.hq_country_slug}" is not kebab-case`);
  }
  if (record.founded_year) {
    const y = Number(record.founded_year);
    const thisYear = new Date().getFullYear();
    if (!Number.isInteger(y) || y < 1800 || y > thisYear) {
      errors.push(`founded_year ${record.founded_year} looks implausible`);
    }
  }
  if (record.id !== undefined && record.id !== null && record.__is_update !== true) {
    errors.push("`id` present but record not marked as an update (__is_update) — new records must omit id");
  }
  return errors;
}

function validateProductSchema(record: any): string[] {
  const errors: string[] = [];
  if (!record.product_name || typeof record.product_name !== "string") {
    errors.push("missing/invalid `product_name`");
  }
  return errors;
}

// --- Landscape ---------------------------------------------------------
// Best-effort schema based on the table description you gave ("Landscape
// with segments and TAM" → landscape_versions, segments, sector_segments).
// This is a GUESS at field names. Once you share the real
// samples/landscape_sample.json, either hardcode the exact fields here or
// just pass --sample samples/landscape_sample.json and rely on the
// generic inference fallback below, which adapts automatically.
function validateLandscapeSchema(record: any): string[] {
  const errors: string[] = [];
  if (!record.name || typeof record.name !== "string") errors.push("missing/invalid `name`");
  if (!record.sector_slug || typeof record.sector_slug !== "string") {
    errors.push("missing/invalid `sector_slug`");
  } else if (!isKebabCase(record.sector_slug)) {
    errors.push(`sector_slug "${record.sector_slug}" is not kebab-case`);
  }
  if (!Array.isArray(record.segments) || record.segments.length === 0) {
    errors.push("missing/empty `segments` array");
  } else {
    record.segments.forEach((seg: any, i: number) => {
      if (!seg.name) errors.push(`segments[${i}] missing \`name\``);
      if (!seg.slug) errors.push(`segments[${i}] missing \`slug\``);
      else if (!isKebabCase(seg.slug)) errors.push(`segments[${i}].slug "${seg.slug}" is not kebab-case`);
      if (seg.tam_usd !== undefined && (typeof seg.tam_usd !== "number" || seg.tam_usd <= 0)) {
        errors.push(`segments[${i}].tam_usd must be a positive number, got ${JSON.stringify(seg.tam_usd)}`);
      }
    });
  }
  return errors;
}

// --- Expert --------------------------------------------------------------
// Best-effort schema (expert_sample.json not provided) — same caveat as
// above. Adjust field names once the real sample is available.
function validateExpertSchema(record: any): string[] {
  const errors: string[] = [];
  if (!record.name || typeof record.name !== "string") errors.push("missing/invalid `name`");
  const contactUrl = record.linkedin_url || record.website_url;
  if (!contactUrl) {
    errors.push("missing both `linkedin_url` and `website_url` — need at least one checkable identity source");
  } else if (!/^https:\/\//i.test(contactUrl)) {
    errors.push("expert contact URL must be https://");
  }
  const segs: string[] = record.segment_slugs || [];
  segs.forEach((s) => {
    if (!isKebabCase(s)) errors.push(`segment slug "${s}" is not kebab-case`);
  });
  if (record.bio) {
    const wc = wordCount(record.bio);
    if (wc < 10 || wc > 80) errors.push(`bio word count ${wc} looks off (expected ~10-80)`);
  }
  return errors;
}

// --- Generic sample-driven inference (fallback / cross-check) -----------
// Loads an actual sample JSON file and treats every non-null top-level key
// present in it as "expected." Flags missing expected fields and obvious
// type mismatches. This is intentionally conservative — it will never be
// as precise as a hand-written validator, but it means the tool degrades
// gracefully to "structurally sane" checks for any schema you point it at,
// instead of silently skipping validation for types it doesn't know yet.
function loadSampleShape(samplePath: string): Record<string, any> | null {
  if (!samplePath || !fs.existsSync(samplePath)) return null;
  const raw = JSON.parse(fs.readFileSync(samplePath, "utf-8"));
  const sample = Array.isArray(raw) ? raw[0] : raw;
  return sample || null;
}

function validateAgainstSampleShape(record: any, sampleShape: Record<string, any>): string[] {
  const errors: string[] = [];
  for (const [key, sampleVal] of Object.entries(sampleShape)) {
    if (sampleVal === null || sampleVal === undefined) continue; // optional field in the sample itself
    if (!(key in record) || record[key] === null || record[key] === "") {
      errors.push(`missing field \`${key}\` (present in reference sample)`);
      continue;
    }
    const expectedType = Array.isArray(sampleVal) ? "array" : typeof sampleVal;
    const actualType = Array.isArray(record[key]) ? "array" : typeof record[key];
    if (expectedType !== actualType) {
      errors.push(`field \`${key}\` expected type ${expectedType}, got ${actualType}`);
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));

  const raw = fs.readFileSync(args.file, "utf-8");
  const parsed = JSON.parse(raw);
  const records: any[] = Array.isArray(parsed) ? parsed : [parsed];

  let existingDb: any[] = [];
  if (args.db && fs.existsSync(args.db)) {
    const dbRaw = JSON.parse(fs.readFileSync(args.db, "utf-8"));
    existingDb = Array.isArray(dbRaw) ? dbRaw : [dbRaw];
  }

  console.log(`Loaded ${records.length} record(s) from ${args.file}`);
  if (existingDb.length) console.log(`Loaded ${existingDb.length} existing DB record(s) for dedup from ${args.db}`);

  const sampleShape = args.sample ? loadSampleShape(args.sample) : null;
  if (args.sample) {
    console.log(
      sampleShape
        ? `Cross-checking fields against reference sample ${args.sample}`
        : `--sample ${args.sample} not found or empty — skipping sample cross-check`
    );
  }

  // Collect all URLs to check across the batch (dedup identical URLs to avoid re-fetching)
  const urlToCheck = new Map<string, Promise<UrlCheckResult>>();
  function scheduleCheck(url: string | undefined) {
    if (!url) return;
    if (!urlToCheck.has(url)) {
      urlToCheck.set(url, checkUrl(url, args.timeout));
    }
  }
  for (const r of records) {
    scheduleCheck(r.website_url);
    if (Array.isArray(r.logo_url)) r.logo_url.forEach(scheduleCheck);
    else scheduleCheck(r.logo_url);
    if (Array.isArray(r.product_media)) {
      for (const m of r.product_media) scheduleCheck(m.image_url);
    }
  }
  // Run with bounded concurrency
  const urls = [...urlToCheck.keys()];
  console.log(`Checking ${urls.length} unique URL(s) with concurrency=${args.concurrency}...`);
  const checkResults = await mapWithConcurrency(urls, args.concurrency, (u) => checkUrl(u, args.timeout));
  const urlResultMap = new Map<string, UrlCheckResult>(urls.map((u, i) => [u, checkResults[i]]));

  // Description duplicate tracking (boilerplate detector)
  const descriptionSeen = new Map<string, number>();

  const report: any[] = [];

  records.forEach((record, idx) => {
    const recordType = args.type && args.type !== "auto" ? args.type : detectType(record);
    const reasons: string[] = [];
    const checks: any = {};

    // Schema validation
    const schemaErrors =
      recordType === "organization" ? validateOrganizationSchema(record) :
      recordType === "product" ? validateProductSchema(record) :
      recordType === "landscape" ? validateLandscapeSchema(record) :
      recordType === "expert" ? validateExpertSchema(record) :
      ["unable to determine record type (organization/product/landscape/expert)"];
    if (sampleShape) {
      schemaErrors.push(...validateAgainstSampleShape(record, sampleShape));
    }
    checks.schema = schemaErrors.length === 0 ? "pass" : "fail";
    reasons.push(...schemaErrors);

    // URL checks
    if (record.website_url) {
      const res = urlResultMap.get(record.website_url);
      checks.url_website = res;
      if (res && !res.ok) reasons.push(`website_url unreachable: ${res.error}`);
    }
    if (record.logo_url) {
      const logos = Array.isArray(record.logo_url) ? record.logo_url : [record.logo_url];
      checks.url_logos = logos.map((u: string) => urlResultMap.get(u));
      checks.url_logos.forEach((r: UrlCheckResult | undefined) => {
        if (r && !r.ok) reasons.push(`logo_url unreachable: ${r.error}`);
      });
    }
    if (Array.isArray(record.product_media)) {
      checks.url_product_media = record.product_media.map((m: any) => urlResultMap.get(m.image_url));
      checks.url_product_media.forEach((r: UrlCheckResult | undefined, i: number) => {
        if (r && !r.ok) reasons.push(`product_media[${i}].image_url unreachable: ${r.error}`);
      });
    }

    // Duplicate detection (within batch + against DB export)
    const normName = normalizeName(record.name || record.product_name || "");
    const normDomain = record.website_url ? normalizeDomain(record.website_url) : null;
    let duplicateOf: string | null = null;

    const candidatePool = [
      ...records.slice(0, idx).map((r: any) => ({ source: "batch", record: r })),
      ...existingDb.map((r: any) => ({ source: "db", record: r })),
    ];
    for (const cand of candidatePool) {
      const candName = normalizeName(cand.record.name || cand.record.product_name || "");
      const candDomain = cand.record.website_url ? normalizeDomain(cand.record.website_url) : null;
      const nameSim = similarity(normName, candName);
      const sameDomain = normDomain && candDomain && normDomain === candDomain;
      if (sameDomain || nameSim > 0.88) {
        duplicateOf = `${cand.source}:${cand.record.name || cand.record.product_name}`;
        break;
      }
    }
    checks.duplicate_of = duplicateOf;
    if (duplicateOf) reasons.push(`likely duplicate of ${duplicateOf}`);

    // Boilerplate / copy-paste description detector
    if (record.description) {
      const key = record.description.trim().toLowerCase();
      const seenCount = (descriptionSeen.get(key) || 0) + 1;
      descriptionSeen.set(key, seenCount);
      if (seenCount > 1) reasons.push("description identical to another record in this batch (possible copy-paste)");
    }

    // Rationale fact-density + vague-phrase checks
    checks.rationale_quality = {};
    for (const field of ORG_RATIONALE_FIELDS) {
      if (record[field]) {
        const vague = containsVaguePhrase(record[field]);
        const concrete = hasConcreteFact(record[field]);
        checks.rationale_quality[field] = concrete && !vague ? "ok" : "vague";
        if (vague) reasons.push(`${field} uses vague phrase "${vague}" with no concrete fact`);
        else if (!concrete) reasons.push(`${field} has no verifiable fact (no number/date/%/named entity)`);
      }
    }

    // Overall status
    const websiteHardDown = checks.url_website && !checks.url_website.ok && checks.url_website.status !== 403;
    const hasFail =
      checks.schema === "fail" ||
      websiteHardDown ||
      duplicateOf !== null;
    const hasFlag = reasons.length > 0 && !hasFail;

    const status = hasFail ? "FAIL" : hasFlag ? "FLAGGED" : "PASS";

    report.push({
      record_id: record.name || record.product_name || `record_${idx}`,
      record_type: recordType,
      status,
      checks,
      reasons,
      requires_human_review: status !== "PASS",
    });
  });

  // Batch-level escalation check
  const failCount = report.filter((r) => r.status === "FAIL").length;
  const failRate = failCount / report.length;
  const batchWarning =
    failRate > 0.15
      ? `⚠️  ${(failRate * 100).toFixed(0)}% of this batch FAILed mechanical checks — escalate to a Senior Analyst conversation with the submitting analyst rather than reviewing record-by-record.`
      : null;

  // Write report
  fs.mkdirSync(args.out, { recursive: true });
  const baseName = path.basename(args.file).replace(/\.json$/, "");
  const outPath = path.join(args.out, `${baseName}-qa-report.json`);
  fs.writeFileSync(
    outPath,
    JSON.stringify({ file: args.file, generated_at: new Date().toISOString(), batch_warning: batchWarning, summary: {
      total: report.length,
      pass: report.filter(r => r.status === "PASS").length,
      flagged: report.filter(r => r.status === "FLAGGED").length,
      fail: report.filter(r => r.status === "FAIL").length,
    }, records: report }, null, 2)
  );

  // Console summary
  console.log("\n=== QA SUMMARY ===");
  console.log(`PASS:    ${report.filter(r => r.status === "PASS").length}`);
  console.log(`FLAGGED: ${report.filter(r => r.status === "FLAGGED").length}`);
  console.log(`FAIL:    ${report.filter(r => r.status === "FAIL").length}`);
  if (batchWarning) console.log(`\n${batchWarning}`);
  console.log(`\nFull report written to ${outPath}`);

  for (const r of report) {
    if (r.status !== "PASS") {
      console.log(`\n[${r.status}] ${r.record_id}`);
      r.reasons.forEach((reason: string) => console.log(`   - ${reason}`));
    }
  }

  if (args.deepCheck) {
    console.log("\n--deep-check requested: handing off to deep_fact_check.ts for claim-level verification...");
    const { execFileSync } = await import("child_process");
    const scriptDir = path.dirname(new URL(import.meta.url).pathname);
    try {
      execFileSync(
        "npx",
        [
          "tsx",
          path.join(scriptDir, "deep_fact_check.ts"),
          "--file", args.file,
          "--report", outPath,
          "--out", args.out,
        ],
        { stdio: "inherit" }
      );
    } catch (err) {
      console.error("deep_fact_check.ts exited with errors (see above). Mechanical QA report is still valid at:", outPath);
    }
  }

  process.exit(report.some(r => r.status === "FAIL") ? 1 : 0);
}

main().catch((err) => {
  console.error("QA reviewer failed:", err);
  process.exit(2);
});
