import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!TAVILY_API_KEY || !OPENAI_API_KEY) {
    console.error('Error: Please set TAVILY_API_KEY and OPENAI_API_KEY in your environment or .env file.');
    process.exit(1);
}

// Re-use the organization schema from Moncho
const OrganizationSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    website_url: z.string().url("Must be a valid URL (https://...)"),
    description: z.string().min(20, "Description must be at least 20 chars").max(500, "Description too long"),
    sector_slug: z.string().min(2),
    segment_slug: z.string().min(2),
    hq_country_slug: z.string().min(2),
    innovation_rationale: z.string().min(10, "Rationale must be descriptive"),
    market_traction_rationale: z.string().min(10, "Rationale must be descriptive"),
});

const DiscoveryResponseSchema = z.object({
    organizations: z.array(OrganizationSchema),
});

async function tavilySearch(query: string, maxResults: number = 20) {
    console.log(`🔍 Searching for: "${query}"...`);
    const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TAVILY_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
            max_results: maxResults,
            search_depth: 'advanced',
            include_raw_content: true,
        })
    });

    if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

async function main() {
    const args = process.argv.slice(2);
    const sector = args.find((_, i) => args[i - 1] === '--sector') || 'Technology';
    const segment = args.find((_, i) => args[i - 1] === '--segment') || 'SaaS';
    const location = args.find((_, i) => args[i - 1] === '--location') || 'Global';
    const outputFile = args.find((_, i) => args[i - 1] === '--out') || `discovery_${sector}_${segment}.json`.toLowerCase().replace(/\s+/g, '_');

    console.log(`🚀 Starting Discovery Agent for: Sector=${sector}, Segment=${segment}, Location=${location}`);

    try {
        const query = `Find top innovation-driven companies in the ${sector} sector and ${segment} segment based in ${location}. Focus on real businesses, not news or job listings.`;
        const searchData = await tavilySearch(query);

        console.log(`📄 Found ${searchData.results.length} search results. Extracting structured data...`);

        const { object } = await generateObject({
            model: openai('gpt-4o-mini'),
            schema: DiscoveryResponseSchema,
            prompt: `
        You are a data analyst for Moncho. Review the provided search results and extract a list of HIGH-QUALITY companies.
        
        Search Query: ${query}
        Search Results: ${JSON.stringify(searchData.results.map((r: any) => ({ url: r.url, content: r.content })))}

        CRITICAL RULES:
        1. Only include companies that are currently ACTIVE and OPERATING.
        2. EXCLUDE defunct, closed, or merged entities.
        3. EXCLUDE subdomains (e.g., blog.example.com) - focus on main domains.
        4. Descriptions must be at least 20 words, focusing on the company's core value.
        5. sector_slug and segment_slug must be lowercase, hyphenated strings (e.g., "ed-tech", "e-learning").
        6. hq_country_slug should be lowercase 2-letter ISO country codes or "global".
        
        For each company, provide:
        - name
        - website_url
        - description (20-100 words)
        - sector_slug: "${sector.toLowerCase().replace(/\s+/g, '-')}"
        - segment_slug: "${segment.toLowerCase().replace(/\s+/g, '-')}"
        - hq_country_slug
        - innovation_rationale (why is this company innovative?)
        - market_traction_rationale (evidence of market success?)
      `,
        });

        const finalPath = path.resolve(process.cwd(), outputFile);
        fs.writeFileSync(finalPath, JSON.stringify(object.organizations, null, 2));

        console.log(`✅ Success! Extracted ${object.organizations.length} organizations.`);
        console.log(`📂 Data saved to: ${finalPath}`);
        console.log(`You can now validate this with: npx tsx scripts/utils/validate-analyst-data.ts ${outputFile}`);

    } catch (error) {
        console.error('❌ Error during discovery:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
