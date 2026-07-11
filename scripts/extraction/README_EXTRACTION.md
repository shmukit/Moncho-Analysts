# Moncho Data Extraction Tools

This directory contains scripts to help analysts discover and structure organization data.

## Workflow Overview

1. **Mapping**: Run `fetch-reference-data.ts` to see current valid `sector_slug` and `segment_slug` options.
2. **Discovery**: Use `run-discovery-agent.ts` or `parse-industry-pdf.ts` to find company names and URLs.
3. **Enrichment**: Use `enrich-organization-data.ts` to automatically fill in missing details.
4. **Validation**: Use `scripts/utils/validate-analyst-data.ts` to ensure the JSON matches Moncho's requirements.
5. **Submission**: Use `scripts/submit_data.ts` to upload the data as a change request.

---

## 0. Mapping & Reference Data

Before extracting, ensure you are using the correct slugs that exist in Moncho.
```bash
npx tsx scripts/extraction/fetch-reference-data.ts
```
This will list all valid sectors and segments for your extraction scripts.

---

## 1. Agent-Based Tools (AI Required)


These tools require `OPENAI_API_KEY` and optionally `TAVILY_API_KEY`.

### Discovery Agent
Finds companies for a specific sector and segment.
```bash
npx tsx scripts/extraction/run-discovery-agent.ts --sector "EdTech" --segment "LMS" --location "Global" --out discovery_results.json
```

### Enrichment Agent
Fills missing fields (descriptions, rationales, slugs) for an existing JSON list.
```bash
npx tsx scripts/extraction/enrich-organization-data.ts my_draft_data.json enriched_results.json
```

---

## 2. Deterministic Tools (No AI Required)

### PDF Parser
Extracts potential company names from industry reports.
```bash
npx tsx scripts/extraction/parse-industry-pdf.ts report.pdf
```

### CSV Converter
Converts CSV dumps (e.g. from Apollo) to Moncho JSON format.
```bash
npx tsx scripts/extraction/csv-to-json-converter.ts data.csv
```

### Directory Scraper
Generic scraper for web directories/tables.
```bash
npx tsx scripts/extraction/scrape-directory.ts "https://example.com/directory"
```

---

## Environment Setup

Create a `.env` file in the root of this repository. **This is critical** for both API access and AI processing.

```env
# AI Extraction (Required for agents)
OPENAI_API_KEY=your_openai_key
TAVILY_API_KEY=your_tavily_key

# Moncho API Access (Required for reference data and submission)
MONCHO_API_URL=https://moncho.ai
MONCHO_AUTH_TOKEN=your_analyst_api_key
```

### How to get your MONCHO_AUTH_TOKEN:
1. Log in to [moncho.ai](https://moncho.ai).
2. Go to your **Analyst Profile**.
3. Copy your **API Key**.

Install dependencies:
```bash
cd scripts/extraction
npm install
```

