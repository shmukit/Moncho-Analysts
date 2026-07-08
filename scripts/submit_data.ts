import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { loadEnv } from "./lib/load_env.js";

loadEnv();

/**
 * Moncho Analyst Submission Script
 *
 * Usage:
 *   npm run submit -- --file data/pending/your_data.json --type organization
 *
 * QA gate runs automatically unless --skip-qa (admin emergency only).
 */

const API_URL = process.env.MONCHO_API_URL || "https://app.moncho.ai";
const AUTH_TOKEN = process.env.MONCHO_AUTH_TOKEN;

async function submitRecord(entityType: string, record: any, index: number) {
    console.log(`Submitting ${entityType} record #${index + 1} to ${API_URL}...`);

    try {
        const response = await fetch(`${API_URL}/api/analyst/change-requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify({
                entity_type: entityType,
                // If an explicit ID is present we treat this as an update.
                // For new records we omit entity_id so the API can generate one.
                entity_id: record.id || undefined,
                suggested_changes: record,
                current_data: record.current_data || {}
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`✅ Success! Change request submitted for record #${index + 1}.`);
            console.log('Request ID:', result.data.id);
        } else {
            console.error(`❌ Failed for record #${index + 1}:`, result.error || result);
        }
    } catch (error) {
        console.error(`❌ Network error for record #${index + 1}:`, error);
    }
}

function runQaGate(filePath: string, entityType: string): boolean {
  const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
  const validator = path.join(scriptsDir, "utils", "validate-analyst-data.ts");
  console.log("\n--- Pre-submit QA gate ---\n");
  const result = spawnSync(
    "npx",
    ["tsx", validator, filePath, "--type", entityType],
    { stdio: "inherit", shell: true, env: process.env }
  );
  return result.status === 0;
}

async function submitData() {
  const args = process.argv.slice(2);
  const filePathArg = args.indexOf("--file");
  const typeArg = args.indexOf("--type");
  const skipQa = args.includes("--skip-qa");

  if (filePathArg === -1 || typeArg === -1) {
    console.error("Error: Missing arguments. Use --file <path> --type <organization|product|landscape|expert>");
    process.exit(1);
  }

  if (!AUTH_TOKEN) {
    console.error("Error: MONCHO_AUTH_TOKEN not set in .env");
    process.exit(1);
  }

  const filePath = path.resolve(args[filePathArg + 1]);
  const entityType = args[typeArg + 1];

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at ${filePath}`);
    process.exit(1);
  }

  if (!skipQa) {
    const ok = runQaGate(filePath, entityType);
    if (!ok) {
      console.error("\n❌ Submit blocked — fix QA failures first (or use --skip-qa for admin override).");
      process.exit(1);
    }
  } else {
    console.warn("⚠️  --skip-qa: submitting without QA gate (admin override).");
  }

  const jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const payload = Array.isArray(jsonData) ? jsonData : [jsonData];

  for (let i = 0; i < payload.length; i++) {
    await submitRecord(entityType, payload[i], i);
  }
}

submitData();
