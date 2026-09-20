/**
 * Duplicate check CLI. Run before submitting a new org or product.
 * Usage:
 *   npm run discovery:duplicate -- organization "Acme Ltd" https://acme.com
 *   npx tsx scripts/discovery/check-duplicate.ts product "Flash Cards for Animals"
 */
import { formatDiscoveryApiError } from './format-api-error.js';
import { parseDuplicateArgs } from '../lib/duplicate_args.js';
import { loadEnv } from '../lib/load_env.js';
import { isPlaceholderSecret, missingTokenHelp, placeholderTokenHelp } from '../lib/secrets_hygiene.js';

loadEnv();

async function main(): Promise<void> {
  const parsed = parseDuplicateArgs(process.argv);

  if (!parsed) {
    console.error('Usage: npm run discovery:duplicate -- organization "Acme Ltd" https://acme.com');
    console.error('Quote names that contain spaces. Put `--` after the npm script name so the name and URL reach the CLI.');
    process.exit(1);
  }

  const { entityType, entityName, websiteUrl } = parsed;

  if (entityType !== 'organization' && entityType !== 'product') {
    console.error('entity_type must be "organization" or "product"');
    process.exit(1);
  }

  const baseUrl = (process.env.MONCHO_API_URL ?? 'https://app.moncho.ai').replace(/\/$/, '');
  const token = process.env.MONCHO_AUTH_TOKEN;
  if (!token) {
    console.error(missingTokenHelp());
    process.exit(1);
  }
  if (isPlaceholderSecret(token)) {
    console.error(placeholderTokenHelp());
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
    if (response.status === 401) {
      console.error('Fix: paste a real Analyst API key into MONCHO_AUTH_TOKEN. The README placeholder will always 401.');
    }
    process.exit(1);
  }
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
