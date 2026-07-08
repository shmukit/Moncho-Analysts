#!/usr/bin/env node
/**
 * @deprecated Use scripts/utils/validate-analyst-data.ts (handbook path).
 * This file forwards to the canonical validator.
 */
import { spawnSync } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "utils", "validate-analyst-data.ts");
const result = spawnSync("npx", ["tsx", script, ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
});
process.exit(result.status ?? 1);
