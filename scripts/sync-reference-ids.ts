/**
 * Fetches live sector/segment IDs from Moncho reference taxonomy and writes
 * data/reference/valid-sector-ids.json and valid-segment-ids.json for QA cross-checks.
 *
 * Re-run after taxonomy changes: npm run reference:sync
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const API_URL = process.env.MONCHO_API_URL || "https://app.moncho.ai";
const OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/reference");

async function main() {
  console.log(`Fetching taxonomy from ${API_URL}/api/reference/taxonomy ...`);
  const response = await fetch(`${API_URL}/api/reference/taxonomy`);
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Failed to fetch taxonomy:", result?.error || response.statusText);
    process.exit(1);
  }

  const sectorIds = (result.sectors || []).map((s: { id: string }) => s.id).filter(Boolean);
  const segmentIds = (result.segments || []).map((s: { id: string }) => s.id).filter(Boolean);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "valid-sector-ids.json"), JSON.stringify(sectorIds, null, 2) + "\n");
  fs.writeFileSync(path.join(OUT_DIR, "valid-segment-ids.json"), JSON.stringify(segmentIds, null, 2) + "\n");

  console.log(`Wrote ${sectorIds.length} sector IDs and ${segmentIds.length} segment IDs to data/reference/`);
}

main();
