import fs from 'fs';
import path from 'path';

/**
 * Moncho Analyst Submission Script
 * 
 * Usage: 
 * export MONCHO_API_URL="https://moncho.ai"
 * export MONCHO_AUTH_TOKEN="your-jwt-token"
 * npx ts-node submit_data.ts --file your_data.json --type organization
 */

const API_URL = process.env.MONCHO_API_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.MONCHO_AUTH_TOKEN;

async function submitData() {
    const args = process.argv.slice(2);
    const filePathArg = args.indexOf('--file');
    const typeArg = args.indexOf('--type');

    if (filePathArg === -1 || typeArg === -1) {
        console.error('Error: Missing arguments. Use --file <path> --type <organization|metadata|landscape>');
        process.exit(1);
    }

    if (!AUTH_TOKEN) {
        console.error('Error: MONCHO_AUTH_TOKEN not set.');
        process.exit(1);
    }

    const filePath = path.resolve(args[filePathArg + 1]);
    const entityType = args[typeArg + 1];

    if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found at ${filePath}`);
        process.exit(1);
    }

    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    console.log(`Submitting ${entityType} data to ${API_URL}...`);

    try {
        const response = await fetch(`${API_URL}/api/analyst/change-requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify({
                entity_type: entityType,
                entity_id: jsonData.id || 'new', // Use ID if updating, 'new' if creating
                suggested_changes: jsonData,
                current_data: jsonData.current_data || {} // Optional if update
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Success! Change request submitted.');
            console.log('Request ID:', result.data.id);
        } else {
            console.error('❌ Failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Network error:', error);
    }
}

submitData();
