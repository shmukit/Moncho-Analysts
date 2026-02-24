import fs from 'fs';
import path from 'path';
import * as _pdf from 'pdf-parse';
const pdf = (_pdf as any).default || _pdf;


/**
 * PDF Industry Report Parser
 * Usage: npx tsx parse-industry-pdf.ts <report.pdf>
 */

async function main() {
    const args = process.argv.slice(2);
    const pdfPath = args[0];

    if (!pdfPath) {
        console.error('Usage: npx tsx parse-industry-pdf.ts <path_to_report.pdf>');
        process.exit(1);
    }

    const absolutePath = path.resolve(process.cwd(), pdfPath);
    if (!fs.existsSync(absolutePath)) {
        console.error(`Error: File not found at ${absolutePath}`);
        process.exit(1);
    }

    console.log(`📄 Reading PDF: ${path.basename(pdfPath)}...`);
    const dataBuffer = fs.readFileSync(absolutePath);

    try {
        const data = await pdf(dataBuffer);

        // Simple heuristic to find potential company names:
        // Capitalized words that appear near terms like "Ltd", "Inc", "Corp", or in lists.
        const text = data.text;

        console.log('🔍 Identifying potential company names...');

        // Look for patterns like "Company Name Inc." or "Company Name Ltd."
        const companyRegex = /([A-Z][a-z0-9&]+(?:\s+[A-Z][a-z0-9&]+)*)\s+(?:Inc\.|Ltd\.|Corp\.|Corporation|Limited|LLC)/g;
        const matches = new Set<string>();
        let match;

        while ((match = companyRegex.exec(text)) !== null) {
            matches.add(match[1].trim());
        }

        // Also look for bullet points that might be company names
        const bulletRegex = /^[•\-\*]\s+([A-Z][A-Za-z0-9\s&]{2,30})$/gm;
        while ((match = bulletRegex.exec(text)) !== null) {
            matches.add(match[1].trim());
        }

        const organizations = Array.from(matches).map(name => ({
            name,
            website_url: "https://", // Placeholder
            description: "Extracted from PDF report. Needs manual review.",
            sector_slug: "pending",
            segment_slug: "pending",
            hq_country_slug: "pending",
            innovation_rationale: "Extracted from industry report.",
            market_traction_rationale: "Mentioned as key player in report."
        }));

        const outputFileName = `extracted_from_${path.basename(pdfPath, '.pdf')}.json`.toLowerCase();
        fs.writeFileSync(outputFileName, JSON.stringify(organizations, null, 2));

        console.log(`✅ Success! Found ~${organizations.length} potential organizations.`);
        console.log(`📂 Draft saved to: ${outputFileName}`);
        console.log(`💡 Next step: Run this file through 'enrich-organization-data.ts' to fill details.`);

    } catch (error) {
        console.error('❌ Error parsing PDF:', error);
    }
}

main();
