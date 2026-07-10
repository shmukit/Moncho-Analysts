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
import { fileURLToPath } from "url";
import { loadEnv } from "./lib/load_env.js";
import { validateLogoDomain } from "./lib/logo_dev.js";

loadEnv();

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
type Args = {
  file: string;
  type?: "organization" | "product" | "landscape" | "expert" | "auto";
  db?: string;
  sample?: string;
  validSectorIds?: string;
  validSegmentIds?: string;
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
    validSectorIds: get("valid-sector-ids"),
    validSegmentIds: get("valid-segment-ids"),
    concurrency: parseInt(get("concurrency", "15")!, 10),
    timeout: parseInt(get("timeout", "8000")!, 10),
    out: get("out", "data/qa-reports/")!,
    deepCheck: has("deep-check"),
  };
}

function loadIdSet(filePath?: string): Set<string> | undefined {
  if (!filePath || !fs.existsSync(filePath)) return undefined;
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const ids: unknown[] = Array.isArray(raw) ? raw : raw.ids || [];
  return new Set(ids.filter((id) => id !== null && id !== undefined).map(String));
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isReferenceId(id: unknown): boolean {
  if (Number.isInteger(id)) return true;
  if (typeof id === "string" && UUID_RE.test(id)) return true;
  return false;
}

function idInReferenceSet(idSet: Set<string> | undefined, id: unknown): boolean {
  if (!idSet) return true;
  return idSet.has(String(id));
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

// Landscapes use `version_name` instead of `name`/`product_name` — this
// keeps record labeling/dedup working across all four schema types.
function getRecordLabel(record: any, fallback: string): string {
  return record.name || record.product_name || record.version_name || fallback;
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
function loadSlugSets(): { sectorSlugs?: Set<string>; segmentSlugs?: Set<string>; countrySlugs?: Set<string> } {
  const p = path.resolve("data/reference/taxonomy.json");
  if (!fs.existsSync(p)) return {};
  try {
    const t = JSON.parse(fs.readFileSync(p, "utf-8"));
    return {
      sectorSlugs: t.sector_slugs ? new Set(t.sector_slugs) : undefined,
      segmentSlugs: t.segment_slugs ? new Set(t.segment_slugs) : undefined,
      countrySlugs: t.country_slugs ? new Set(t.country_slugs) : undefined,
    };
  } catch {
    return {};
  }
}

/** Expand product bundle `{ products, product_media }` into flat records for QA. */
function expandInputRecords(parsed: unknown, forcedType?: string): any[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (forcedType === "product" || Array.isArray(obj.products)) {
      const products = (obj.products as any[]) || [];
      const media = (obj.product_media as any[]) || [];
      return [
        ...products.map((p) => ({ ...p, __record_kind: "product" })),
        ...media.map((m) => ({ ...m, __record_kind: "product_media" })),
      ];
    }
  }
  return parsed ? [parsed] : [];
}

function detectType(record: any): "organization" | "product" | "product_media" | "landscape" | "expert" | "unknown" {
  if (record.__record_kind === "product_media") return "product_media";
  if (record.__record_kind === "product") return "product";
  if (record.product_name && record.image_url && record.group_label) return "product_media";
  if (record.product_name !== undefined) return "product";
  if (record.version_name !== undefined) return "landscape";
  if (Array.isArray(record.segments) && record.tam_data !== undefined) return "landscape";
  // Organization: website + description/sector taxonomy (slug or ID based)
  const hasOrgTaxonomy =
    record.sector_slug !== undefined ||
    record.sector_id !== undefined ||
    record.segment_slugs !== undefined ||
    record.segment_slug !== undefined;
  if (record.website_url && (record.description || hasOrgTaxonomy)) return "organization";
  if (record.sector_slug || (record.sector_id !== undefined && record.website_url)) return "organization";
  // Expert: identity/contact profile without org website+description pattern
  if (record.linkedin_url || record.title || (record.bio && !record.description)) return "expert";
  if (record.website_url || record.sector_slug) return "organization";
  return "unknown";
}

const ORG_RATIONALE_FIELDS = [
  "innovation_rationale",
  "market_traction_rationale",
  "competitiveness_rationale",
  "product_depth_rationale",
  "social_proof_rationale",
];

function checkTwoSourceRule(record: any): string[] {
  const warnings: string[] = [];
  const hasRationales = ORG_RATIONALE_FIELDS.some((f) => record[f]);
  if (!hasRationales) return warnings;
  const urls = record.source_urls;
  if (!Array.isArray(urls) || urls.length < 2) {
    warnings.push(
      "two-source rule: provide `source_urls` with at least 2 independent URLs supporting key claims (per analyst_instructions)"
    );
  } else {
    const valid = urls.filter((u: unknown) => typeof u === "string" && /^https:\/\//i.test(u));
    if (valid.length < 2) {
      warnings.push("two-source rule: `source_urls` must contain at least 2 valid https:// URLs");
    }
  }
  return warnings;
}

const ISO_COUNTRY_RE = /^[A-Z]{2}$/;

function usesIdTaxonomy(record: any): boolean {
  return record.sector_id !== undefined || record.segment_ids !== undefined;
}

function usesSlugTaxonomy(record: any): boolean {
  return (
    record.sector_slug !== undefined ||
    record.segment_slugs !== undefined ||
    record.segment_slug !== undefined ||
    record.hq_country_slug !== undefined
  );
}

const ORG_ID_FIELDS = new Set([
  "sector_id", "segment_ids", "country_id", "organization_type", "logo_url", "founded_year",
]);
const ORG_SLUG_FIELDS = new Set(["sector_slug", "segment_slugs", "segment_slug", "hq_country_slug"]);

function validateOrganizationSchema(
  record: any,
  validSectorIds?: Set<string>,
  validSegmentIds?: Set<string>
): { errors: string[]; warnings: string[]; schema_variant: string } {
  const errors: string[] = [];
  const warnings: string[] = [];

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

  const idTax = usesIdTaxonomy(record);
  const slugTax = usesSlugTaxonomy(record);
  if (!idTax && !slugTax) {
    errors.push(
      "missing sector taxonomy — provide either ID-based (`sector_id` + `segment_ids`) " +
        "or slug-based (`sector_slug` + `segment_slugs` / `hq_country_slug`)"
    );
  }

  // --- Slug-based taxonomy (handbook / analyst_instructions format) ---
  if (record.sector_slug) {
    if (!isKebabCase(record.sector_slug)) {
      errors.push(`sector_slug "${record.sector_slug}" is not kebab-case`);
    }
  }
  const segs: string[] = record.segment_slugs || (record.segment_slug ? [record.segment_slug] : []);
  for (const s of segs) {
    if (!isKebabCase(s)) errors.push(`segment slug "${s}" is not kebab-case`);
  }
  if (slugTax && segs.length === 0 && !record.segment_slug) {
    errors.push("missing segment taxonomy — provide `segment_slugs` or `segment_slug`");
  }
  if (record.hq_country_slug && !isKebabCase(record.hq_country_slug)) {
    errors.push(`hq_country_slug "${record.hq_country_slug}" is not kebab-case`);
  }

  // --- ID-based taxonomy (samples/organization_sample.json / dashboard format) ---
  if (record.sector_id !== undefined) {
    if (!isReferenceId(record.sector_id)) {
      errors.push(`sector_id ${JSON.stringify(record.sector_id)} must be an integer or UUID from reference taxonomy`);
    } else if (!idInReferenceSet(validSectorIds, record.sector_id)) {
      errors.push(`sector_id ${record.sector_id} not in reference sector list — looks guessed`);
    }
  }
  if (record.segment_ids !== undefined) {
    if (!Array.isArray(record.segment_ids)) {
      errors.push("`segment_ids` must be an array of reference IDs");
    } else {
      if (record.segment_ids.length === 0) errors.push("`segment_ids` must not be empty");
      record.segment_ids.forEach((id: unknown) => {
        if (!isReferenceId(id)) {
          errors.push(`segment_ids contains invalid ID: ${JSON.stringify(id)}`);
        } else if (!idInReferenceSet(validSegmentIds, id)) {
          errors.push(`segment_id ${id} not in reference segment list — looks guessed`);
        }
      });
    }
  }
  if (idTax && record.sector_id === undefined) {
    errors.push("missing `sector_id` (ID-based org schema)");
  }
  if (idTax && record.segment_ids === undefined) {
    errors.push("missing `segment_ids` (ID-based org schema)");
  }

  if (record.country_id !== undefined && !ISO_COUNTRY_RE.test(record.country_id)) {
    errors.push(`country_id "${record.country_id}" must be 2-letter ISO code (e.g. "ID")`);
  }
  if (slugTax && !record.hq_country_slug && !record.country_id) {
    warnings.push("missing country — provide `hq_country_slug` or `country_id`");
  }

  if (record.logo_url && typeof record.logo_url === "string" && !/^https:\/\//i.test(record.logo_url)) {
    errors.push("`logo_url` must start with https://");
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

  // SCORING_STANDARDS.md — flag missing dimension rationales (soft, not structural fail)
  for (const field of ORG_RATIONALE_FIELDS) {
    if (!record[field]) {
      warnings.push(`missing \`${field}\` (required for Moncho 5-dimension scoring rubric)`);
    }
  }

  return {
    errors,
    warnings,
    schema_variant: idTax && slugTax ? "hybrid" : idTax ? "id-based" : slugTax ? "slug-based" : "none",
  };
}

const MEDIA_TYPES = ["logo", "product_shot", "bundle_shot"];

function validateProductSchema(record: any): string[] {
  const errors: string[] = [];
  if (!record.product_name || typeof record.product_name !== "string") {
    errors.push("missing/invalid `product_name`");
  }
  if (record.product_description && typeof record.product_description === "string") {
    const wc = wordCount(record.product_description);
    if (wc > 80) errors.push(`product_description word count ${wc} (expected ≤80)`);
  }
  if (record.hs_code !== undefined && !/^\d{4,10}$/.test(String(record.hs_code))) {
    errors.push(`hs_code "${record.hs_code}" does not look like a valid HS code`);
  }
  return errors;
}

function validateProductMediaSchema(record: any, productNames: Set<string>): string[] {
  const errors: string[] = [];
  if (!record.product_name && !record.product_id) {
    errors.push("product_media requires `product_name` or `product_id`");
  }
  if (record.product_name && !productNames.has(record.product_name)) {
    errors.push(`product_media references unknown product_name "${record.product_name}"`);
  }
  if (!record.group_label || typeof record.group_label !== "string") {
    errors.push("missing/invalid `group_label` on product_media");
  }
  if (!record.image_url || typeof record.image_url !== "string") {
    errors.push("missing/invalid `image_url` on product_media");
  } else if (!/^https:\/\//i.test(record.image_url)) {
    errors.push("`image_url` must start with https://");
  }
  if (record.media_type && !MEDIA_TYPES.includes(record.media_type)) {
    errors.push(`media_type must be one of: ${MEDIA_TYPES.join(", ")}`);
  }
  return errors;
}

// --- Landscape -----------------------------------------------------------
// Matches the real landscape_sample.json shape:
// { version_name, description?, sector_id, status?, data_year?, classification?,
//   segments: [{ id, name, organizations?: [{id, name}] }], tam_data?: {total_tam, cagr, year} }
const KNOWN_STATUSES = ["draft", "published", "archived", "in_review"];
const KNOWN_CLASSIFICATIONS = ["public", "private", "internal"];

function validateLandscapeSchema(record: any, validSectorIds?: Set<string>, validSegmentIds?: Set<string>): string[] {
  const errors: string[] = [];

  if (!record.version_name || typeof record.version_name !== "string") {
    errors.push("missing/invalid `version_name`");
  }
  if (record.sector_id === undefined || record.sector_id === null) {
    errors.push("missing `sector_id` (must be a real ID from reference taxonomy, never guessed)");
  } else if (!isReferenceId(record.sector_id)) {
    errors.push(`sector_id ${JSON.stringify(record.sector_id)} must be an integer or UUID from reference taxonomy`);
  } else if (!idInReferenceSet(validSectorIds, record.sector_id)) {
    errors.push(`sector_id ${record.sector_id} not found in reference sector list — looks guessed, not looked up`);
  }
  if (record.status && !KNOWN_STATUSES.includes(record.status)) {
    errors.push(`status "${record.status}" not in known set [${KNOWN_STATUSES.join(", ")}] — confirm this is a real status value`);
  }
  if (record.classification && !KNOWN_CLASSIFICATIONS.includes(record.classification)) {
    errors.push(`classification "${record.classification}" not in known set [${KNOWN_CLASSIFICATIONS.join(", ")}] — confirm this is real`);
  }
  if (record.data_year !== undefined) {
    const y = Number(record.data_year);
    const thisYear = new Date().getFullYear();
    if (!Number.isInteger(y) || y < 2000 || y > thisYear + 1) {
      errors.push(`data_year ${record.data_year} looks implausible`);
    }
  }

  if (!Array.isArray(record.segments) || record.segments.length === 0) {
    errors.push("missing/empty `segments` array");
  } else {
    record.segments.forEach((seg: any, i: number) => {
      if (!seg.name || typeof seg.name !== "string") errors.push(`segments[${i}] missing/invalid \`name\``);
      if (seg.id === undefined || seg.id === null) {
        errors.push(`segments[${i}] missing \`id\` (must be a real segment ID, never guessed)`);
      } else if (!isReferenceId(seg.id)) {
        errors.push(`segments[${i}].id must be an integer or UUID, got ${JSON.stringify(seg.id)}`);
      } else if (!idInReferenceSet(validSegmentIds, seg.id)) {
        errors.push(`segments[${i}].id ${seg.id} not found in reference segment list — looks guessed, not looked up`);
      }
      if (Array.isArray(seg.organizations)) {
        seg.organizations.forEach((org: any, j: number) => {
          if (!org.name) errors.push(`segments[${i}].organizations[${j}] missing \`name\``);
          if (!org.id) {
            errors.push(`segments[${i}].organizations[${j}] missing \`id\``);
          } else if (!UUID_RE.test(org.id)) {
            errors.push(
              `segments[${i}].organizations[${j}].id "${org.id}" is not a real UUID — ` +
              `looks like a placeholder. Organizations must already exist in the DB ` +
              `(with a real generated UUID) before you can position them on a landscape.`
            );
          }
        });
      }
    });
  }

  if (record.tam_data) {
    const t = record.tam_data;
    if (typeof t.total_tam !== "number" || t.total_tam <= 0) {
      errors.push(`tam_data.total_tam must be a positive number, got ${JSON.stringify(t.total_tam)}`);
    }
    if (t.cagr !== undefined && (typeof t.cagr !== "number" || t.cagr < -100 || t.cagr > 500)) {
      errors.push(`tam_data.cagr ${JSON.stringify(t.cagr)} looks implausible (expected roughly -100 to 500)`);
    }
    if (t.year !== undefined) {
      const y = Number(t.year);
      const thisYear = new Date().getFullYear();
      if (!Number.isInteger(y) || y < 2000 || y > thisYear + 2) {
        errors.push(`tam_data.year ${t.year} looks implausible`);
      }
    }
  }

  return errors;
}

// --- Expert ----------------------------------------------------------------
// Matches the real expert_sample.json shape:
// { name, title?, bio?, linkedin_url?, website_url?, location?, country_id?, segment_ids?: number[] }

function validateExpertSchema(record: any, validSegmentIds?: Set<string>): string[] {
  const errors: string[] = [];
  if (!record.name || typeof record.name !== "string") errors.push("missing/invalid `name`");

  const contactUrl = record.linkedin_url || record.website_url;
  if (!contactUrl) {
    errors.push("missing both `linkedin_url` and `website_url` — need at least one checkable identity source");
  } else {
    if (record.linkedin_url && !/^https:\/\//i.test(record.linkedin_url)) {
      errors.push("linkedin_url must be https://");
    }
    if (record.website_url && !/^https:\/\//i.test(record.website_url)) {
      errors.push("website_url must be https://");
    }
  }

  if (record.country_id !== undefined && !ISO_COUNTRY_RE.test(record.country_id)) {
    errors.push(`country_id "${record.country_id}" should be a 2-letter ISO code (e.g. "TH"), not a slug or full name`);
  }

  if (record.segment_ids !== undefined) {
    if (!Array.isArray(record.segment_ids)) {
      errors.push("`segment_ids` must be an array of reference IDs");
    } else {
      record.segment_ids.forEach((id: unknown) => {
        if (!isReferenceId(id)) {
          errors.push(`segment_ids contains an invalid ID: ${JSON.stringify(id)}`);
        } else if (!idInReferenceSet(validSegmentIds, id)) {
          errors.push(`segment_id ${id} not found in reference segment list — confirm this wasn't guessed`);
        }
      });
    }
  }

  if (record.bio) {
    const wc = wordCount(record.bio);
    if (wc < 8 || wc > 60) errors.push(`bio word count ${wc} looks off (expected ~8-60)`);
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

const ORG_SOFT_SAMPLE_FIELDS = new Set([
  ...ORG_RATIONALE_FIELDS,
  "hq_country_slug",
  "country_id",
  "founded_year",
  "logo_url",
  "organization_type",
]);

const PRODUCT_BUNDLE_KEYS = new Set(["products", "product_media"]);

function validateAgainstSampleShape(
  record: any,
  sampleShape: Record<string, any>,
  recordType: string
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const idTax = usesIdTaxonomy(record);
  const slugTax = usesSlugTaxonomy(record);

  for (const [key, sampleVal] of Object.entries(sampleShape)) {
    if (sampleVal === null || sampleVal === undefined) continue;

    if ((recordType === "product" || recordType === "product_media") && PRODUCT_BUNDLE_KEYS.has(key)) {
      continue;
    }

    if (recordType === "organization") {
      if (slugTax && !idTax && ORG_ID_FIELDS.has(key)) continue;
      if (idTax && !slugTax && ORG_SLUG_FIELDS.has(key)) continue;
      // Rubric / optional fields → warn only, not structural fail
      if (ORG_SOFT_SAMPLE_FIELDS.has(key)) {
        if (!(key in record) || record[key] === null || record[key] === "") {
          warnings.push(`missing field \`${key}\` (recommended per reference sample)`);
        }
        continue;
      }
    }

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
  return { errors, warnings };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));

  const raw = fs.readFileSync(args.file, "utf-8");
  const parsed = JSON.parse(raw);
  const records: any[] = expandInputRecords(parsed, args.type === "product" ? "product" : undefined);

  const productNames = new Set(
    records.filter((r) => detectType(r) === "product").map((r) => r.product_name as string)
  );

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
  const validSectorIds = loadIdSet(args.validSectorIds);
  const validSegmentIds = loadIdSet(args.validSegmentIds);
  const slugSets = loadSlugSets();
  if (args.validSectorIds && !validSectorIds) console.log(`--valid-sector-ids ${args.validSectorIds} not found — skipping sector_id cross-check`);
  if (args.validSegmentIds && !validSegmentIds) console.log(`--valid-segment-ids ${args.validSegmentIds} not found — skipping segment_id cross-check`);

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
    scheduleCheck(r.linkedin_url);
    scheduleCheck(r.image_url);
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
    const recordType =
      record.__record_kind === "product_media"
        ? "product_media"
        : args.type && args.type !== "auto"
          ? args.type
          : detectType(record);
    const reasons: string[] = [];
    const checks: any = {};

    // Schema validation
    let schemaErrors: string[] = [];
    let schemaWarnings: string[] = [];

    if (recordType === "organization") {
      const org = validateOrganizationSchema(record, validSectorIds, validSegmentIds);
      schemaErrors = org.errors;
      schemaWarnings = org.warnings;
      checks.schema_variant = org.schema_variant;
      if (slugSets.sectorSlugs && record.sector_slug && !slugSets.sectorSlugs.has(record.sector_slug)) {
        schemaWarnings.push(`sector_slug "${record.sector_slug}" not in reference taxonomy — confirm or leave empty`);
      }
      if (slugSets.segmentSlugs && record.segment_slugs) {
        for (const s of record.segment_slugs as string[]) {
          if (!slugSets.segmentSlugs!.has(s)) {
            schemaWarnings.push(`segment_slug "${s}" not in reference taxonomy — confirm or leave empty`);
          }
        }
      }
      if (slugSets.countrySlugs && record.hq_country_slug && !slugSets.countrySlugs.has(record.hq_country_slug)) {
        schemaWarnings.push(`hq_country_slug "${record.hq_country_slug}" not in reference taxonomy`);
      }
      if (record.logo_url && record.website_url) {
        const logoErr = validateLogoDomain(String(record.logo_url), String(record.website_url));
        if (logoErr) schemaWarnings.push(logoErr);
      }
      schemaWarnings.push(...checkTwoSourceRule(record));
    } else if (recordType === "product") {
      schemaErrors = validateProductSchema(record);
    } else if (recordType === "product_media") {
      schemaErrors = validateProductMediaSchema(record, productNames);
    } else if (recordType === "landscape") {
      schemaErrors = validateLandscapeSchema(record, validSectorIds, validSegmentIds);
    } else if (recordType === "expert") {
      schemaErrors = validateExpertSchema(record, validSegmentIds);
    } else {
      schemaErrors = ["unable to determine record type (organization/product/landscape/expert)"];
    }

    if (sampleShape) {
      const sampleResult = validateAgainstSampleShape(record, sampleShape, recordType);
      schemaErrors.push(...sampleResult.errors);
      schemaWarnings.push(...sampleResult.warnings);
    }

    checks.schema = schemaErrors.length === 0 ? "pass" : "fail";
    reasons.push(...schemaErrors);
    if (schemaWarnings.length) {
      checks.rubric_warnings = schemaWarnings;
      reasons.push(...schemaWarnings);
    }

    // URL checks
    if (record.website_url) {
      const res = urlResultMap.get(record.website_url);
      checks.url_website = res;
      if (res && !res.ok) reasons.push(`website_url unreachable: ${res.error}`);
    }
    if (record.linkedin_url) {
      const res = urlResultMap.get(record.linkedin_url);
      checks.url_linkedin = res;
      // LinkedIn often blocks bots (403/999) — flag for manual verify, don't hard-fail
      const linkedinBlocked = res && !res.ok && (res.status === 403 || res.status === 999);
      if (res && !res.ok && !linkedinBlocked) {
        reasons.push(`linkedin_url unreachable: ${res.error}`);
      } else if (linkedinBlocked) {
        reasons.push(`linkedin_url returned HTTP ${res.status} (likely bot-protection — verify manually)`);
      }
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
    if (recordType === "product_media" && record.image_url) {
      const res = urlResultMap.get(record.image_url);
      checks.url_image = res;
      if (res && !res.ok) reasons.push(`image_url unreachable: ${res.error}`);
    }

    // Duplicate detection (within batch + against DB export) — skip product_media rows
    let duplicateOf: string | null = null;
    if (recordType !== "product_media") {
      const normName = normalizeName(getRecordLabel(record, ""));
      const normDomain = record.website_url ? normalizeDomain(record.website_url) : null;

      const candidatePool = [
        ...records.slice(0, idx).map((r: any) => ({ source: "batch", record: r })),
        ...existingDb.map((r: any) => ({ source: "db", record: r })),
      ];
      for (const cand of candidatePool) {
        if (cand.record.__record_kind === "product_media") continue;
        const candName = normalizeName(getRecordLabel(cand.record, ""));
        const candDomain = cand.record.website_url ? normalizeDomain(cand.record.website_url) : null;
        const nameSim = similarity(normName, candName);
        const sameDomain = normDomain && candDomain && normDomain === candDomain;
        if (sameDomain || nameSim > 0.88) {
          duplicateOf = `${cand.source}:${getRecordLabel(cand.record, "unknown")}`;
          break;
        }
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
    const linkedinHardDown =
      checks.url_linkedin &&
      !checks.url_linkedin.ok &&
      checks.url_linkedin.status !== 403 &&
      checks.url_linkedin.status !== 999;
    const hasFail =
      checks.schema === "fail" ||
      websiteHardDown ||
      linkedinHardDown ||
      duplicateOf !== null;
    const hasFlag = reasons.length > 0 && !hasFail;

    const status = hasFail ? "FAIL" : hasFlag ? "FLAGGED" : "PASS";

    report.push({
      record_id: getRecordLabel(record, `record_${idx}`),
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
      ? `${(failRate * 100).toFixed(0)}% of this batch FAILed mechanical checks — escalate to a Senior Analyst conversation with the submitting analyst rather than reviewing record-by-record.`
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
    const scriptDir = path.dirname(fileURLToPath(import.meta.url));
    try {
      execFileSync(
        process.platform === "win32" ? "npx.cmd" : "npx",
        [
          "tsx",
          path.join(scriptDir, "deep_fact_check.ts"),
          "--file", args.file,
          "--report", outPath,
          "--out", args.out,
        ],
        { stdio: "inherit", shell: process.platform === "win32" }
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
