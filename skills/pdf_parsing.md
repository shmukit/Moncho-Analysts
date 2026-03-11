# Skill: PDF Parsing & Table Extraction

Use when an analyst needs **structured tables or market facts from statistical PDFs** (education yearbooks, HIES, DGDA reports, insurance profiles). The Moncho pipeline turns PDFs into JSON tables and optionally into SML facts.

## 1. When to Use This

- **Source**: Official statistical reports (BANBEIS, BBS, DGDA, ICII, WHO, etc.) as PDF.
- **Goal**: Get machine-readable tables (headers + rows) or normalized market facts instead of manual copy-paste.
- **Output**: Either raw extraction JSON (`report` + `tables[]`) or rows in `market_facts` (SML) after normalization.

## 2. How to Run Extraction (Moncho-V1)

If you have access to the main Moncho repo (`Moncho-V1`):

```bash
# From project root — pick profile to match the PDF's sector
npm run harvest -- --pdf path/to/report.pdf --profile PROFILE_ID

# Examples
npm run harvest -- --pdf sample-data/Bangladesh-Education-Fact-Sheets_V7.pdf --profile BANBEIS_EDU_STATS
npm run harvest -- --pdf path/to/bbs.pdf --profile BBS_HIES
npm run harvest -- --pdf path/to/report.pdf --profile ICII_INSURANCE --source-url "https://example.com/report.pdf"
```

**Custom report (different country/publisher):** use a report descriptor file:

```bash
npm run harvest -- --pdf path/to/report.pdf --report path/to/report.json
```

**Debug:** add `--debug` to see per-table accept/reject reasons.

**Prerequisites:** Python 3.10+, MinerU (`uv pip install -U "mineru[all]"` or use `scripts/harvesting/setup_venv.sh`). See `scripts/harvesting/README.md` in Moncho-V1.

## 3. Available Profiles

| Profile             | Report type              | Typical country | Metric examples                    |
|---------------------|--------------------------|-----------------|------------------------------------|
| `BANBEIS_EDU_STATS` | Education statistics     | Bangladesh      | students_total, institutions_total |
| `BBS_HIES`          | Household income/expense | Bangladesh      | households, median_household_income_usd |
| `DGDA_PHARMACIES`   | Pharmacies / outlets     | Bangladesh      | pharmacy_outlets, hospital_beds    |
| `ICII_INSURANCE`    | Insurance (premium, etc.) | Set via --report | insurance penetration, premiums    |

For a different country or publisher, use `--report path/to/report.json` with the same `extraction_profile_id` as the profile (e.g. `ICII_INSURANCE_V2024`).

## 4. Report Descriptor (for custom or requested runs)

When requesting extraction from the data team or using `--report`, provide a JSON like:

```json
{
  "country": "Bangladesh",
  "iso_code": "BD",
  "publisher": "BANBEIS",
  "title": "Bangladesh Education Statistics 2025",
  "year": 2025,
  "url": "https://banbeis.gov.bd/...",
  "extraction_profile_id": "BANBEIS_EDU_STATS_V2025"
}
```

Required: `country`, `title`, `year`, `url`, `extraction_profile_id`. Optional: `iso_code`, `publisher`.

## 5. Extraction Output Shape

The pipeline writes a JSON file next to the PDF (e.g. `report_sml_extraction.json`) with:

- **report**: Same as report descriptor (country, title, year, url, etc.).
- **tables**: Array of `{ id, header[], rows[][], caption?, pageNumber?, section_path? }`.

Use this to:
- Interpret shared extraction files.
- Map specific tables/columns to your analysis or to SML facts (the pipeline can also upsert into `market_facts` when a normalizer exists for the profile).

## 6. If You Only Have the Analyst Repo

- **Prepare a report descriptor** (see §4) and the PDF path; request extraction from the data team or run the pipeline in Moncho-V1 when you have access.
- **When given an extraction JSON**: Use the `report` and `tables` structure to pull out the numbers you need; align with the schemas in `samples/` or with SML fact shape if you are feeding market sizing.

Full pipeline details (filter pipeline, profiles, normalizers): see **Moncho-V1** `docs/04-ai-and-agents/PDF_INGESTION_PIPELINE.md`.
