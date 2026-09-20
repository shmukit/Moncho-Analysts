import * as fs from "fs";
import * as path from "path";
import { stripInlineEnvComment, tokenLooksCorrupt } from "./secrets_hygiene.js";

/**
 * Load KEY=VALUE pairs from a .env file into process.env (without overwriting
 * values already set in the shell).
 *
 * Comments: full-line `# ...` and inline `# ...` after a value are ignored.
 * Quoted values may contain `#`. Put comments on their own line if unsure.
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
    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
      const trimmed = lines[lineNo].trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = stripInlineEnvComment(trimmed.slice(eq + 1));
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
      if (
        key === "MONCHO_AUTH_TOKEN" &&
        value &&
        tokenLooksCorrupt(value)
      ) {
        console.error(
          `Invalid ${key} in ${candidate} line ${lineNo + 1}: the value still contains a comment or hidden character.`,
        );
        console.error(
          "Fix: put the token in quotes on its own line. Move any `# copied from dashboard` note to the previous line.",
        );
      }
    }
    return;
  }
}
