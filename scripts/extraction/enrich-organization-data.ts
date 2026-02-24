import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error('Error: Please set OPENAI_API_KEY in your environment or .env file.');
    process.exit(1);
}

const OrganizationSchema = z.object({
    name: z.string(),
    website_url: z.string(),
    description: z.string().optional(),
    sector_slug: z.string().optional(),
    segment_slug: z.string().optional(),
    hq_country_slug: z.string().optional(),
    innovation_rationale: z.string().optional(),
    market_traction_rationale: z.string().optional(),
});

async function tavilySearch(query: string) {
    if (!TAVILY_API_KEY) return null;
    const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TAVILY_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, max_results: 5, search_depth: 'basic' })
    });
    return response.ok ? await response.json() : null;
}

async function main() {
    const args = process.argv.slice(2);
    const inputFile = args[0];
    const outputFile = args[1] || 'enriched_data.json';

    if (!inputFile) {
        console.error('Usage: npx tsx enrich-organization-data.ts <input_file.json> [output_file.json]');
        process.exit(1);
    }

    const rawData = fs.readFileSync(path.resolve(process.cwd(), inputFile), 'utf8');
    const organizations = JSON.parse(rawData) as any[];

    console.log(`💎 Enriching ${organizations.length} organizations...`);

    const enrichedOrgs = [];

    for (const org of organizations) {
        console.log(`🔍 Processing: ${org.name}...`);

        // Determine what's missing
        const isMissingData = !org.description || org.description.length < 20 || !org.innovation_rationale || !org.market_traction_rationale;

        if (!isMissingData) {
            console.log(`✅ ${org.name} already has complete data. Skipping.`);
            enrichedOrgs.push(org);
            continue;
        }

        try {
            let context = '';
            if (TAVILY_API_KEY) {
                const searchResults = await tavilySearch(`${org.name} ${org.website_url} business model innovation market share`);
                context = JSON.stringify(searchResults?.results?.map((r: any) => r.content) || []);
            }

            const { object } = await generateObject({
                model: openai('gpt-4o-mini'),
                schema: OrganizationSchema,
                prompt: `
          Research the following company and fill in the missing fields for the Moncho analyst database.
          
          Company Name: ${org.name}
          Website: ${org.website_url}
          Current Data: ${JSON.stringify(org)}
          Research Context: ${context}

          REQUIREMENTS:
          - description: 20-100 words, focusing on the company's core value.
          - innovation_rationale: Why is this company considered innovative in its space?
          - market_traction_rationale: What evidence is there of their market success (revenue, user base, funding, awards)?
          - sector_slug / segment_slug: If missing, provide lowercase-hyphenated slugs.
          - hq_country_slug: If missing, provide 2-letter ISO code.
        `,
            });

            enrichedOrgs.push({ ...org, ...object });
            console.log(`✨ Enriched ${org.name}`);
        } catch (error) {
            console.error(`❌ Failed to enrich ${org.name}:`, error);
            enrichedOrgs.push(org); // Keep original if enrichment fails
        }
    }

    fs.writeFileSync(path.resolve(process.cwd(), outputFile), JSON.stringify(enrichedOrgs, null, 2));
    console.log(`✅ Done! Enriched data saved to ${outputFile}`);
}

main();
