import type { UrlCheckResult } from "./types.js";

export async function checkUrl(url: string, timeoutMs: number): Promise<UrlCheckResult> {
  const started = Date.now();
  if (!url || typeof url !== "string") {
    return { url, ok: false, status: null, final_url: null, error: "empty/invalid url", latency_ms: null };
  }
  if (!/^https:\/\//i.test(url)) {
    return { url, ok: false, status: null, final_url: null, error: "not https://", latency_ms: null };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // A real browser User-Agent matters: many legitimate sites (Cloudflare/bot
  // protection) return 403 to bare, header-less requests. Without this,
  // the checker produces false-positive "dead link" flags on live sites.
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };
  try {
    let res: Response;
    try {
      res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal, headers });
      const retryGet =
        [403, 405, 406, 501].includes(res.status) ||
        (res.status === 404 && new URL(url).hostname === "img.logo.dev");
      if (retryGet) {
        res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal, headers });
      }
    } finally {
      clearTimeout(timer);
    }
    const ambiguousBlock = res.status === 403;
    return {
      url,
      ok: res.ok,
      status: res.status,
      final_url: res.url || null,
      error: res.ok ? null : ambiguousBlock
        ? `HTTP ${res.status} (may be bot-protection, not a dead link — verify manually)`
        : `HTTP ${res.status}`,
      latency_ms: Date.now() - started,
    };
  } catch (err: any) {
    return {
      url,
      ok: false,
      status: null,
      final_url: null,
      error: err?.name === "AbortError" ? `timeout after ${timeoutMs}ms` : String(err?.message || err),
      latency_ms: Date.now() - started,
    };
  }
}

export function isHardUrlFail(res?: UrlCheckResult): boolean {
  if (!res || res.ok) return false;
  if (res.status === 403 || res.status === 429 || res.status === 999) return false;
  return true;
}
