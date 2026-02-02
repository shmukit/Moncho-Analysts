import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// Define the Organization Schema
// This must match the instructions in ANALYST_INSTRUCTIONS.md
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

const AnalystFileSchema = z.array(OrganizationSchema);

async function main() {
    const filePath = process.argv[2];

    if (!filePath) {
        console.error("❌ Error: Please provide a file path.");
        console.error("Usage: npx tsx scripts/utils/validate-analyst-data.ts data/pending/your-file.json");
        process.exit(1);
    }

    const absolutePath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
        console.error(`❌ Error: File not found at ${absolutePath}`);
        process.exit(1);
    }

    console.log(`🔍 Validating ${path.basename(filePath)}...`);

    try {
        const rawData = fs.readFileSync(absolutePath, 'utf8');
        const jsonData = JSON.parse(rawData);

        // Validate Schema
        const result = AnalystFileSchema.safeParse(jsonData);

        if (!result.success) {
            console.error("❌ Validation Failed!");
            for (const err of result.error.issues) {
                console.error(`   - Item At Path ${err.path.join('.')}: ${err.message}`);
            }
            process.exit(1);
        }

        console.log(`✅ Success! ${result.data.length} organizations valid.`);

        // Optional: Log names for quick review
        result.data.forEach((org, i) => {
            console.log(`   ${i + 1}. ${org.name} (${org.hq_country_slug})`);
        });

    } catch (error) {
        console.error("❌ Error Parsing JSON:", error instanceof Error ? error.message : "Unknown error");
        process.exit(1);
    }
}

main();
