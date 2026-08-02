#!/usr/bin/env node

/**
 * Backward-compatible wrapper.
 * Prefer: npm run audit:product-images -- --file <json>
 * Canonical: scripts/utils/audit-product-images.mjs
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(__dirname, "..", "utils", "audit-product-images.mjs");

console.error(
  "[deprecated] scripts/personal/audit-product-images.mjs → use npm run audit:product-images (scripts/utils/audit-product-images.mjs)"
);

const child = spawn(process.execPath, [target, ...process.argv.slice(2)], {
  stdio: "inherit",
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
