/** Shared formatter for discovery CLI scripts (mirrors MCP client output). */

export interface DiscoveryApiErrorBody {
  error?: string;
  code?: string;
  message?: string;
  limit?: string;
  retry_after_sec?: number;
}

function rateLimitGuidance(limit: string): string {
  switch (limit) {
    case 'per_day':
      return 'Daily discovery quota reached (500/day). Pause automated lookups until the quota resets.';
    case 'market_facts_per_minute':
      return 'market-facts burst limit reached (20/min). Wait, use mode=summary, or add tighter filters.';
    default:
      return 'Minute burst limit reached (60/min). Wait, then retry with narrower filters.';
  }
}

export function formatDiscoveryApiError(
  status: number,
  body: DiscoveryApiErrorBody,
  retryAfterHeader: string | null,
): string {
  const retryFromHeader = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : Number.NaN;
  const retry_after_sec = Number.isFinite(retryFromHeader)
    ? retryFromHeader
    : body.retry_after_sec;

  const lines = [
    'Moncho discovery request did not succeed.',
    `Status: ${status}`,
    `Code: ${body.code ?? (status === 429 ? 'RATE_LIMITED' : 'REQUEST_FAILED')}`,
    `Message: ${body.message ?? body.error ?? 'Request failed'}`,
  ];

  if (body.limit) lines.push(`Limit tier: ${body.limit}`);
  if (retry_after_sec != null) lines.push(`Retry after: ${retry_after_sec} seconds`);

  if (status === 429) {
    lines.push(`Guidance: ${rateLimitGuidance(body.limit ?? 'per_minute')}`);
  }

  lines.push('');
  lines.push(JSON.stringify({ ok: false, error: { status, ...body, retry_after_sec } }, null, 2));

  return lines.join('\n');
}
