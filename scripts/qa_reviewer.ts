#!/usr/bin/env node
/**
 * Moncho.ai — Analyst Submission QA Reviewer
 * ------------------------------------------
 * First-pass automated QA layer for analyst submissions BEFORE they reach a
 * Senior Analyst / Admin. This tool does NOT approve data and does NOT
 * fabricate verification it didn't perform. It:
 *
 *   1. Validates records against the Organization / Product schema shape.
 *   2. Actually fetches every website_url / image_url and records the real
 *      HTTP status (dead links / parked domains / timeouts = FAIL).
 *   3. Flags likely duplicates (within batch and vs. an optional DB export).
 *   4. Flags slug-format violations (must be kebab-case).
 *   5. Flags "vague" rationales that contain no verifiable fact (no number,
 *      date, %, $, or named entity) — per SCORING_STANDARDS.md guidance.
 *   6. Flags copy-pasted/boilerplate descriptions across records.
 *
 * What this tool explicitly does NOT do: confirm that a revenue figure,
 * funding round, patent, or award claim is factually true. It can only
 * confirm that a cited source URL resolves. Substantive fact-checking of
 * claims still requires a human second-source check or a separate,
 * deliberate LLM-assisted research pass (see --deep-check below) — which is
 * slower and costs API calls, by design, because that's what real
 * verification requires.
 *
 * Usage:
 *   npx tsx qa_reviewer.ts --file data/pending/2026-01-25-onboarding.json \
 *     [--type organization|product] \
 *     [--db data/exports/existing-organizations.json] \
 *     [--concurrency 20] \
 *     [--timeout 8000] \
 *     [--out data/qa-reports/]
 */

import * as path from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "./lib/load_env.js";
import { runQaReviewer } from "./qa-reviewer/run.js";

loadEnv();

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));

runQaReviewer(scriptsDir).catch((err) => {
  console.error("QA reviewer failed:", err);
  process.exit(2);
});
