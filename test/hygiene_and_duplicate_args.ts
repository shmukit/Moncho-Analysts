#!/usr/bin/env npx tsx
import { parseDuplicateArgs } from "../scripts/lib/duplicate_args.js";
import {
  isPlaceholderSecret,
  redactSecrets,
  stripInlineEnvComment,
  tokenLooksCorrupt,
} from "../scripts/lib/secrets_hygiene.js";

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error(msg);
    process.exit(1);
  }
}

assert(stripInlineEnvComment('"abc123" # copied from dashboard') === "abc123", "quoted token + inline comment");
assert(stripInlineEnvComment("abc123 # copied") === "abc123", "unquoted token + inline comment");
assert(stripInlineEnvComment('"value with # hash"') === "value with # hash", "hash inside quotes");
assert(isPlaceholderSecret("your_copied_api_key_here"), "readme placeholder");
assert(!isPlaceholderSecret("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb"), "jwt-shaped token is not placeholder");
assert(tokenLooksCorrupt("abc#copied"), "hash leftover is corrupt");
assert(redactSecrets("https://img.logo.dev/acme.com?token=secret123").includes("token=REDACTED"), "logo token redacted");
assert(!redactSecrets("Bearer abc.def.ghi").includes("abc.def"), "bearer redacted");

const joined = parseDuplicateArgs([
  "node",
  "check-duplicate.ts",
  "organization",
  "Test",
  "Co",
  "https://example.com",
]);
assert(joined?.entityName === "Test Co", `join name, got ${joined?.entityName}`);
assert(joined?.websiteUrl === "https://example.com", "keep url");

const dotted = parseDuplicateArgs(["node", "cli", "organization", "Grameenphone.", "https://www.grameenphone.com"]);
assert(dotted?.entityName === "Grameenphone.", "preserve trailing period in CLI name");

console.log("PASS secrets hygiene + duplicate argv parsing");
