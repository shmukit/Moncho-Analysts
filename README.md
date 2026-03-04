# Moncho Analyst Workbench

Welcome to the Moncho Analyst Workbench. This repository contains the tools and instructions required for discovering and submitting market intelligence data to Moncho.ai.

## Repository Contents
- `instructions.md`: Core system prompt and guidelines for your AI agent.
- `scripts/submit_data.ts`: Utility to submit your JSON output to the Moncho API.
- `samples/`: Standardized JSON formats for Organizations, Landscapes, Experts, and Products (see `samples/README.md`).
- `skills/`: Research and extraction skills, including `taxonomy_mapping.md` for resolving sector/segment/landscape.
- `.cursorrules` / `.antigravityrules`: Pre-configured rules for your IDE to follow.

## Setup
1. **Clone this repository** (or download the zip).
2. **Install dependencies**:
   ```bash
   npm install ts-node typescript
   ```
3. **Configure Environment**  
   Create a `.env` file in the repo root (do not commit it). Add the following variables for APIs used by the discovery workflow:

   **Moncho API** (required for submission):
   ```bash
   MONCHO_API_URL="https://moncho.ai"
   MONCHO_AUTH_TOKEN="your_analyst_api_key_here" # copy from Analyst Dashboard → Workbench Access
   ```

   **Discovery & enrichment APIs** (required for the IDE agent’s discovery workflow):
   ```bash
   # Tavily – web search for discovering organizations and content
   TAVILY_API_KEY="your_tavily_api_key"

   # Exa – semantic search for companies, reports, and products
   EXA_API_KEY="your_exa_api_key"

   # Logo.dev – fetch organization/product logo URLs by domain
   LOGO_DEV_API_KEY="your_logo_dev_api_key"
   ```

   Get API keys from: [Tavily](https://tavily.com), [Exa](https://exa.ai), [Logo.dev](https://logo.dev). Keep `.env` in `.gitignore`.

## Workflow
1. **Agent context**: Have your IDE agent read `README.md`, `analyst_instructions.md`, and the `skills/` (including `taxonomy_mapping.md`) and `samples/` files so it understands context, intent, schemas, and how to map to sector/segment/landscape.
2. **Discovery** (see `analyst_instructions.md`): Discover orgs → select top by scoring rubrics → fetch logos (Logo.dev) → discover products → select top products → fetch product URLs.
3. **Generate**: Ask the agent to generate a JSON file matching the format in `samples/`.
4. **Validate**: Ensure the JSON is valid and accurate.
5. **Submit**:
   ```bash
   npx ts-node scripts/submit_data.ts --file your_output.json --type organization
   ```

   **Submission format rules**:
   - You may send **one organization object** or an **array of organization objects**; the script will submit each object as a separate change request.
   - For **new** organizations, **omit** the `id` field (the system will generate one). For **updates**, include the existing organization `id` from the database.
   - Keep field names exactly as in `samples/organization_sample.json`; optional fields can be omitted.

## Task Types
1. **Data Review**: Log in to the [Analyst Dashboard](https://moncho.ai/analyst/dashboard) to review and edit existing data.
2. **Data Input**: Use this workbench to research and input new data via the API.

