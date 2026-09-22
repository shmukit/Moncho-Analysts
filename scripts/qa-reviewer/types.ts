export type Args = {
  file: string;
  type?: "organization" | "product" | "landscape" | "expert" | "market_fact" | "auto";
  db?: string;
  sample?: string;
  validSectorIds?: string;
  validSegmentIds?: string;
  concurrency: number;
  timeout: number;
  out: string;
  deepCheck: boolean;
  skipUrlCheck: boolean;
};

export type UrlCheckResult = {
  url: string;
  ok: boolean;
  status: number | null;
  final_url: string | null;
  error: string | null;
  latency_ms: number | null;
};

export type SlugSets = {
  sectorSlugs?: Set<string>;
  segmentSlugs?: Set<string>;
  countrySlugs?: Set<string>;
};
