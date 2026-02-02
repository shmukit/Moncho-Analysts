# Skill: Data Extraction & Formatting

Ensures your generated JSON is "Reviewer-Ready."

## 1. Zero Hallucination Policy
- If you cannot find a piece of data, mark it as `null` or omit it. 
- **NEVER** guess a website URL or founding year.

## 2. The "Snippet" Rule
- **Descriptions** should be 20-40 words.
- Format: `[Core Benefit/Technology] + [Primary Target Market] + [Specific Value Proposition].`
- *Example*: "AI-powered inventory management platform for small-scale retailers in Southeast Asia, reducing stockouts by 30% through predictive analytics."

## 3. Kebab-Case Formatting
- Always use `kebab-case` for slugs:
  - HQ Country: `united-arab-emirates`
  - Sector: `fintech`
  - Segment: `p2p-lending`

## 4. Rationale Quality
Rationales are for the **AI Judge**. They should be fact-heavy:
- **Bad**: "They have a good product."
- **Good**: "Integrated with 5 local banks in Kenya and processed $2M in volume in Q3 2024."
