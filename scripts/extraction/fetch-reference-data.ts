import { loadEnv } from '../lib/load_env.js';
import { isPlaceholderSecret, missingTokenHelp, placeholderTokenHelp } from '../lib/secrets_hygiene.js';

loadEnv();

const API_URL = process.env.MONCHO_API_URL || 'https://app.moncho.ai';
const AUTH_TOKEN = process.env.MONCHO_AUTH_TOKEN;

/**
 * Fetches reference taxonomy (sectors, landscapes, segments) for mapping orgs/products.
 * Uses public GET /api/reference/taxonomy (no auth). Fallback: GET /api/analyst/reference-data (requires MONCHO_AUTH_TOKEN).
 */
async function fetchReferenceData() {
    console.log(`Fetching reference taxonomy from ${API_URL}/api/reference/taxonomy ...`);

    let response = await fetch(`${API_URL}/api/reference/taxonomy`);
    let result: any;

    if (!response.ok) {
        if (AUTH_TOKEN && !isPlaceholderSecret(AUTH_TOKEN)) {
            console.log('Public taxonomy failed. Trying authenticated /api/analyst/reference-data ...');
            response = await fetch(`${API_URL}/api/analyst/reference-data`, {
                headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` },
            });
        }
    }

    result = await response.json().catch(() => ({}));

    if (!response.ok) {
        console.error(
            `Failed to fetch taxonomy from ${API_URL}/api/reference/taxonomy (${response.status} ${result?.error || response.statusText}).`,
        );
        console.error('Fix: check MONCHO_API_URL (should be https://app.moncho.ai) and your network.');
        if (!AUTH_TOKEN || isPlaceholderSecret(AUTH_TOKEN)) {
            console.error(AUTH_TOKEN ? placeholderTokenHelp() : missingTokenHelp());
        }
        process.exit(1);
    }

    console.log('\nSectors:');
    (result.sectors || []).forEach((s: any) => console.log(`   - ${s.name} (id: ${s.id}, slug: ${s.slug})`));

    console.log('\nSegments:');
    (result.segments || []).forEach((s: any) => {
        const sectorSlugs = (s.sectors || []).map((x: any) => x.slug).join(', ');
        console.log(`   - ${s.name} (id: ${s.id}, slug: ${s.slug}${sectorSlugs ? `, sectors: ${sectorSlugs}` : ''})`);
    });

    if (result.landscapes?.length) {
        console.log('\nLandscapes (sample):');
        (result.landscapes as any[]).slice(0, 15).forEach((l: any) =>
            console.log(`   - ${l.version_name} (id: ${l.id}, slug: ${l.slug}, sector: ${l.sector_slug})`)
        );
        if (result.landscapes.length > 15) console.log(`   ... and ${result.landscapes.length - 15} more`);
    }

    console.log('\nUse these ids/slugs in your extraction JSON. See skills/taxonomy_mapping.md.');
}

fetchReferenceData();
