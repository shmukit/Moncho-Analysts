import * as fs from "fs";
import type { Args } from "./types.js";

export function parseArgs(argv: string[]): Args {
  const get = (name: string, def?: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : def;
  };
  const has = (name: string) => argv.includes(`--${name}`);
  const file = get("file");
  if (!file) {
    console.error(
      "Missing --file <path>. Example: npx tsx scripts/qa_reviewer.ts --file samples/organization_slug_sample.json --type organization",
    );
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
    skipUrlCheck: has("skip-url-check"),
  };
}

export function loadIdSet(filePath?: string): Set<string> | undefined {
  if (!filePath || !fs.existsSync(filePath)) return undefined;
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const ids: unknown[] = Array.isArray(raw) ? raw : raw.ids || [];
  return new Set(ids.filter((id) => id !== null && id !== undefined).map(String));
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isReferenceId(id: unknown): boolean {
  if (Number.isInteger(id)) return true;
  if (typeof id === "string" && UUID_RE.test(id)) return true;
  return false;
}

export function idInReferenceSet(idSet: Set<string> | undefined, id: unknown): boolean {
  if (!idSet) return true;
  return idSet.has(String(id));
}

export function isKebabCase(s: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
}

export function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Landscapes use `version_name` instead of `name`/`product_name` — this
// keeps record labeling/dedup working across all four schema types.
export function getRecordLabel(record: any, fallback: string): string {
  return record.name || record.product_name || record.version_name || fallback;
}

export function normalizeDomain(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

// Simple Levenshtein distance for fuzzy name matching
export function levenshtein(a: string, b: string): number {
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

export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

// Heuristic: does this rationale contain a concrete, checkable fact?
// Looks for digits, %, $, a 4-digit year, or multiple capitalized tokens
// (proxy for named entities like "Grab", "Series B", "AWS").
export function hasConcreteFact(text: string | undefined | null): boolean {
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

export function containsVaguePhrase(text: string | undefined | null): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const phrase of VAGUE_PHRASES) {
    if (lower.includes(phrase)) return phrase;
  }
  return null;
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
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}
