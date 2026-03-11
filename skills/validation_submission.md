## Skill: Validation & Submission Workflow

Use this skill **every time** you are about to submit data. It turns “validate then submit” into a repeatable ritual so you never ship malformed or mis-mapped JSON.

---

### 1. When to use this skill

- After you have a draft JSON file matching one of the `samples/*.json` schemas.
- Before **every** call to `scripts/submit_data.ts`.
- When fixing feedback from reviewers about bad fields, missing slugs, or broken URLs.

---

### 2. File shape & naming

- **Top-level shape**:  
  - Either **one object** or an **array of objects**.  
  - Each object becomes its own change request.
- **Schema**: Must follow the matching sample in `samples/` (e.g. `organization_sample.json`).
- **IDs**:
  - **New records**: Omit `id` (system generates one).
  - **Updates**: Include the existing `id` from the database.
- **Naming convention** (recommended):  
  - `data/pending/YYYY-MM-DD-topic-YOURNAME.json`

---

### 3. Validation workflow (local checks)

Always validate **before** submitting:

```bash
npx ts-node scripts/validate_data.ts path/to/your-file.json
```

**What validation does:**
- Confirms required fields are present.
- Checks formats (e.g. `website_url` is a valid `https://` URL).
- Enforces minimum description/rationale lengths.
- Ensures slugs/IDs exist where required (if the script encodes those checks).

If validation fails:
- Read the error messages line by line.
- Fix the JSON (field name, type, length, or missing value).
- Re-run the validation command until it passes.

---

### 4. Taxonomy & reference checks

Before or during validation, confirm that:

- `sector_slug` and `segment_slug` come from **current taxonomy**, not guesses.
- If you are unsure:
  - Run `scripts/extraction/fetch-reference-data.ts` **or**
  - Use the `taxonomy_mapping.md` skill and the Analyst Dashboard reference views.

If a slug or ID is missing in the reference data:
- Do **not** invent it.
- Leave the field empty (if allowed) or flag it for the core team.

---

### 5. Submission workflow (change requests)

After validation passes and taxonomy is correct, submit via:

```bash
npx ts-node scripts/submit_data.ts --file path/to/your-file.json --type organization
```

Adjust `--type` as needed (`organization`, `landscape`, `expert`, etc.) based on the documented API.

**Submission rules:**
- Do not batch unrelated sectors into the same file if it confuses review; keep files coherent.
- Never submit a file that has not passed validation.
- Make sure your `.env` has valid `MONCHO_API_URL` and `MONCHO_AUTH_TOKEN`.

---

### 6. Analyst vs Admin responsibilities (for this flow)

- **Analyst can:**
  - Create and edit JSON files following the schemas.
  - Run validation and fix all reported issues.
  - Submit change requests via `scripts/submit_data.ts`.
- **Admin/Core team can:**
  - Change validation rules and schemas.
  - Approve or reject change requests in staging.
  - Apply data to production tables and adjust infrastructure.

---

### 7. Checklist (copy-paste friendly)

```markdown
Validation & Submission Checklist
- [ ] JSON matches the correct sample schema in `samples/`
- [ ] `sector_slug` / `segment_slug` come from reference taxonomy
- [ ] All required URLs are valid `https://...`
- [ ] Descriptions and rationales meet length and quality guidelines
- [ ] `npx ts-node scripts/validate_data.ts <file>` passes
- [ ] `.env` has MONCHO_API_URL and MONCHO_AUTH_TOKEN set
- [ ] File path and name follow the team convention
- [ ] Submitted with `scripts/submit_data.ts` using the correct `--type`
```

