# Skill: PDF Parsing & Table Extraction

Use when you need **structured tables or market facts from statistical PDFs** (education yearbooks, HIES, DGDA reports, etc.).

You do **not** run database harvest CLIs. Those stay with the founder / data team.

## 1. When to Use This

- **Source**: Official statistical reports (BANBEIS, BBS, DGDA, etc.) as PDF.
- **Goal**: Get machine-readable tables instead of manual copy-paste.
- **Your job**: Prepare the request + descriptor; founder runs extraction and returns JSON tables or seeded facts.

## 2. What You Prepare

Send the founder:

1. PDF path or download URL  
2. A short report descriptor:

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

Common profiles (founder picks the match):

| Profile             | Report type              | Typical use |
|---------------------|--------------------------|-------------|
| `BANBEIS_EDU_STATS` | Education statistics     | Students, institutions |
| `BBS_HIES`          | Household income/expense | Households, income |
| `DGDA_PHARMACIES`   | Pharmacies / outlets     | Outlets, beds |
| `ICII_INSURANCE`    | Insurance                | Premiums, penetration |

## 3. What You Get Back

Extraction JSON usually has:

- **report**: country, title, year, url, etc.
- **tables**: `{ id, header[], rows[][], caption?, pageNumber? }`

Use those tables for research notes or for drafting org/product / fact JSON that matches `samples/`. Submit via change request or hand the file to founder — do not expect harvest scripts in this workbench.

## 4. Day-to-day data access

For coverage of orgs, products, and sectors: use the [Analyst Dashboard](https://app.moncho.ai/analyst/dashboard), not CLIs.
