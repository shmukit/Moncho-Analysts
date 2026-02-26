import path from 'path';
import { readFileSync, existsSync } from 'fs';

// Load .env from repo root (optional)
const envPath = path.resolve(__dirname, '../../.env');
if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
        const match = line.match(/^\s*([^#=]+)=(.*)$/);
        if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
}

const API_URL = process.env.MONCHO_API_URL || 'https://moncho.ai';
const AUTH_TOKEN = process.env.MONCHO_AUTH_TOKEN;

/**
 * Fetches reference taxonomy (sectors, landscapes, segments) for mapping orgs/products.
 * Uses public GET /api/reference/taxonomy (no auth). Fallback: GET /api/analyst/reference-data (requires MONCHO_AUTH_TOKEN).
 */
async function fetchReferenceData() {
    console.log(`🌐 Fetching reference taxonomy from ${API_URL}...`);

    // Prefer public reference taxonomy (no auth required)
    let response = await fetch(`${API_URL}/api/reference/taxonomy`);
    let result: any;

    if (!response.ok) {
        if (AUTH_TOKEN) {
            console.log('   Trying analyst reference endpoint with auth...');
            response = await fetch(`${API_URL}/api/analyst/reference-data`, {
                headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` },
            });
        }
    }

    result = await response.json().catch(() => ({}));

    if (!response.ok) {
        console.error('❌ Failed:', result?.error || response.statusText);
        if (!AUTH_TOKEN && response.status === 401) {
            console.log('💡 Tip: Set MONCHO_AUTH_TOKEN in .env to use the analyst reference endpoint as fallback.');
        }
        process.exit(1);
    }

    console.log('\n✅ Sectors:');
    (result.sectors || []).forEach((s: any) => console.log(`   - ${s.name} (id: ${s.id}, slug: ${s.slug})`));

    console.log('\n✅ Segments:');
    (result.segments || []).forEach((s: any) => {
        const sectorSlugs = (s.sectors || []).map((x: any) => x.slug).join(', ');
        console.log(`   - ${s.name} (id: ${s.id}, slug: ${s.slug}${sectorSlugs ? `, sectors: ${sectorSlugs}` : ''})`);
    });

    if (result.landscapes?.length) {
        console.log('\n✅ Landscapes (sample):');
        (result.landscapes as any[]).slice(0, 15).forEach((l: any) =>
            console.log(`   - ${l.version_name} (id: ${l.id}, slug: ${l.slug}, sector: ${l.sector_slug})`)
        );
        if (result.landscapes.length > 15) console.log(`   ... and ${result.landscapes.length - 15} more`);
    }

    console.log('\n💡 Use these ids/slugs in your extraction JSON. See skills/taxonomy_mapping.md.');
}

fetchReferenceData();
