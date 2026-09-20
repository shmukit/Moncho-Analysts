/**
 * Shared env/token hygiene for analyst CLIs. Never print secrets.
 */

const PLACEHOLDER_RE =
  /your[_-].*(key|token|here)|copied_api_key|changeme|xxx+|todo_token/i;

export function stripInlineEnvComment(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  const quote = s[0] === '"' || s[0] === "'" ? s[0] : null;
  if (quote) {
    let out = "";
    for (let i = 1; i < s.length; i++) {
      if (s[i] === "\\" && i + 1 < s.length) {
        out += s[i + 1];
        i += 1;
        continue;
      }
      if (s[i] === quote) break;
      out += s[i];
    }
    return out;
  }
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "#" && (i === 0 || /\s/.test(s[i - 1]))) {
      return s.slice(0, i).trim();
    }
  }
  return s;
}

export function isPlaceholderSecret(value: string | undefined | null): boolean {
  if (!value) return true;
  const v = value.trim();
  if (!v) return true;
  return PLACEHOLDER_RE.test(v);
}

export function tokenLooksCorrupt(value: string): boolean {
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/.test(value)) return true;
  if (value.includes("#")) return true;
  return false;
}

export function redactSecrets(text: string): string {
  return text
    .replace(/([?&]token=)[^&"'\s]+/gi, "$1REDACTED")
    .replace(/(Bearer\s+)[A-Za-z0-9._\-]+/gi, "$1REDACTED")
    .replace(/(MONCHO_AUTH_TOKEN["']?\s*[:=]\s*["']?)[^"'\s]+/gi, "$1REDACTED");
}

export function placeholderTokenHelp(varName = "MONCHO_AUTH_TOKEN"): string {
  return [
    `${varName} in .env is still the README placeholder, or is empty.`,
    "Fix: open Analyst Dashboard → Settings → Developer (Workbench Access), copy the API key,",
    `paste it as ${varName}=\"...\" on its own line. Put comments on a separate line starting with #.`,
  ].join("\n");
}

export function missingTokenHelp(varName = "MONCHO_AUTH_TOKEN"): string {
  return [
    `${varName} is not set.`,
    "Create a .env in the repo root (copy .env.example) and paste the key from",
    "Analyst Dashboard → Settings → Developer (Workbench Access).",
  ].join("\n");
}

export function looksLikeSecretInField(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const v = value.trim();
  return /^(sk-|ghp_|Bearer\s|MONCHO_AUTH_TOKEN=)/i.test(v) || /^[A-Za-z0-9_-]{32,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(v);
}
