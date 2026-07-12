# 🕵️ Moncho Analyst Handbook

Welcome to the data operations unit of Moncho. This handbook is your single source of truth for setting up your environment, understanding the "Laws of Search," and completing your first mission.

---

## 📚 Table of Contents
1.  [The Two-Hub Workflow](#the-two-hub-workflow)
2.  [Setup Guide (The Workbench)](#1-setup-guide-the-workbench)
3.  [The "Skill Pack" (System Instructions)](#2-the-skill-pack-system-instructions)
4.  [Data Scoring & Quality](#data-scoring--quality)
5.  [Mission 1: The First Hunt](#3-mission-1-the-first-hunt)
6.  [Navigating the Analyst Dashboard](#4-navigating-the-analyst-dashboard)
7.  [Capabilities: Analysts vs Admins](#5-capabilities-analysts-vs-admins)

---

## The Two-Hub Workflow
Operating at Moncho involves two distinct activities:

### 🛠️ Hub 1: Data Generation (Your IDE)
- **Where**: Local (Cursor, Antigravity, Windsurf, or VS Code).
- **Goal**: Research, Discovery, and JSON Extraction.
- **Outcome**: A "Change Request" submitted via script.
- **Standard**: Follow the `analyst_instructions.md` and use the `skills/` pack.

### 📊 Hub 2: Data Management (The Dashboard)
- **Where**: [app.moncho.ai/analyst/dashboard](https://app.moncho.ai/analyst/dashboard).
- **Goal**: Monitoring, API credential retrieval, profile customization, and portfolio management.
- **Outcome**: View your reputation stats, copy your API key (Workbench Access token), monitor your Sherpa AI turn count limits, and track your submitted change requests.
- **Walkthrough**: See the dedicated [Dashboard Walkthrough](DASHBOARD_WALKTHROUGH.md) for a step-by-step layout guide.

---

## 1. Setup Guide (The Workbench)
**Goal**: Get your computer ready to work with AI.
**Time**: 15 Minutes.

### Phase 0: Activate Analyst Dashboard
1.  Log in at [app.moncho.ai](https://app.moncho.ai) — you land on `/dashboard` immediately (personalization is optional).
2.  Visit [/analyst/apply](https://app.moncho.ai/analyst/apply) and click **Become Analyst for Free**.
3.  Copy your API key from **Workbench Access** on the analyst dashboard.

### Phase 1: Accounts (Workbench)
1.  Use your own local folder or the Moncho-Analysts workbench repo — **no Moncho-V1 repo access required**.
2.  Configure `MONCHO_AUTH_TOKEN` from the dashboard API key card.

### Phase 2: Tools
1.  **Your AI IDE**: Download an AI-powered IDE like **Cursor**, **Antigravity**, **Windsurf**, or **VS Code** with AI extensions. This is your "Workbench".
2.  **GitHub Desktop**: Download [desktop.github.com](https://desktop.github.com) to manage files without using the terminal.

### Phase 3: Connect
1.  Open **GitHub Desktop**.
2.  Click **File** -> **Clone Repository**.
3.  Select **Moncho-Analysts** (or paste the URL founder shared).
4.  Clone it to a folder like `Documents/Moncho-Workbench`.
5.  Open this folder in your **AI IDE**.

---

## 2. The "Skill Pack" (System Instructions)
**Role**: You are an expert Market Intelligence Analyst.
**Action**: Copy the text below and paste it into your IDE's "Rules for AI" or "System Prompt" settings.

> **System Prompt Start**
> 
> **Role**: You are an expert Market Intelligence Analyst for Moncho.
> **Objective**: Discover high-quality companies and extract structured data into strict JSON format.
> 
> ### 🧠 Core Philosophy
> 1.  **Truth over Quality**: Verify facts. If you can't find a website, do not invent one.
> 2.  **Strict Schema**: Output must match the `Organization` interface exactly.
> 3.  **Planning Mode**: Before scraping, outline your search strategy first.
> 
> ### 📝 The Workflow
> 1.  **Plan**: Create a research plan (queries, sources).
> 2.  **Execute**: Browse and find data.
> 3.  **Output**: JSON file in `data/pending/`.
> 
> ### 💾 Output Format (JSON Schema)
> ```typescript
> interface Organization {
>   name: string; // Official name
>   website_url: string; // Must be valid https://...
>   description: string; // 20-50 words. Focus on USP.
>   sector_slug: string; 
>   segment_slug: string; 
>   hq_country_slug: string; // kebab-case
>   innovation_rationale: string; 
>   market_traction_rationale: string;
> }
> ```
> **Critical Rules**: No defunct companies. No duplicates. Clean strings.
> 
> **System Prompt End**

---

---

## Data Scoring & Quality
Every piece of data you submit is evaluated against our official **Scoring Mechanism**. 

- **Dimensional Scores**: Innovation, Market Traction, Competitiveness, Product Depth, and Social Proof.
- **Judge Agent**: An AI agent evaluates your rationales against these 5 dimensions.
- **Top 1% Reputation**: Only analysts who consistently maintain high scores (4.0+) reach the elite ranks.

Reference `SCORING_STANDARDS.md` in this repository for the full breakdown.

---

## 3. Mission 1: The First Hunt
**Objective**: Map 5 "Unknown" EdTech Companies in Southeast Asia.
**Criteria**: K-12 Education, Active Website, Not a giant unicorn.

### Step 1: Planning Mode
Open your IDE Chat and type:
> *"I need to find 5 rising K-12 EdTech startups in Vietnam or Thailand. Create a research plan for how you will find them."*

Review the plan. If it looks good, type *"Proceed."*

### Step 2: Execution
Let the Agent browse and find the companies.
**Command**: *"Extract these 5 companies into a JSON file in `data/pending/` named `2026-01-25-onboarding-YOURNAME.json`."*

### Step 3: Verification
Open your IDE Terminal and run:
```bash
npx tsx scripts/utils/validate-analyst-data.ts data/pending/2026-01-25-onboarding-YOURNAME.json
```
*   ✅ Green Checks: Good to go.
*   ❌ Red Errors: Ask the Agent to fix them.

### Step 4: Submission (Automated)
1.  **Open Terminal**: Stay in your project folder.
2.  **Set Environment**: Run these commands with your credentials:
    ```bash
    export MONCHO_API_URL="https://app.moncho.ai"
    export MONCHO_AUTH_TOKEN="<your analyst API key>"  # copy from Analyst Dashboard → Workbench Access
    ```
3.  **Prepare JSON**:
    - Shape your file like `docs/analyst/samples/organization_sample.json`.
    - Top level can be **one object** or an **array of objects**; each object becomes a separate change request.
    - For **new** organizations, **omit** `id` (the system will generate one). For **updates**, include the existing organization `id`.
4.  **Submit**: Run the delivery script:
    ```bash
    npm run submit -- --file data/pending/your-file.json --type organization
    ```
5.  **Verification**: 
    - ✅ **Success**: Your data is now a **Change Request** in the system.
    - 🔍 **Review**: A Reviewer and Admin will check your work. 
    - 🏆 **Approval**: Once approved, your data is pushed to the main database, and your **Profile Stats** will update automatically.

---
**⚠️ Important Reminder**: You are submitting *requests*, not direct database entries. High-quality data leads to faster approvals and higher Reputation Ranks.

---
**🎉 You are now ready to operate!**

---

## 4. Navigating the Analyst Dashboard
**Goal**: Monitor your progress, retrieve credentials, and utilize curation tools.
**Time**: 5 Minutes.

The **Analyst Dashboard** is the command center for all your activities on Moncho. It hosts several essential components:
1. **Workbench Access (API Key)**: You must copy your unique key from the "Workbench Access" card and save it in your local `.env` file as `MONCHO_AUTH_TOKEN` to run the local developer tools (Hub 1).
2. **Curation Statistics**: Tracks your count of approved contributions and displays your reputation score, which is determined by the Judge Agent based on quality rationales.
3. **Recent Activity Feed**: Follow the progress of your submitted change requests.
4. **Sherpa AI turns**: Monitor your remaining daily and monthly chat turn count limits.

To explore all interactive sidebar modules like the **Landscape Builder**, **Organizations Manager**, **Metadata Manager**, and **Reports**, please read our complete [Analyst Dashboard Walkthrough](DASHBOARD_WALKTHROUGH.md).

---

## 5. Capabilities: Analysts vs Admins

Use this table as the contract for who does what in the system.

| Area | Analyst can | Admin / Core team can |
| :--- | :--- | :--- |
| **Discovery & research** | Use IDE + skills (`research_strategy`, `extraction_logic`, `extraction_toolkit`) to discover orgs, scrape directories, parse PDFs, enrich data. | Configure and evolve discovery agents and backend pipelines. |
| **Taxonomy mapping** | Map orgs/products to existing sectors/segments/landscapes using `taxonomy_mapping` and reference data. | Create or change sectors, segments, landscapes, and taxonomy rules. |
| **Data extraction & structuring** | Turn PDFs, websites, directories, CSVs into JSON matching `samples/` schemas. | Change schemas, add new entity types, and update data models. |
| **Validation** | Run validation scripts and fix all JSON errors; follow `validation_submission` skill. | Define validation rules, CI checks, and “Judge” logic. |
| **Submission** | Submit JSON as change requests via `scripts/submit_data.ts`; see and edit own requests. | Approve/reject requests, push data to production tables. |
| **PDF/SML pipelines** | Understand high-level PDF → tables → SML behavior via `pdf_parsing` skill; request extractions when needed. | Run and modify SML harvesting pipelines, MinerU profiles, and normalizers in Moncho-V1. |
| **Infrastructure & DB** | No direct DB or infra access. Work only via this repo and the Analyst Dashboard. | Run migrations, manage database and infra, change API behavior and access. |
