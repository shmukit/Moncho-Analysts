/**
 * Fetches live sector/segment IDs from Moncho reference taxonomy and writes
 * data/reference/valid-sector-ids.json, valid-segment-ids.json, and taxonomy.json
 * for QA slug/id cross-checks.
 *
 * Re-run after taxonomy changes: npm run reference:sync
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "./lib/load_env.js";

loadEnv();

const API_URL = process.env.MONCHO_API_URL || "https://app.moncho.ai";
const OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/reference");
const TAXONOMY_PATH = path.join(OUT_DIR, "taxonomy.json");

const FALLBACK_COUNTRY_SLUGS = [
  "bangladesh",
  "indonesia",
  "singapore",
  "thailand",
  "united-states",
  "vietnam",
];

type SectorRow = { id?: string; slug?: string; name?: string };
type SegmentRow = {
  id?: string;
  slug?: string;
  name?: string;
  sectors?: Array<{ id?: string }>;
};

function existingCountrySlugs(): string[] {
  try {
    const prev = JSON.parse(fs.readFileSync(TAXONOMY_PATH, "utf-8")) as {
      country_slugs?: unknown;
    };
    if (Array.isArray(prev.country_slugs) && prev.country_slugs.length > 0) {
      return prev.country_slugs.filter((s): s is string => typeof s === "string" && s.length > 0);
    }
  } catch {
    // first write or unreadable placeholder
  }
  return FALLBACK_COUNTRY_SLUGS;
}

async function main() {
  console.log(`Fetching taxonomy from ${API_URL}/api/reference/taxonomy ...`);
  const response = await fetch(`${API_URL}/api/reference/taxonomy`);
  const result = (await response.json().catch(() => ({}))) as {
    error?: string;
    sectors?: SectorRow[];
    segments?: SegmentRow[];
  };

  if (!response.ok) {
    console.error(
      `Failed to fetch taxonomy from ${API_URL}/api/reference/taxonomy (${response.status} ${result?.error || response.statusText}).`,
    );
    console.error("Fix: MONCHO_API_URL should be https://app.moncho.ai. This command does not need an API key.");
    process.exit(1);
  }

  const sectors = (result.sectors || []) as SectorRow[];
  const segments = (result.segments || []) as SegmentRow[];

  const sectorIds = sectors.map((s) => s.id).filter((id): id is string => Boolean(id));
  const segmentIds = segments.map((s) => s.id).filter((id): id is string => Boolean(id));
  const sectorSlugs = sectors
    .map((s) => s.slug)
    .filter((slug): slug is string => Boolean(slug));
  const segmentSlugs = segments
    .map((s) => s.slug)
    .filter((slug): slug is string => Boolean(slug));

  const taxonomy = {
    sectors: sectors.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
    })),
    segments: segments.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      sector_id: s.sectors?.[0]?.id ?? null,
    })),
    sector_slugs: sectorSlugs,
    segment_slugs: segmentSlugs,
    country_slugs: existingCountrySlugs(),
  };

  const PLACEHOLDER_SLUGS = new Set(["edtech", "fintech"]);
  if (sectors.length < 20) {
    console.error(
      `reference:sync wrote only ${sectors.length} sector(s). Live Moncho taxonomy has 100+. QA will reject real slugs. Re-run when the API is reachable.`,
    );
    process.exit(1);
  }
  const slugSet = new Set(sectorSlugs.map((s) => s.toLowerCase()));
  if ([...PLACEHOLDER_SLUGS].every((s) => slugSet.has(s)) && sectors.length <= 8) {
    console.error(
      "taxonomy.json still looks like the old EdTech/Fintech placeholder. Delete data/reference/taxonomy.json and re-run npm run reference:sync.",
    );
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "valid-sector-ids.json"), JSON.stringify(sectorIds, null, 2) + "\n");
  fs.writeFileSync(path.join(OUT_DIR, "valid-segment-ids.json"), JSON.stringify(segmentIds, null, 2) + "\n");
  fs.writeFileSync(TAXONOMY_PATH, JSON.stringify(taxonomy, null, 2) + "\n");

  console.log(
    `Wrote ${sectorIds.length} sector IDs, ${segmentIds.length} segment IDs, and taxonomy.json (${sectorSlugs.length} sector slugs, ${segmentSlugs.length} segment slugs) to data/reference/ (gitignored; do not commit). Live lookup stays Discovery MCP.`,
  );
}

main();
