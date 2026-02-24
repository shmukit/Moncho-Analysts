import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const API_URL = process.env.MONCHO_API_URL || 'https://moncho.ai';
const AUTH_TOKEN = process.env.MONCHO_AUTH_TOKEN;

async function fetchReferenceData() {
    if (!AUTH_TOKEN) {
        console.error('Error: MONCHO_AUTH_TOKEN (API Key) not set in .env');
        process.exit(1);
    }

    console.log(`🌐 Fetching reference data from ${API_URL}...`);

    try {
        const response = await fetch(`${API_URL}/api/analyst/reference-data`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            console.log('\n✅ Sectors:');
            result.sectors.forEach((s: any) => console.log(` - ${s.name} (slug: ${s.slug})`));

            console.log('\n✅ Segments:');
            result.segments.forEach((s: any) => console.log(` - ${s.name} (slug: ${s.slug})`));

            console.log('\n💡 Use these slugs in your extraction scripts or CSV files.');
        } else {
            console.error('❌ Failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Network error:', error);
    }
}

fetchReferenceData();
