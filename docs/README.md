# Docs

Analyst-facing documentation. Keep IDE entry points at the repo root (`README.md`, `AGENTS.md`, `instructions.md`, `analyst_instructions.md`, `.cursorrules`). Everything else lives here.

**One owner per topic.** Other files link here; do not restate the rules.

| Topic | Owner | Others |
|-------|-------|--------|
| Setup, `.env`, npm scripts | [`README.md`](../README.md) | `AGENTS.md` links only |
| Git branches / agent routing | [`AGENTS.md`](../AGENTS.md) | |
| IDE QA/submit gate | [`instructions.md`](../instructions.md) | `.cursorrules`, `skills/validation_submission.md` |
| Analyst role and discovery steps | [`analyst_instructions.md`](../analyst_instructions.md) | |
| Recurring wrong patterns | [`reference/IDE_AGENT_MISTAKES.md`](reference/IDE_AGENT_MISTAKES.md) | |
| Org scoring dims | [`reference/SCORING_STANDARDS.md`](reference/SCORING_STANDARDS.md) | |
| Product gate / SKUs | [`reference/PRODUCT_ORG_RUBRICS.md`](reference/PRODUCT_ORG_RUBRICS.md) | `skills/product_sku_submission.md` |
| JSON shapes | [`samples/`](../samples/) | |
| Discovery MCP/CLI | [`discovery/ANALYST_DISCOVERY_MCP.md`](discovery/ANALYST_DISCOVERY_MCP.md) | |

| Folder | Contents |
|--------|----------|
| [`onboarding/`](onboarding/) | Handbook, ICT grant onboarding, ten sectors, dashboard walkthrough, MCP setup |
| [`reference/`](reference/) | Schema overview, scoring standards, product/org rubrics, IDE agent mistakes |
| [`discovery/`](discovery/) | Analyst discovery MCP guide |
| [`prd/`](prd/) | Workbench tool PRDs (e.g. product-image contact-sheet audit) |

Operational folders outside `docs/`: `skills/` (incl. **`data_injection_planning.md`** for sector plans and **`sizing-audit.md`** for Track A factors), `sizing-templates/`, `samples/`, `roles/`, `scripts/`, `data/`, `test/`.
