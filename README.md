# Moncho Analyst Workbench

Welcome to the Moncho Analyst Workbench. This repository contains the tools and instructions required for discovering and submitting market intelligence data to Moncho.ai.

## Repository Contents
- `instructions.md`: Core system prompt and guidelines for your AI agent.
- `scripts/submit_data.ts`: Utility to submit your JSON output to the Moncho API.
- `samples/`: Standardized JSON formats for Organizations, Landscapes, and Experts.
- `.cursorrules` / `.antigravityrules`: Pre-configured rules for your IDE to follow.

## Setup
1. **Clone this repository** (or download the zip).
2. **Install dependencies**:
   ```bash
   npm install ts-node typescript
   ```
3. **Configure Environment**:
   Create a `.env` file or export the following:
   ```bash
   export MONCHO_API_URL="https://moncho.ai"
   export MONCHO_AUTH_TOKEN="your_token_here"
   ```

## Workflow
1. **Research**: Use your IDE agent to research a sector using the guidelines in `instructions.md`.
2. **Generate**: Ask the agent to generate a JSON file matching the format in `samples/`.
3. **Validate**: Ensure the JSON is valid and accurate.
4. **Submit**:
   ```bash
   npx ts-node scripts/submit_data.ts --file your_output.json --type organization
   ```

## Task Types
1. **Data Review**: Log in to the [Analyst Dashboard](https://moncho.ai/analyst/dashboard) to review and edit existing data.
2. **Data Input**: Use this workbench to research and input new data via the API.
