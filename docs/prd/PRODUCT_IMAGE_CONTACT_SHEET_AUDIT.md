# PRD: Product Image Contact-Sheet Audit

**Status:** v1  
**Audience:** Moncho analysts, IDE agents, Data Operations  
**Related:** [`skills/product_image_audit.md`](../../skills/product_image_audit.md) · [`scripts/utils/audit-product-images.mjs`](../../scripts/utils/audit-product-images.mjs)

---

## 1. Context

Mechanical product QA proves that a `product_shot` URL is reachable and returns `image/*`. It does **not** prove that the pixels show a product. Live stock photos, portraits, nature scenes, logos, certificates, and decorative hero banners still pass HTTP checks and have slipped into submitted `product_media` (documented in `docs/WHAT_NOT_TO_DO_DATA_FETCHING.md` C13/C22/C23).

Analysts need a **free, local, sector-agnostic** way to scan every product shot in a batch and omit bad media before submit. The contact-sheet workflow proven on energy product batches is the answer: download shots, run deterministic triage flags, open a thumbnail grid, mark Keep/Omit, then edit pending JSON (remove media only).

**Goals**

- Ship an employer-owned CLI and analyst skill usable for any sector.
- Default path requires no paid APIs and no package.json AI dependencies.
- Keep the tool standalone (do not fold into `scripts/qa_agent.ts`).

**Non-goals (v1)**

- Paid cloud vision APIs.
- Auto-deleting products or media from the input file.
- Auto-applying Omit decisions back into JSON (export JSON only; analyst/agent edits pending).
- CMS UI.
- Changing Stage 1 mechanical QA inside `qa_agent.ts`.

---

## 2. User flow

1. Analyst finishes a product harvest with `products` + `product_media` rows (`media_type: product_shot`), matching `samples/product_sample.json`.
2. Run the audit:
   ```bash
   npm run audit:product-images -- --file data/pending/<products>.json
   ```
   Optional local CLIP: add `--clip` (after `npm install --no-save @huggingface/transformers`).
3. Open `data/qa-reports/<file-stem>-image-audit/contact-sheet.html` in a browser.
4. Visually review every thumbnail at least once. Prioritize cards marked `flag` or `review`. Mark **Omit** when no identifiable product, interface, installed system, or concrete service deliverable is visible; mark **Keep** when it is. Decisions persist in the browser and can be exported as JSON.
5. Edit the pending products JSON: remove only the omitted `product_shot` rows. Never drop an otherwise valid product.
6. Re-run the audit after corrections, then run normal mechanical product QA (`validate-analyst-data` / `qa_agent` for `--type product`) before submit.

---

## 3. Core Functionality

### Input

- Products JSON: `{ products: [...], product_media: [...] }` or a flat array of media rows.
- Audits rows where `media_type === "product_shot"`.

### Tier 0 (default, free, deterministic)

- Download each shot into a local `assets/` folder for a reliable contact sheet.
- Flag known stock-image hosts (Unsplash, Pexels, etc.).
- Flag URL/path signals for people, nature, stock, logos, and decorative assets (hero, banner, certificate, etc.).
- Flag opaque filenames, unreachable/non-image responses, tiny files, low resolution, extreme banner ratios.
- Flag duplicate URLs and byte-identical images (stricter when cross-org).
- Flag service / advisory / software offerings for mandatory visual confirmation.
- Sector-agnostic by default: no energy-only product-token list required. Optional `--terms-file <json>` adds sector token packs (`product_terms`, extra deny/decorative terms) when a sector wants them.

### Contact sheet

- Local HTML grid: thumbnail, product name, organization, status badges, issue codes, source link.
- Filters: All / Flagged / Needs review / No heuristic flags / Undecided; search by product or org.
- Keep / Omit / Review buttons; localStorage persistence; Export decisions JSON.
- Explicit notice: Tier 0 does not understand pixels — “clean” is not proof of relevance.

### Tier 1 (optional, local CLIP)

- `--clip` / `--clip-local-only` using open Hugging Face CLIP weights via `@huggingface/transformers`.
- Runs locally; never calls a paid inference API.
- Generic labels: identifiable product/UI/installed system/deliverable vs people-only vs nature-only vs logo/certificate vs generic stock.

### Outputs

- `data/qa-reports/<stem>-image-audit/contact-sheet.html`
- `data/qa-reports/<stem>-image-audit/audit.json`
- `data/qa-reports/<stem>-image-audit/assets/`

### CLI

```bash
npm run audit:product-images -- --file <products.json> [--out-dir <dir>] [--concurrency <n>] [--timeout-ms <n>] [--terms-file <json>] [--clip] [--clip-model <id>] [--clip-local-only] [--fail-on-flags]
```

Input file is read-only. The tool never mutates products JSON.

---

## 4. User acceptance criteria (UACs)

| ID | Criterion |
|----|-----------|
| **UAC-1** | Given a valid products JSON with ≥1 `product_shot`, CLI exits 0 and writes `contact-sheet.html`, `audit.json`, and `assets/`. |
| **UAC-2** | Contact sheet shows one card per shot with thumbnail (or unavailable placeholder), product name, organization, status, issues, and source URL. |
| **UAC-3** | Known stock host (e.g. `images.unsplash.com`) is auto-`flag`ged in Tier 0. |
| **UAC-4** | Unreachable or non-image URLs are `flag`ged; the sheet still renders a card (broken/unavailable placeholder). |
| **UAC-5** | Duplicate URLs and byte-identical images (different URLs) are flagged. |
| **UAC-6** | Service / advisory / software-type products are at least `review` for visual confirmation. |
| **UAC-7** | Analyst can filter by flag/review/clean/undecided and mark Keep/Omit/Review; decisions persist in-browser and export as JSON. |
| **UAC-8** | Tool never deletes products or media from the input file (read-only on input). |
| **UAC-9** | Works without paid API keys; `--clip` remains optional and local. |
| **UAC-10** | Heuristics and CLIP labels are sector-agnostic by default (a non-energy batch runs without energy-only deny/boost terms). |
| **UAC-11** | Skill/docs instruct: omit media only; re-audit after edits; then mechanical product QA. |
| **UAC-12** | Does not modify `scripts/qa_agent.ts` behavior. |
