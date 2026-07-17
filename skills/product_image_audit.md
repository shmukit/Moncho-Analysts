# Skill: Product Image Contact-Sheet Audit

Use this skill **every time** you create, rematch, or change `product_shot` rows in a products JSON batch — any sector.

PRD: [`docs/prd/PRODUCT_IMAGE_CONTACT_SHEET_AUDIT.md`](../docs/prd/PRODUCT_IMAGE_CONTACT_SHEET_AUDIT.md)  
CLI: [`scripts/utils/audit-product-images.mjs`](../scripts/utils/audit-product-images.mjs)

---

## 1. When to use

- After harvesting or rematching `product_media` with `media_type: "product_shot"`.
- Before claiming product media is “reviewed” or running submit.
- After omitting shots — re-run to confirm the sheet is clean of known-bad assets you meant to drop.

Do **not** treat HTTP 200 / `image/*` mechanical QA as content proof.

---

## 2. Commands

```bash
npm run audit:product-images -- --file data/pending/<products>.json
```

Optional local CLIP (free weights; never a paid API):

```bash
npm install --no-save @huggingface/transformers
npm run audit:product-images -- --file data/pending/<products>.json --clip
```

Optional sector token pack (product/deny/decorative terms):

```bash
npm run audit:product-images -- --file data/pending/<products>.json --terms-file path/to/sector-terms.json
```

Outputs (gitignored):

- `data/qa-reports/<stem>-image-audit/contact-sheet.html`
- `data/qa-reports/<stem>-image-audit/audit.json`
- `data/qa-reports/<stem>-image-audit/assets/`

---

## 3. Visual pass rules

1. Open the contact sheet and scan **every** thumbnail at least once.
2. Prioritize cards marked `flag` or `review`.
3. **Keep** only when an identifiable product, interface, installed system, or concrete service deliverable is visible.
4. People or nature may surround the product/system but cannot be the only subject.
5. Generic stock, hero, team, logo, certificate, and decorative images are not product shots.
6. Service/advisory offerings default to logo-only unless the image visibly proves a concrete deliverable or installed system.
7. **Omit only the bad `product_shot` media row** — never drop an otherwise valid product.
8. Re-run this audit after corrections, then run normal mechanical product QA (`skills/validation_submission.md`).

---

## 4. Agent checklist

- [ ] Ran `npm run audit:product-images` on the pending products file
- [ ] Opened and scanned `contact-sheet.html`
- [ ] Removed omitted `product_shot` rows from JSON (products kept)
- [ ] Re-ran audit after edits
- [ ] Ran mechanical product QA before submit

---

## 5. Non-goals

- Do not fold this into `scripts/qa_agent.ts`.
- Do not require paid vision APIs.
- Do not auto-mutate the input JSON (tool is read-only on input).
