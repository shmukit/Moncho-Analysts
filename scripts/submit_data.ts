import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { loadEnv } from "./lib/load_env.js";
import {
  isPlaceholderSecret,
  missingTokenHelp,
  placeholderTokenHelp,
  tokenLooksCorrupt,
} from "./lib/secrets_hygiene.js";
import { validateMarketFactRecord } from "./lib/validate_market_fact.js";

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
            const errText = result.error || result.message || JSON.stringify(result);
            console.error(`Failed for record #${index + 1}: ${errText}`);
            if (response.status === 401) {
                console.error(isPlaceholderSecret(AUTH_TOKEN) ? placeholderTokenHelp() : "The API rejected this token. Regenerate it at Analyst Dashboard → Settings → Developer and update MONCHO_AUTH_TOKEN in .env.");
            }
            if (result.code === 'SUBMISSION_CAP_REACHED') {
                console.error('Hint: trial ended — ask founder for earned access or get one submission approved and applied.');
            }
        }
    } catch (error) {
        console.error(`Network error for record #${index + 1}:`, error);
    }
}

function firstMarketFactError(record: any, index: number): string | null {
    const errors = validateMarketFactRecord(record, index);
    return errors[0] ?? null;
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
    console.error("Missing --file and/or --type.");
    console.error("Example: npm run submit -- --file data/pending/orgs.json --type organization");
    console.error("Types: organization | product | market_fact | landscape | expert");
    process.exit(1);
  }

  const filePath = path.resolve(args[filePathArg + 1]);
  const entityType = args[typeArg + 1];

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    console.error(`Looked from current directory: ${process.cwd()}`);
    console.error("Fix: pass a path relative to the repo root, e.g. samples/product_sample.json");
    process.exit(1);
  }

  let jsonData: unknown;
  try {
    jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Could not parse JSON in ${filePath}: ${message}`);
    console.error("Fix: remove comments (// or /* */), trailing commas, and unquoted keys. JSON cannot contain those.");
    process.exit(1);
  }
  const payload = Array.isArray(jsonData) ? jsonData : [jsonData];

  if (payload.length > 50) {
    console.error("Error: Maximum 50 records per batch. Split the file and submit again.");
    process.exit(1);
  }

  if (!AUTH_TOKEN) {
    console.error(missingTokenHelp());
    process.exit(1);
  }
  if (isPlaceholderSecret(AUTH_TOKEN)) {
    console.error(placeholderTokenHelp());
    process.exit(1);
  }
  if (tokenLooksCorrupt(AUTH_TOKEN)) {
    console.error("MONCHO_AUTH_TOKEN still contains a # comment or a hidden character.");
    console.error("Fix: put the token on its own line in .env. Move notes like `# copied from dashboard` to the previous line.");
    process.exit(1);
  }

  if (!skipQa) {
    const ok = runQaGate(filePath, entityType);
    if (!ok) {
      console.error("\nSubmit blocked — fix mechanical QA failures first (or use --skip-qa for admin override).");
      process.exit(1);
    }
  } else {
    console.warn("WARNING: --skip-qa: submitting without mechanical QA gate (admin override).");
  }

  if (entityType === "market_fact") {
    for (let i = 0; i < payload.length; i++) {
      const err = firstMarketFactError(payload[i], i);
      if (err) {
        console.error(`Error: ${err}`);
        process.exit(1);
      }
    }
  }

  for (let i = 0; i < payload.length; i++) {
    await submitRecord(entityType, payload[i], i);
  }
}

submitData();
