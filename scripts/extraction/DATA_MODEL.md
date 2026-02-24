# Moncho Data Model for Analysts

Data extracted by these scripts is submitted as a **Change Request**. This staged data is eventually reviewed and merged into the main database.

## Target Tables

### 1. `metadata_organization`
This is the main table for companies.
- `name`: Legal or common name of the company.
- `website_url`: Main domain (e.g., `https://example.com`).
- `description`: 20-500 word summary of what the company does.

### 2. `change_requests`
When you submit data via `submit_data.ts`, it enters this staging table.
- `entity_type`: Set to `'organization'`.
- `data_payload`: Contains the raw JSON you generated.

## JSON Mapping Guide

| JSON Field | DB Destination | Notes |
|------------|----------------|-------|
| `name` | `metadata_organization.name` | |
| `website_url` | `metadata_organization.website_url` | Must be a valid URL. |
| `description` | `metadata_organization.description` | Minimum 20 characters. |
| `sector_slug` | `metadata_sector.slug` | **Must exist.** Use `fetch-reference-data.ts`. |
| `segment_slug` | `segments.slug` | **Must exist.** Use `fetch-reference-data.ts`. |
| `hq_country_slug` | `countries.slug` (derived) | Use lowercase 2-letter code. |
| `innovation_rationale` | `product_metrics.metadata` | Explains the "why" behind the company. |
| `market_traction_rationale` | `product_metrics.metadata` | Evidence of market success. |


## Why Rationale Matters
Moncho is not just a list of companies; it's an intelligence platform. The **Rationales** you generate are used to build the narratives that help entrepreneurs and investors understand the market landscape. 

High-quality rationales should cite:
- Specific technologies or business models (Innovation).
- Known customers, revenue bands, or market share indicators (Traction).
