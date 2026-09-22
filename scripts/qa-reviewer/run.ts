import * as fs from "fs";
import * as path from "path";
import { validateLogoDomain } from "../lib/logo_dev.js";
import { redactSecrets } from "../lib/secrets_hygiene.js";
import { validateMarketFactRecord } from "../lib/validate_market_fact.js";
import {
  containsVaguePhrase,
  getRecordLabel,
  hasConcreteFact,
  loadIdSet,
  mapWithConcurrency,
  normalizeDomain,
  normalizeName,
  parseArgs,
  similarity,
} from "./helpers.js";
import {
  ORG_RATIONALE_FIELDS,
  checkTwoSourceRule,
  collectSecretFieldErrors,
  detectType,
  expandInputRecords,
  loadSampleShape,
  loadSlugSets,
  validateAgainstSampleShape,
  validateExpertSchema,
  validateLandscapeSchema,
  validateOrganizationSchema,
  validateProductMediaSchema,
  validateProductSchema,
} from "./schema.js";
import type { UrlCheckResult } from "./types.js";
import { checkUrl, isHardUrlFail } from "./url-check.js";

export async function runQaReviewer(scriptsDir: string) {
  const args = parseArgs(process.argv.slice(2));

  const raw = fs.readFileSync(args.file, "utf-8");
  const parsed = JSON.parse(raw);
  const records: any[] = expandInputRecords(parsed, args.type === "product" ? "product" : undefined);

  const productNames = new Set(
    records.filter((r) => detectType(r) === "product").map((r) => r.product_name as string)
  );

  let existingDb: any[] = [];
  if (args.db && fs.existsSync(args.db)) {
    const dbRaw = JSON.parse(fs.readFileSync(args.db, "utf-8"));
    existingDb = Array.isArray(dbRaw) ? dbRaw : [dbRaw];
  }

  console.log(`Loaded ${records.length} record(s) from ${args.file}`);
  if (existingDb.length) console.log(`Loaded ${existingDb.length} existing DB record(s) for dedup from ${args.db}`);

  const sampleShape = args.sample ? loadSampleShape(args.sample) : null;
  if (args.sample) {
    console.log(
      sampleShape
        ? `Cross-checking fields against reference sample ${args.sample}`
        : `--sample ${args.sample} not found or empty — skipping sample cross-check`
    );
  }
  const validSectorIds = loadIdSet(args.validSectorIds);
  const validSegmentIds = loadIdSet(args.validSegmentIds);
  const slugSets = loadSlugSets();
  if (args.validSectorIds && !validSectorIds) console.log(`--valid-sector-ids ${args.validSectorIds} not found — skipping sector_id cross-check`);
  if (args.validSegmentIds && !validSegmentIds) console.log(`--valid-segment-ids ${args.validSegmentIds} not found — skipping segment_id cross-check`);
  if (!slugSets.sectorSlugs || !slugSets.segmentSlugs) {
    console.error(
      "data/reference/taxonomy.json is missing. Look up live slugs via Discovery MCP, then run npm run reference:sync (local snapshot, not committed).",
    );
  }

  // Collect all URLs to check across the batch (dedup identical URLs to avoid re-fetching)
  const urlToCheck = new Map<string, Promise<UrlCheckResult>>();
  function scheduleCheck(url: string | undefined) {
    if (args.skipUrlCheck) return;
    if (!url) return;
    if (!urlToCheck.has(url)) {
      urlToCheck.set(url, checkUrl(url, args.timeout));
    }
  }
  for (const r of records) {
    scheduleCheck(r.website_url);
    scheduleCheck(r.linkedin_url);
    scheduleCheck(r.image_url);
    if (Array.isArray(r.logo_url)) r.logo_url.forEach(scheduleCheck);
    else scheduleCheck(r.logo_url);
    if (Array.isArray(r.product_media)) {
      for (const m of r.product_media) scheduleCheck(m.image_url);
    }
  }
  // Run with bounded concurrency
  const urls = [...urlToCheck.keys()];
  console.log(
    args.skipUrlCheck
      ? "Skipping live URL checks (--skip-url-check)."
      : `Checking ${urls.length} unique URL(s) with concurrency=${args.concurrency}...`,
  );
  const checkResults = await mapWithConcurrency(urls, args.concurrency, (u) => checkUrl(u, args.timeout));
  const urlResultMap = new Map<string, UrlCheckResult>(urls.map((u, i) => [u, checkResults[i]]));

  // Description duplicate tracking (boilerplate detector)
  const descriptionSeen = new Map<string, number>();

  const report: any[] = [];

  records.forEach((record, idx) => {
    const recordType =
      record.__record_kind === "product_media"
        ? "product_media"
        : args.type && args.type !== "auto"
          ? args.type
          : detectType(record);
    const reasons: string[] = [];
    const checks: any = {};

    // Schema validation
    let schemaErrors: string[] = [];
    let schemaWarnings: string[] = [];

    if (recordType === "organization") {
      const org = validateOrganizationSchema(record, validSectorIds, validSegmentIds);
      schemaErrors = org.errors;
      schemaWarnings = org.warnings;
      checks.schema_variant = org.schema_variant;
      if (slugSets.sectorSlugs && record.sector_slug && !slugSets.sectorSlugs.has(record.sector_slug)) {
        schemaErrors.push(`sector_slug "${record.sector_slug}" not in reference taxonomy — run npm run reference:sync and use a live slug`);
      }
      if (slugSets.segmentSlugs && record.segment_slugs) {
        for (const s of record.segment_slugs as string[]) {
          if (!slugSets.segmentSlugs!.has(s)) {
            schemaErrors.push(`segment_slug "${s}" not in reference taxonomy — run npm run reference:sync and use a live slug`);
          }
        }
      }
      if (slugSets.countrySlugs && record.hq_country_slug && !slugSets.countrySlugs.has(record.hq_country_slug)) {
        schemaWarnings.push(`hq_country_slug "${record.hq_country_slug}" not in reference taxonomy`);
      }
      if (record.logo_url && record.website_url) {
        const logoErr = validateLogoDomain(String(record.logo_url), String(record.website_url));
        if (logoErr) schemaErrors.push(logoErr);
      }
      schemaErrors.push(...checkTwoSourceRule(record));
      schemaErrors.push(...collectSecretFieldErrors(record));
    } else if (recordType === "product") {
      schemaErrors = validateProductSchema(record);
      schemaErrors.push(...collectSecretFieldErrors(record));
    } else if (recordType === "product_media") {
      schemaErrors = validateProductMediaSchema(record, productNames);
    } else if (recordType === "landscape") {
      schemaErrors = validateLandscapeSchema(record, validSectorIds, validSegmentIds);
    } else if (recordType === "expert") {
      schemaErrors = validateExpertSchema(record, validSegmentIds);
    } else if (recordType === "market_fact") {
      schemaErrors = validateMarketFactRecord(record, idx);
    } else {
      schemaErrors = ["unable to determine record type (organization/product/landscape/expert/market_fact)"];
    }

    if (sampleShape) {
      const sampleResult = validateAgainstSampleShape(record, sampleShape, recordType);
      schemaErrors.push(...sampleResult.errors);
      schemaWarnings.push(...sampleResult.warnings);
    }

    checks.schema = schemaErrors.length === 0 ? "pass" : "fail";
    reasons.push(...schemaErrors);
    if (schemaWarnings.length) {
      checks.rubric_warnings = schemaWarnings;
      reasons.push(...schemaWarnings);
    }

    // URL checks
    if (record.website_url) {
      const res = urlResultMap.get(record.website_url);
      checks.url_website = res;
      if (res && !res.ok) reasons.push(`website_url unreachable: ${res.error}`);
    }
    if (record.linkedin_url) {
      const res = urlResultMap.get(record.linkedin_url);
      checks.url_linkedin = res;
      // LinkedIn often blocks bots (403/999) — flag for manual verify, don't hard-fail
      const linkedinBlocked = res && !res.ok && (res.status === 403 || res.status === 999);
      if (res && !res.ok && !linkedinBlocked) {
        reasons.push(`linkedin_url unreachable: ${res.error}`);
      } else if (linkedinBlocked) {
        reasons.push(`linkedin_url returned HTTP ${res.status} (likely bot-protection — verify manually)`);
      }
    }
    if (record.logo_url) {
      const logos = Array.isArray(record.logo_url) ? record.logo_url : [record.logo_url];
      checks.url_logos = logos.map((u: string) => urlResultMap.get(u));
      checks.url_logos.forEach((r: UrlCheckResult | undefined) => {
        if (r && !r.ok) reasons.push(`logo_url unreachable: ${r.error}`);
      });
    }
    if (Array.isArray(record.product_media)) {
      checks.url_product_media = record.product_media.map((m: any) => urlResultMap.get(m.image_url));
      checks.url_product_media.forEach((r: UrlCheckResult | undefined, i: number) => {
        if (r && !r.ok) reasons.push(`product_media[${i}].image_url unreachable: ${r.error}`);
      });
    }
    if (recordType === "product_media" && record.image_url) {
      const res = urlResultMap.get(record.image_url);
      checks.url_image = res;
      if (res && !res.ok) reasons.push(`image_url unreachable: ${res.error}`);
    }

    // Duplicate detection (within batch + against DB export) — skip product_media rows
    let duplicateOf: string | null = null;
    if (recordType !== "product_media") {
      const normName = normalizeName(getRecordLabel(record, ""));
      const normDomain = record.website_url ? normalizeDomain(record.website_url) : null;

      const candidatePool = [
        ...records.slice(0, idx).map((r: any) => ({ source: "batch", record: r })),
        ...existingDb.map((r: any) => ({ source: "db", record: r })),
      ];
      for (const cand of candidatePool) {
        if (cand.record.__record_kind === "product_media") continue;
        const candName = normalizeName(getRecordLabel(cand.record, ""));
        const candDomain = cand.record.website_url ? normalizeDomain(cand.record.website_url) : null;
        const nameSim = similarity(normName, candName);
        const sameDomain = normDomain && candDomain && normDomain === candDomain;
        if (sameDomain || nameSim > 0.88) {
          duplicateOf = `${cand.source}:${getRecordLabel(cand.record, "unknown")}`;
          break;
        }
      }
    }
    checks.duplicate_of = duplicateOf;
    if (duplicateOf) reasons.push(`likely duplicate of ${duplicateOf}`);

    // Boilerplate / copy-paste description detector
    if (record.description) {
      const key = record.description.trim().toLowerCase();
      const seenCount = (descriptionSeen.get(key) || 0) + 1;
      descriptionSeen.set(key, seenCount);
      if (seenCount > 1) reasons.push("description identical to another record in this batch (possible copy-paste)");
    }

    // Rationale fact-density + vague-phrase checks
    checks.rationale_quality = {};
    for (const field of ORG_RATIONALE_FIELDS) {
      if (record[field]) {
        const vague = containsVaguePhrase(record[field]);
        const concrete = hasConcreteFact(record[field]);
        checks.rationale_quality[field] = concrete && !vague ? "ok" : "vague";
        if (vague) reasons.push(`${field} uses vague phrase "${vague}" with no concrete fact`);
        else if (!concrete) reasons.push(`${field} has no verifiable fact (no number/date/%/named entity)`);
      }
    }

    // Overall status
    const websiteHardDown = isHardUrlFail(checks.url_website);
    const linkedinHardDown = isHardUrlFail(checks.url_linkedin);
    const logoHardDown = Array.isArray(checks.url_logos) && checks.url_logos.some((r: UrlCheckResult | undefined) => isHardUrlFail(r));
    const imageHardDown =
      isHardUrlFail(checks.url_image) ||
      (Array.isArray(checks.url_product_media) &&
        checks.url_product_media.some((r: UrlCheckResult | undefined) => isHardUrlFail(r)));
    const hasFail =
      checks.schema === "fail" ||
      websiteHardDown ||
      linkedinHardDown ||
      logoHardDown ||
      imageHardDown ||
      duplicateOf !== null;
    const hasFlag = reasons.length > 0 && !hasFail;

    const status = hasFail ? "FAIL" : hasFlag ? "FLAGGED" : "PASS";

    report.push({
      record_id: getRecordLabel(record, `record_${idx}`),
      record_type: recordType,
      status,
      checks,
      reasons,
      requires_human_review: status !== "PASS",
    });
  });

  // Batch-level escalation check
  const failCount = report.filter((r) => r.status === "FAIL").length;
  const failRate = failCount / report.length;
  const batchWarning =
    failRate > 0.15
      ? `${(failRate * 100).toFixed(0)}% of this batch FAILed mechanical checks — escalate to a Senior Analyst conversation with the submitting analyst rather than reviewing record-by-record.`
      : null;

  // Write report
  fs.mkdirSync(args.out, { recursive: true });
  const baseName = path.basename(args.file).replace(/\.json$/, "");
  const outPath = path.join(args.out, `${baseName}-qa-report.json`);
  fs.writeFileSync(
    outPath,
    redactSecrets(
      JSON.stringify({ file: args.file, generated_at: new Date().toISOString(), batch_warning: batchWarning, summary: {
      total: report.length,
      pass: report.filter(r => r.status === "PASS").length,
      flagged: report.filter(r => r.status === "FLAGGED").length,
      fail: report.filter(r => r.status === "FAIL").length,
    }, records: report }, null, 2),
    ) + "\n",
  );

  // Console summary
  console.log("\n=== QA SUMMARY ===");
  console.log(`PASS:    ${report.filter(r => r.status === "PASS").length}`);
  console.log(`FLAGGED: ${report.filter(r => r.status === "FLAGGED").length}`);
  console.log(`FAIL:    ${report.filter(r => r.status === "FAIL").length}`);
  if (batchWarning) console.log(`\n${batchWarning}`);
  console.log(`\nFull report written to ${outPath}`);

  for (const r of report) {
    if (r.status !== "PASS") {
      console.log(`\n[${r.status}] ${r.record_id}`);
      r.reasons.forEach((reason: string) => console.log(`   - ${reason}`));
    }
  }

  if (args.deepCheck) {
    console.log("\n--deep-check requested: handing off to deep_fact_check.ts for claim-level verification...");
    const { execFileSync } = await import("child_process");
    try {
      execFileSync(
        process.platform === "win32" ? "npx.cmd" : "npx",
        [
          "tsx",
          path.join(scriptsDir, "deep_fact_check.ts"),
          "--file", args.file,
          "--report", outPath,
          "--out", args.out,
        ],
        { stdio: "inherit", shell: process.platform === "win32" }
      );
    } catch (err) {
      console.error("deep_fact_check.ts exited with errors (see above). Mechanical QA report is still valid at:", outPath);
    }
  }

  process.exit(report.some(r => r.status === "FAIL") ? 1 : 0);
}
