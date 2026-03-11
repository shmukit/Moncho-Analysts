## Skill: Extraction Toolkit (Discovery & Enrichment)

Use this skill to choose the **right tool** for getting organization data into Moncho JSON, depending on your starting point (PDF, directory, CSV, or blank search).

---

### 1. Overview of tools

All scripts live under `scripts/extraction/` in this repo:

- `fetch-reference-data.ts` – Print current sectors, segments, and (optionally) landscapes.
- `run-discovery-agent.ts` – AI-assisted discovery of organizations for a sector/segment/location.
- `parse-industry-pdf.ts` – Extract candidate organization names from industry PDFs.
- `scrape-directory.ts` – Scrape organizations from online directories/tables.
- `csv-to-json-converter.ts` – Convert CSV lists (e.g. Apollo exports) into Moncho JSON skeletons.
- `enrich-organization-data.ts` – Fill in missing fields (descriptions, rationales, slugs) in existing JSON.

---

### 2. Decision guide: which tool to use?

**You have an industry PDF (market report, conference list, etc.)**
- Goal: Extract company names and URLs from the PDF.
- Tool sequence:
  1. Run:
     ```bash
     npx tsx scripts/extraction/parse-industry-pdf.ts path/to/report.pdf
     ```
  2. Clean up the output (remove obvious non-companies).
  3. Optionally run `enrich-organization-data.ts` on the result to fill in missing details.

**You have a web directory or table**
- Goal: Extract an organization list from a URL.
- Tool sequence:
  1. Run:
     ```bash
     npx tsx scripts/extraction/scrape-directory.ts "https://example.com/directory"
     ```
  2. Inspect the JSON and adjust scraping selectors if needed (see script docs).
  3. Optionally pass the output into `enrich-organization-data.ts`.

**You have no list yet (blank discovery for a segment/region)**
- Goal: Discover organizations from scratch using AI + web search.
- Tool sequence:
  1. Run:
     ```bash
     npx tsx scripts/extraction/run-discovery-agent.ts \
       --sector "EdTech" \
       --segment "LMS" \
       --location "Global" \
       --out discovery_results.json
     ```
  2. Review the results; remove duplicates or off-scope entries.
  3. Optionally run `enrich-organization-data.ts` on `discovery_results.json`.

**You have a CSV export (e.g. from Apollo or a directory)**
- Goal: Convert CSV to Moncho JSON.
- Tool sequence:
  1. Run:
     ```bash
     npx tsx scripts/extraction/csv-to-json-converter.ts path/to/data.csv
     ```
  2. Inspect the generated JSON (field mapping is documented in `DATA_MODEL.md`).
  3. Optionally chain into `enrich-organization-data.ts` for better descriptions/rationales.

**You already have a rough JSON list but it’s incomplete**
- Goal: Improve quality without re-scraping.
- Tool:
  - Run:
    ```bash
    npx tsx scripts/extraction/enrich-organization-data.ts input.json output.enriched.json
    ```
  - Review enriched fields; spot-check for hallucinations and fix as needed.

---

### 3. How this fits into the full pipeline

1. **Mapping & taxonomy**  
   - Use `fetch-reference-data.ts` (and `taxonomy_mapping.md`) to ensure you’re using valid `sector_slug` / `segment_slug`.
2. **Extraction (this skill)**  
   - Choose the right combination of PDF/directory/CSV/discovery tools based on your source.
   - Normalize everything into JSON shaped like `samples/organization_sample.json`.
3. **Enrichment (optional but recommended)**  
   - Use `enrich-organization-data.ts` to upgrade descriptions and rationales.
4. **Validation & submission**  
   - Switch to the `validation_submission.md` skill:
     - Run the validation script.
     - Fix any issues.
     - Submit via `scripts/submit_data.ts`.

---

### 4. Environment expectations

Before running any of these tools, make sure your `.env` includes:

```env
# AI Extraction (for agent-based tools)
OPENAI_API_KEY=your_openai_key
TAVILY_API_KEY=your_tavily_key

# Moncho API (for reference data and submission)
MONCHO_API_URL=https://moncho.ai
MONCHO_AUTH_TOKEN=your_analyst_api_key
```

Then install dependencies:

```bash
cd scripts/extraction
npm install
```

---

### 5. Analyst vs Admin responsibilities (for these tools)

- **Analyst can:**
  - Run all of the extraction scripts locally in this repo.
  - Clean and adjust outputs to match the JSON schemas.
  - Chain extraction → enrichment → validation → submission.
- **Admin/Core team can:**
  - Change how the scripts work, update data models, or add new pipelines.
  - Run heavier backend harvesting (e.g. Statistical Memory Layer, MinerU-based flows in Moncho-V1).
  - Approve or reject submitted change requests and push data to production.

