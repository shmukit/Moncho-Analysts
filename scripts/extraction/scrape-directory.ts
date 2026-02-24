import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Generic Directory Scraper
 * Usage: npx tsx scrape-directory.ts <URL>
 * 
 * Note: This is a template. Analysts may need to adjust the selectors 
 * (e.g., 'a.company-link') based on the specific directory structure.
 */

const SELECTORS = {
    ITEM: 'tr', // Selector for the row or container of a company
    NAME: 'td:nth-child(1)', // Selector for name within ITEM
    URL: 'td:nth-child(2) a', // Selector for website URL
    DESCRIPTION: 'td:nth-child(3)' // Selector for description
};

async function main() {
    const args = process.argv.slice(2);
    const targetUrl = args[0];

    if (!targetUrl) {
        console.error('Usage: npx tsx scrape-directory.ts <URL>');
        process.exit(1);
    }

    console.log(`🌐 Scraping directory: ${targetUrl}...`);

    try {
        const { data } = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (MonchoDataAnalyst; +https://moncho.ai)'
            }
        });

        const $ = cheerio.load(data);
        const organizations: any[] = [];

        $(SELECTORS.ITEM).each((i, el) => {
            const name = $(el).find(SELECTORS.NAME).text().trim();
            const website_url = $(el).find(SELECTORS.URL).attr('href') ||
                $(el).find(SELECTORS.URL).text().trim() ||
                "https://";
            const description = $(el).find(SELECTORS.DESCRIPTION).text().trim();

            if (name && name.length > 1) {
                organizations.push({
                    name,
                    website_url: website_url.startsWith('http') ? website_url : `https://${website_url}`,
                    description: description || "Scraped from directory.",
                    sector_slug: "pending",
                    segment_slug: "pending",
                    hq_country_slug: "pending",
                    innovation_rationale: "Found in industry directory.",
                    market_traction_rationale: "Included in listed directory."
                });
            }
        });

        const outputFileName = `scraped_${new URL(targetUrl).hostname.replace(/\./g, '_')}.json`;
        fs.writeFileSync(outputFileName, JSON.stringify(organizations, null, 2));

        console.log(`✅ Success! Scraped ${organizations.length} organizations.`);
        console.log(`📂 Draft saved to: ${outputFileName}`);
        console.log(`💡 Reminder: Adjust SELECTORS in the script if the output looks empty or incorrect.`);

    } catch (error) {
        console.error('❌ Error scraping directory:', error instanceof Error ? error.message : error);
    }
}

main();
