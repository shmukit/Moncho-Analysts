const MARKET_FACT_TYPES = new Set([
  "production",
  "consumption",
  "monetary",
  "trade",
  "employment",
  "growth",
  "demographic",
  "investment",
  "policy",
  "technology",
  "research",
  "other",
]);

const FORBIDDEN_METRIC_KEYS = new Set(["tam_total", "product_tam", "tam", "total_tam"]);

function strField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isMarketFactRecord(record: unknown): boolean {
  if (!record || typeof record !== "object" || Array.isArray(record)) return false;
  const r = record as Record<string, unknown>;
  return r.metric_key != null && r.country != null && r.year != null;
}

export function validateMarketFactRecord(record: any, index: number): string[] {
  const errors: string[] = [];
  const label = `Record ${index + 1}`;
  const required = ["metric_key", "country", "year", "value", "unit", "source_name"] as const;
  for (const field of required) {
    if (record[field] == null || (typeof record[field] === "string" && !String(record[field]).trim())) {
      errors.push(`${label}: missing required field ${field}`);
    }
  }

  const metricKey = strField(record.metric_key).toLowerCase();
  if (metricKey && FORBIDDEN_METRIC_KEYS.has(metricKey)) {
    errors.push(
      `${label}: metric_key "${record.metric_key}" is a TAM lump, not a sizing factor. Stage production/price/ARPU/throughput instead (see skills/sizing-audit.md).`,
    );
  }

  const dimensions =
    record.dimensions != null && typeof record.dimensions === "object" && !Array.isArray(record.dimensions)
      ? record.dimensions
      : {};
  const sectorSlug = (
    strField(record.sector_slug) ||
    strField(dimensions.sector_slug) ||
    strField(dimensions.sector)
  )
    .toLowerCase()
    .replace(/\s+/g, "-");
  if (!sectorSlug) {
    errors.push(`${label}: sector_slug is required (top-level or dimensions.sector_slug)`);
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sectorSlug)) {
    errors.push(`${label}: sector_slug "${sectorSlug}" must be kebab-case (e.g. ict-services)`);
  }

  const factType = (strField(record.fact_type) || strField(dimensions.fact_type)).toLowerCase();
  if (!factType) {
    errors.push(`${label}: fact_type is required (top-level or dimensions.fact_type)`);
  } else if (!MARKET_FACT_TYPES.has(factType)) {
    errors.push(`${label}: fact_type "${factType}" is not allowed`);
  }

  const sourceUrl = strField(record.source_url);
  if (sourceUrl && !/^https:\/\//i.test(sourceUrl)) {
    errors.push(`${label}: source_url must start with https://`);
  }

  return errors;
}
