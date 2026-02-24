import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

/**
 * CSV to Moncho JSON Converter
 * Usage: npx tsx csv-to-json-converter.ts <data.csv>
 * 
 * Expected CSV Headers: name, website, description, sector, segment, country, innovation, traction
 */

async function main() {
    const args = process.argv.slice(2);
    const csvPath = args[0];

    if (!csvPath) {
        console.error('Usage: npx tsx csv-to-json-converter.ts <path_to_data.csv>');
        process.exit(1);
    }

    const absolutePath = path.resolve(process.cwd(), csvPath);
    if (!fs.existsSync(absolutePath)) {
        console.error(`Error: File not found at ${absolutePath}`);
        process.exit(1);
    }

    console.log(`📊 Reading CSV: ${path.basename(csvPath)}...`);
    const fileContent = fs.readFileSync(absolutePath, 'utf8');

    try {
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        const organizations = records.map((row: any) => ({
            name: row.name || row.Company || row.Organization || "Unknown",
            website_url: row.website || row.Website || row.URL || "https://",
            description: row.description || row.Description || row.About || "",
            sector_slug: (row.sector || row.Sector || "generic").toLowerCase().replace(/\s+/g, '-'),
            segment_slug: (row.segment || row.Segment || "generic").toLowerCase().replace(/\s+/g, '-'),
            hq_country_slug: (row.country || row.Country || "global").toLowerCase().slice(0, 2),
            innovation_rationale: row.innovation || row.Innovation || "Leading solution in the space.",
            market_traction_rationale: row.traction || row.Traction || "Demonstrated market adoption."
        }));

        const outputFileName = csvPath.replace('.csv', '.json');
        fs.writeFileSync(outputFileName, JSON.stringify(organizations, null, 2));

        console.log(`✅ Success! Converted ${organizations.length} rows to JSON.`);
        console.log(`📂 Output saved to: ${outputFileName}`);

    } catch (error) {
        console.error('❌ Error parsing CSV:', error);
    }
}

main();
