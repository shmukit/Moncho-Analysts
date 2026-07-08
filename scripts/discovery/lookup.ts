/**
 * CLI fallback when MCP is not configured.
 * Usage: npx tsx scripts/discovery/lookup.ts <resource> [--key=value ...]
 *
 * Examples:
 *   npx tsx scripts/discovery/lookup.ts coverage --sector_slug=ict-services
 *   npx tsx scripts/discovery/lookup.ts orgs --q=grameen --country=Bangladesh
 *   npx tsx scripts/discovery/lookup.ts market-facts --sector_slug=energy --mode=summary
 *   npx tsx scripts/discovery/lookup.ts hs-codes --q=6107 --level=6
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

import { formatDiscoveryApiError } from './format-api-error';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const resource = args[0];

  if (!resource) {
    console.error('Usage: lookup.ts <resource> [--key=value ...]');
    console.error(
      'Resources: taxonomy | coverage | orgs | products | pricing | needs | hs-codes | taxonomy-standards | market-facts',
    );
    process.exit(1);
  }

  const baseUrl = (process.env.MONCHO_API_URL ?? 'https://app.moncho.ai').replace(/\/$/, '');
  const token = process.env.MONCHO_AUTH_TOKEN;
  if (!token) {
    console.error('Set MONCHO_AUTH_TOKEN in your .env file');
    process.exit(1);
  }

  const params = new URLSearchParams();
  for (const arg of args.slice(1)) {
    const eq = arg.indexOf('=');
    if (eq === -1) continue;
    const rawKey = arg.startsWith('--') ? arg.slice(2, eq) : arg.slice(0, eq);
    params.set(rawKey, arg.slice(eq + 1));
  }

  const url = `${baseUrl}/api/v1/analyst/discovery/${resource}?${params.toString()}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const body = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    console.log(
      formatDiscoveryApiError(
        response.status,
        body as Parameters<typeof formatDiscoveryApiError>[1],
        response.headers.get('Retry-After'),
      ),
    );
    process.exit(1);
  }
  console.log(JSON.stringify(body, null, 2));
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
