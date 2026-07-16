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
 *   npm run submit -- --file data/pending/orgs.json --type organization
 *   npm run submit -- --file data/pending/products.json --type product
 *   npm run submit -- --file data/pending/facts.json --type market_fact
 *
 * QA gate runs mechanical QA (validate-analyst-data.ts → qa_reviewer.ts) unless --skip-qa.
 */

const API_URL = process.env.MONCHO_API_URL || "https://app.moncho.ai";
const AUTH_TOKEN = process.env.MONCHO_AUTH_TOKEN;

async function submitRecord(entityType: string, record: any, index: number) {
    console.log(`Submitting ${entityType} record #${index + 1} to ${API_URL}...`);

    const isMarketFact = entityType === "market_fact";

    try {
        const url = isMarketFact
            ? `${API_URL}/api/analyst/market-facts/stage`
            : `${API_URL}/api/analyst/change-requests`;

        const body = isMarketFact
            ? JSON.stringify({ facts: [record] })
            : JSON.stringify({
                entity_type: entityType,
                entity_id: record.id || undefined,
                suggested_changes: record,
                current_data: record.current_data || {},
            });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body,
        });

        const result = await response.json();

        if (response.ok) {
            if (isMarketFact) {
                console.log(`Success: market fact staged for record #${index + 1}.`);
                console.log('Staging IDs:', result.ids ?? []);
            } else {
                console.log(`Success: change request submitted for record #${index + 1}.`);
                console.log('Request ID:', result.data?.id);
            }
        } else {
            console.error(`Failed for record #${index + 1}:`, result.error || result);
            if (result.code === 'SUBMISSION_CAP_REACHED') {
                console.error('Hint: trial ended — ask founder for earned access or get one submission approved and applied.');
            }
        }
    } catch (error) {
        console.error(`Network error for record #${index + 1}:`, error);
    }
}

function validateMarketFactRecord(record: any, index: number): string | null {
    const required = ['metric_key', 'country', 'year', 'value', 'unit', 'source_name'] as const;
    for (const field of required) {
        if (record[field] == null || (typeof record[field] === 'string' && !String(record[field]).trim())) {
            return `Record ${index + 1}: missing required field ${field}`;
        }
    }
    return null;
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
    console.error("Error: Missing arguments. Use --file <path> --type <organization|product|market_fact|landscape|expert>");
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

  const jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const payload = Array.isArray(jsonData) ? jsonData : [jsonData];

  if (payload.length > 50) {
    console.error("Error: Maximum 50 records per batch.");
    process.exit(1);
  }

  if (!skipQa && entityType !== "market_fact") {
    const ok = runQaGate(filePath, entityType);
    if (!ok) {
      console.error("\nSubmit blocked — fix mechanical QA failures first (or use --skip-qa for admin override).");
      process.exit(1);
    }
  } else if (entityType === "market_fact") {
    for (let i = 0; i < payload.length; i++) {
      const err = validateMarketFactRecord(payload[i], i);
      if (err) {
        console.error(`Error: ${err}`);
        process.exit(1);
      }
    }
  } else {
    console.warn("WARNING: --skip-qa: submitting without mechanical QA gate (admin override).");
  }

  for (let i = 0; i < payload.length; i++) {
    await submitRecord(entityType, payload[i], i);
  }
}

submitData();
