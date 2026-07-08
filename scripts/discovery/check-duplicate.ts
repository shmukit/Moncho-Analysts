/**
 * Duplicate check CLI. Run before submitting a new org or product.
 * Usage:
 *   npx tsx scripts/discovery/check-duplicate.ts organization "Acme Ltd" https://acme.com
 *   npx tsx scripts/discovery/check-duplicate.ts product "Flash Cards for Animals"
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

import { formatDiscoveryApiError } from './format-api-error';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main(): Promise<void> {
  const [entityType, entityName, websiteUrl] = process.argv.slice(2);

  if (!entityType || !entityName) {
    console.error('Usage: check-duplicate.ts <organization|product> <name> [website_url]');
    process.exit(1);
  }

  if (entityType !== 'organization' && entityType !== 'product') {
    console.error('entity_type must be "organization" or "product"');
    process.exit(1);
  }

  const baseUrl = (process.env.MONCHO_API_URL ?? 'https://app.moncho.ai').replace(/\/$/, '');
  const token = process.env.MONCHO_AUTH_TOKEN;
  if (!token) {
    console.error('Set MONCHO_AUTH_TOKEN in your .env file');
    process.exit(1);
  }

  const body = {
    entity_type: entityType,
    name: entityName,
    ...(websiteUrl ? { website_url: websiteUrl } : {}),
  };

  const response = await fetch(`${baseUrl}/api/v1/analyst/discovery/check-duplicate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const result = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    console.log(
      formatDiscoveryApiError(
        response.status,
        result as Parameters<typeof formatDiscoveryApiError>[1],
        response.headers.get('Retry-After'),
      ),
    );
    process.exit(1);
  }
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
