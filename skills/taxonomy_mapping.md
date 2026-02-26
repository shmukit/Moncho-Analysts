# Skill: Taxonomy Mapping (Sector, Landscape, Segment)

Use this skill whenever you map organizations or products to **sector**, **segment**, or **landscape**. The database only accepts **existing** taxonomy values; analysts cannot create new sectors, segments, or landscapes.

## Rule: Never Invent IDs or Slugs

- Do **not** guess `sector_id`, `segment_id`, `landscape_id`, or slugs.
- Always resolve them from the **current reference taxonomy** before writing JSON or submitting.

## How to Get Valid Taxonomy

### 1. Reference Taxonomy API (recommended)

**Endpoint (read-only, no auth):**  
`GET {MONCHO_API_URL}/api/reference/taxonomy`

**Returns:**
- `sectors`: `{ id, name, slug, description }`
- `landscapes`: `{ id, version_name, slug, status, sector_id, sector_name, sector_slug }`
- `segments`: `{ id, name, slug, description, sectors: [{ id, name, slug }] }`

Use this to:
- Populate dropdowns or autocomplete when mapping an org/product.
- Check that a sector or segment name you have in mind exists and get its `id` and `slug`.
- See which landscapes exist per sector and pick the right one.

### 2. Fetch script (local)

Run in this repo:
```bash
npx ts-node scripts/extraction/fetch-reference-data.ts
```
This prints current sectors and segments (and optionally landscapes) so you can use valid slugs/IDs in your extraction.

### 3. Analyst Dashboard

In the [Analyst Dashboard](https://moncho.ai/analyst/dashboard), use the reference/metadata views (if available) to see current sectors, landscapes, and segments. Use those exact values when mapping.

## Mapping Flow

1. **Before discovery or extraction**: Fetch reference taxonomy once (API or script).
2. **When assigning an org/product**: Choose one sector from the list, then one or more segments that belong to that sector, and (if required) one landscape for that sector.
3. **In your JSON**: Use the `id` or `slug` values from the reference response, not made-up names.

## Taxonomy Mapping Agent (Moncho backend)

The main Moncho app has a **Taxonomy Mapping Agent** that resolves discovery intent (e.g. "EdTech in Vietnam", "payment companies") to the correct `sector_id`, `segment_id`, and `landscape_id`. When running discovery workflows that call the Moncho API, the backend can return resolved taxonomy IDs so your payloads stay valid. For local IDE-only workflows, always use the Reference Taxonomy API or this skill so your mappings match the database.
