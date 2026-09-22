import * as fs from "fs";
import * as path from "path";
import { looksLikeSecretInField } from "../lib/secrets_hygiene.js";
import { isMarketFactRecord } from "../lib/validate_market_fact.js";
import {
  UUID_RE,
  idInReferenceSet,
  isKebabCase,
  isReferenceId,
  wordCount,
} from "./helpers.js";
import type { SlugSets } from "./types.js";

export function loadSlugSets(): SlugSets {
  const p = path.resolve("data/reference/taxonomy.json");
  if (!fs.existsSync(p)) return {};
  try {
    const t = JSON.parse(fs.readFileSync(p, "utf-8"));
    return {
      sectorSlugs: t.sector_slugs ? new Set(t.sector_slugs) : undefined,
      segmentSlugs: t.segment_slugs ? new Set(t.segment_slugs) : undefined,
      countrySlugs: t.country_slugs ? new Set(t.country_slugs) : undefined,
    };
  } catch {
    return {};
  }
}

/** Expand product bundle `{ products, product_media }` into flat records for QA. */
export function expandInputRecords(parsed: unknown, forcedType?: string): any[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (forcedType === "product" || Array.isArray(obj.products)) {
      const products = (obj.products as any[]) || [];
      const media = (obj.product_media as any[]) || [];
      return [
        ...products.map((p) => ({ ...p, __record_kind: "product" })),
        ...media.map((m) => ({ ...m, __record_kind: "product_media" })),
      ];
    }
  }
  return parsed ? [parsed] : [];
}

const GENERIC_PRODUCT_NAMES = new Set([
  "inverters",
  "lab tests",
  "products",
  "services",
  "kits",
  "tickets",
  "sponsorship",
]);

const AGGREGATOR_HOSTS = [
  "daraz.com",
  "amazon.",
  "price.com",
  "pricelist.",
  "alibaba.",
  "made-in-china.",
];

export function detectType(record: any): "organization" | "product" | "product_media" | "landscape" | "expert" | "market_fact" | "unknown" {
  if (record.__record_kind === "product_media") return "product_media";
  if (record.__record_kind === "product") return "product";
  if (isMarketFactRecord(record)) return "market_fact";
  if (record.product_name && record.image_url && record.group_label) return "product_media";
  if (record.product_name !== undefined) return "product";
  if (record.version_name !== undefined) return "landscape";
  if (Array.isArray(record.segments) && record.tam_data !== undefined) return "landscape";
  // Organization: website + description/sector taxonomy (slug or ID based)
  const hasOrgTaxonomy =
    record.sector_slug !== undefined ||
    record.sector_id !== undefined ||
    record.segment_slugs !== undefined ||
    record.segment_slug !== undefined;
  if (record.website_url && (record.description || hasOrgTaxonomy)) return "organization";
  if (record.sector_slug || (record.sector_id !== undefined && record.website_url)) return "organization";
  // Expert: identity/contact profile without org website+description pattern
  if (record.linkedin_url || record.title || (record.bio && !record.description)) return "expert";
  if (record.website_url || record.sector_slug) return "organization";
  return "unknown";
}

export const ORG_RATIONALE_FIELDS = [
  "innovation_rationale",
  "market_traction_rationale",
  "competitiveness_rationale",
  "product_depth_rationale",
  "social_proof_rationale",
];

export function checkTwoSourceRule(record: any): string[] {
  const errors: string[] = [];
  const hasRationales = ORG_RATIONALE_FIELDS.some((f) => record[f]);
  if (!hasRationales) return errors;
  const urls = record.source_urls;
  if (!Array.isArray(urls) || urls.length < 2) {
    errors.push(
      "two-source rule: provide `source_urls` with at least 2 independent https:// URLs (required by analyst_instructions when scoring rationales are present)",
    );
  } else {
    const valid = urls.filter((u: unknown) => typeof u === "string" && /^https:\/\//i.test(u));
    if (valid.length < 2) {
      errors.push("two-source rule: `source_urls` must contain at least 2 valid https:// URLs");
    }
  }
  return errors;
}

export function collectSecretFieldErrors(record: any): string[] {
  const errors: string[] = [];
  const walk = (value: unknown, path: string) => {
    if (typeof value === "string" && looksLikeSecretInField(value)) {
      errors.push(`${path} looks like an API key or token — never paste .env values into JSON`);
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`));
    } else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (k.startsWith("_")) continue;
        walk(v, path ? `${path}.${k}` : k);
      }
    }
  };
  walk(record, "");
  return errors;
}

function aggregatorHostWarning(url: unknown): string | null {
  if (typeof url !== "string") return null;
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (AGGREGATOR_HOSTS.some((h) => host.includes(h))) {
      return `source URL host "${host}" looks like an aggregator — use the official org/product page (P-03)`;
    }
  } catch {
    return null;
  }
  return null;
}

const ISO_COUNTRY_RE = /^[A-Z]{2}$/;

function usesIdTaxonomy(record: any): boolean {
  return record.sector_id !== undefined || record.segment_ids !== undefined;
}

function usesSlugTaxonomy(record: any): boolean {
  return (
    record.sector_slug !== undefined ||
    record.segment_slugs !== undefined ||
    record.segment_slug !== undefined ||
    record.hq_country_slug !== undefined
  );
}

const ORG_ID_FIELDS = new Set([
  "sector_id", "segment_ids", "country_id", "organization_type", "logo_url", "founded_year",
]);
const ORG_SLUG_FIELDS = new Set(["sector_slug", "segment_slugs", "segment_slug", "hq_country_slug"]);

export function validateOrganizationSchema(
  record: any,
  validSectorIds?: Set<string>,
  validSegmentIds?: Set<string>
): { errors: string[]; warnings: string[]; schema_variant: string } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!record.name || typeof record.name !== "string") errors.push("missing/invalid `name`");
  if (!record.website_url || typeof record.website_url !== "string") {
    errors.push("missing/invalid `website_url`");
  } else if (!/^https:\/\//i.test(record.website_url)) {
    errors.push("`website_url` must start with https://");
  } else if (/linkedin\.com/i.test(record.website_url)) {
    errors.push("`website_url` is a LinkedIn URL — M-06 requires the organization's own website");
  }
  if (!record.description || typeof record.description !== "string") {
    errors.push("missing `description`");
  } else {
    const wc = wordCount(record.description);
    if (wc < 20 || wc > 50) errors.push(`description word count ${wc} (expected 20-50)`);
  }

  const idTax = usesIdTaxonomy(record);
  const slugTax = usesSlugTaxonomy(record);
  if (!idTax && !slugTax) {
    errors.push(
      "missing sector taxonomy — provide either ID-based (`sector_id` + `segment_ids`) " +
        "or slug-based (`sector_slug` + `segment_slugs` / `hq_country_slug`)"
    );
  }

  // --- Slug-based taxonomy (handbook / analyst_instructions format) ---
  if (record.sector_slug) {
    if (!isKebabCase(record.sector_slug)) {
      errors.push(`sector_slug "${record.sector_slug}" is not kebab-case`);
    }
  }
  const segs: string[] = record.segment_slugs || (record.segment_slug ? [record.segment_slug] : []);
  for (const s of segs) {
    if (!isKebabCase(s)) errors.push(`segment slug "${s}" is not kebab-case`);
  }
  if (slugTax && segs.length === 0 && !record.segment_slug) {
    errors.push("missing segment taxonomy — provide `segment_slugs` or `segment_slug`");
  }
  if (record.hq_country_slug && !isKebabCase(record.hq_country_slug)) {
    errors.push(`hq_country_slug "${record.hq_country_slug}" is not kebab-case`);
  }

  // --- ID-based taxonomy (samples/organization_sample.json / dashboard format) ---
  if (record.sector_id !== undefined) {
    if (!isReferenceId(record.sector_id)) {
      errors.push(`sector_id ${JSON.stringify(record.sector_id)} must be an integer or UUID from reference taxonomy`);
    } else if (!idInReferenceSet(validSectorIds, record.sector_id)) {
      errors.push(`sector_id ${record.sector_id} not in reference sector list — looks guessed`);
    }
  }
  if (record.segment_ids !== undefined) {
    if (!Array.isArray(record.segment_ids)) {
      errors.push("`segment_ids` must be an array of reference IDs");
    } else {
      if (record.segment_ids.length === 0) errors.push("`segment_ids` must not be empty");
      record.segment_ids.forEach((id: unknown) => {
        if (!isReferenceId(id)) {
          errors.push(`segment_ids contains invalid ID: ${JSON.stringify(id)}`);
        } else if (!idInReferenceSet(validSegmentIds, id)) {
          errors.push(`segment_id ${id} not in reference segment list — looks guessed`);
        }
      });
    }
  }
  if (idTax && record.sector_id === undefined) {
    errors.push("missing `sector_id` (ID-based org schema)");
  }
  if (idTax && record.segment_ids === undefined) {
    errors.push("missing `segment_ids` (ID-based org schema)");
  }

  if (record.country_id !== undefined && !ISO_COUNTRY_RE.test(record.country_id)) {
    errors.push(`country_id "${record.country_id}" must be 2-letter ISO code (e.g. "ID")`);
  }
  if (slugTax && !record.hq_country_slug && !record.country_id) {
    warnings.push("missing country — provide `hq_country_slug` or `country_id`");
  }

  if (record.logo_url && typeof record.logo_url === "string" && !/^https:\/\//i.test(record.logo_url)) {
    errors.push("`logo_url` must start with https://");
  }

  if (record.founded_year) {
    const y = Number(record.founded_year);
    const thisYear = new Date().getFullYear();
    if (!Number.isInteger(y) || y < 1800 || y > thisYear) {
      errors.push(`founded_year ${record.founded_year} looks implausible`);
    }
  }
  if (record.id !== undefined && record.id !== null && record.__is_update !== true) {
    errors.push("`id` present but record not marked as an update (__is_update) — new records must omit id");
  }

  // SCORING_STANDARDS.md — five dimension rationales are required on org submits
  for (const field of ORG_RATIONALE_FIELDS) {
    if (!record[field]) {
      errors.push(`missing \`${field}\` (required by SCORING_STANDARDS.md)`);
    }
  }

  return {
    errors,
    warnings,
    schema_variant: idTax && slugTax ? "hybrid" : idTax ? "id-based" : slugTax ? "slug-based" : "none",
  };
}

const MEDIA_TYPES = ["logo", "product_shot", "bundle_shot"];

export function validateProductSchema(record: any): string[] {
  const errors: string[] = [];
  if (!record.product_name || typeof record.product_name !== "string") {
    errors.push("missing/invalid `product_name`");
  }
  if (record.product_description && typeof record.product_description === "string") {
    const wc = wordCount(record.product_description);
    if (wc > 80) errors.push(`product_description word count ${wc} (expected ≤80)`);
  }
  if (
    record.hs_code !== undefined &&
    record.hs_code !== null &&
    !/^\d{4,10}$/.test(String(record.hs_code))
  ) {
    errors.push(`hs_code "${record.hs_code}" does not look like a valid HS code`);
  }
  if (typeof record.product_name === "string" && GENERIC_PRODUCT_NAMES.has(record.product_name.trim().toLowerCase())) {
    errors.push(
      `product_name "${record.product_name}" is a category, not a named SKU (P-05). Use a model, test, or ticket tier name.`,
    );
  }
  const productUrl = record.source_url || record.product_url || record.metadata?.source_url;
  const agg = aggregatorHostWarning(productUrl);
  if (agg) errors.push(agg);
  return errors;
}

export function validateProductMediaSchema(record: any, productNames: Set<string>): string[] {
  const errors: string[] = [];
  if (!record.product_name && !record.product_id) {
    errors.push("product_media requires `product_name` or `product_id`");
  }
  if (record.product_name && !productNames.has(record.product_name)) {
    errors.push(`product_media references unknown product_name "${record.product_name}"`);
  }
  if (!record.group_label || typeof record.group_label !== "string") {
    errors.push("missing/invalid `group_label` on product_media");
  }
  if (!record.image_url || typeof record.image_url !== "string") {
    errors.push("missing/invalid `image_url` on product_media");
  } else if (!/^https:\/\//i.test(record.image_url)) {
    errors.push("`image_url` must start with https://");
  }
  if (record.media_type && !MEDIA_TYPES.includes(record.media_type)) {
    errors.push(`media_type must be one of: ${MEDIA_TYPES.join(", ")}`);
  }
  return errors;
}

// --- Landscape -----------------------------------------------------------
// Matches the real landscape_sample.json shape:
// { version_name, description?, sector_id, status?, data_year?, classification?,
//   segments: [{ id, name, organizations?: [{id, name}] }], tam_data?: {total_tam, cagr, year} }
const KNOWN_STATUSES = ["draft", "published", "archived", "in_review"];
const KNOWN_CLASSIFICATIONS = ["public", "private", "internal"];

export function validateLandscapeSchema(record: any, validSectorIds?: Set<string>, validSegmentIds?: Set<string>): string[] {
  const errors: string[] = [];

  if (!record.version_name || typeof record.version_name !== "string") {
    errors.push("missing/invalid `version_name`");
  }
  if (record.sector_id === undefined || record.sector_id === null) {
    errors.push("missing `sector_id` (must be a real ID from reference taxonomy, never guessed)");
  } else if (!isReferenceId(record.sector_id)) {
    errors.push(`sector_id ${JSON.stringify(record.sector_id)} must be an integer or UUID from reference taxonomy`);
  } else if (!idInReferenceSet(validSectorIds, record.sector_id)) {
    errors.push(`sector_id ${record.sector_id} not found in reference sector list — looks guessed, not looked up`);
  }
  if (record.status && !KNOWN_STATUSES.includes(record.status)) {
    errors.push(`status "${record.status}" not in known set [${KNOWN_STATUSES.join(", ")}] — confirm this is a real status value`);
  }
  if (record.classification && !KNOWN_CLASSIFICATIONS.includes(record.classification)) {
    errors.push(`classification "${record.classification}" not in known set [${KNOWN_CLASSIFICATIONS.join(", ")}] — confirm this is real`);
  }
  if (record.data_year !== undefined) {
    const y = Number(record.data_year);
    const thisYear = new Date().getFullYear();
    if (!Number.isInteger(y) || y < 2000 || y > thisYear + 1) {
      errors.push(`data_year ${record.data_year} looks implausible`);
    }
  }

  if (!Array.isArray(record.segments) || record.segments.length === 0) {
    errors.push("missing/empty `segments` array");
  } else {
    record.segments.forEach((seg: any, i: number) => {
      if (!seg.name || typeof seg.name !== "string") errors.push(`segments[${i}] missing/invalid \`name\``);
      if (seg.id === undefined || seg.id === null) {
        errors.push(`segments[${i}] missing \`id\` (must be a real segment ID, never guessed)`);
      } else if (!isReferenceId(seg.id)) {
        errors.push(`segments[${i}].id must be an integer or UUID, got ${JSON.stringify(seg.id)}`);
      } else if (!idInReferenceSet(validSegmentIds, seg.id)) {
        errors.push(`segments[${i}].id ${seg.id} not found in reference segment list — looks guessed, not looked up`);
      }
      if (Array.isArray(seg.organizations)) {
        seg.organizations.forEach((org: any, j: number) => {
          if (!org.name) errors.push(`segments[${i}].organizations[${j}] missing \`name\``);
          if (!org.id) {
            errors.push(`segments[${i}].organizations[${j}] missing \`id\``);
          } else if (!UUID_RE.test(org.id)) {
            errors.push(
              `segments[${i}].organizations[${j}].id "${org.id}" is not a real UUID — ` +
              `looks like a placeholder. Organizations must already exist in the DB ` +
              `(with a real generated UUID) before you can position them on a landscape.`
            );
          }
        });
      }
    });
  }

  if (record.tam_data) {
    const t = record.tam_data;
    if (typeof t.total_tam !== "number" || t.total_tam <= 0) {
      errors.push(`tam_data.total_tam must be a positive number, got ${JSON.stringify(t.total_tam)}`);
    }
    if (t.cagr !== undefined && (typeof t.cagr !== "number" || t.cagr < -100 || t.cagr > 500)) {
      errors.push(`tam_data.cagr ${JSON.stringify(t.cagr)} looks implausible (expected roughly -100 to 500)`);
    }
    if (t.year !== undefined) {
      const y = Number(t.year);
      const thisYear = new Date().getFullYear();
      if (!Number.isInteger(y) || y < 2000 || y > thisYear + 2) {
        errors.push(`tam_data.year ${t.year} looks implausible`);
      }
    }
  }

  return errors;
}

// --- Expert ----------------------------------------------------------------
// Matches the real expert_sample.json shape:
// { name, title?, bio?, linkedin_url?, website_url?, location?, country_id?, segment_ids?: number[] }

export function validateExpertSchema(record: any, validSegmentIds?: Set<string>): string[] {
  const errors: string[] = [];
  if (!record.name || typeof record.name !== "string") errors.push("missing/invalid `name`");

  const contactUrl = record.linkedin_url || record.website_url;
  if (!contactUrl) {
    errors.push("missing both `linkedin_url` and `website_url` — need at least one checkable identity source");
  } else {
    if (record.linkedin_url && !/^https:\/\//i.test(record.linkedin_url)) {
      errors.push("linkedin_url must be https://");
    }
    if (record.website_url && !/^https:\/\//i.test(record.website_url)) {
      errors.push("website_url must be https://");
    }
  }

  if (record.country_id !== undefined && !ISO_COUNTRY_RE.test(record.country_id)) {
    errors.push(`country_id "${record.country_id}" should be a 2-letter ISO code (e.g. "TH"), not a slug or full name`);
  }

  if (record.segment_ids !== undefined) {
    if (!Array.isArray(record.segment_ids)) {
      errors.push("`segment_ids` must be an array of reference IDs");
    } else {
      record.segment_ids.forEach((id: unknown) => {
        if (!isReferenceId(id)) {
          errors.push(`segment_ids contains an invalid ID: ${JSON.stringify(id)}`);
        } else if (!idInReferenceSet(validSegmentIds, id)) {
          errors.push(`segment_id ${id} not found in reference segment list — confirm this wasn't guessed`);
        }
      });
    }
  }

  if (record.bio) {
    const wc = wordCount(record.bio);
    if (wc < 8 || wc > 60) errors.push(`bio word count ${wc} looks off (expected ~8-60)`);
  }
  return errors;
}

export function loadSampleShape(samplePath: string): Record<string, any> | null {
  if (!samplePath || !fs.existsSync(samplePath)) return null;
  const raw = JSON.parse(fs.readFileSync(samplePath, "utf-8"));
  const sample = Array.isArray(raw) ? raw[0] : raw;
  return sample || null;
}

const ORG_SOFT_SAMPLE_FIELDS = new Set([
  ...ORG_RATIONALE_FIELDS,
  "hq_country_slug",
  "country_id",
  "founded_year",
  "logo_url",
  "organization_type",
]);

const PRODUCT_BUNDLE_KEYS = new Set(["products", "product_media"]);

export function validateAgainstSampleShape(
  record: any,
  sampleShape: Record<string, any>,
  recordType: string
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const idTax = usesIdTaxonomy(record);
  const slugTax = usesSlugTaxonomy(record);

  for (const [key, sampleVal] of Object.entries(sampleShape)) {
    if (key.startsWith("_")) continue;
    if (sampleVal === null || sampleVal === undefined) continue;

    if ((recordType === "product" || recordType === "product_media") && PRODUCT_BUNDLE_KEYS.has(key)) {
      continue;
    }

    if (recordType === "organization") {
      if (slugTax && !idTax && ORG_ID_FIELDS.has(key)) continue;
      if (idTax && !slugTax && ORG_SLUG_FIELDS.has(key)) continue;
      // Rubric / optional fields → warn only, not structural fail
      if (ORG_SOFT_SAMPLE_FIELDS.has(key)) {
        if (!(key in record) || record[key] === null || record[key] === "") {
          warnings.push(`missing field \`${key}\` (recommended per reference sample)`);
        }
        continue;
      }
    }

    if (!(key in record) || record[key] === null || record[key] === "") {
      errors.push(`missing field \`${key}\` (present in reference sample)`);
      continue;
    }
    const expectedType = Array.isArray(sampleVal) ? "array" : typeof sampleVal;
    const actualType = Array.isArray(record[key]) ? "array" : typeof record[key];
    if (expectedType !== actualType) {
      errors.push(`field \`${key}\` expected type ${expectedType}, got ${actualType}`);
    }
  }
  return { errors, warnings };
}
