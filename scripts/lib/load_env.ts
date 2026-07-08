import * as fs from "fs";
import * as path from "path";

/**
 * Load KEY=VALUE pairs from a .env file into process.env (without overwriting
 * values already set in the shell).
 */
export function loadEnv(envPath?: string): void {
  const candidates = [
    envPath,
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const lines = fs.readFileSync(candidate, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
    return;
  }
}
