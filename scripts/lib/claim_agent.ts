import { searchEvidence, type SearchResult } from "./search.js";

export type Verdict = {
  verdict: "supported" | "contradicted" | "unclear";
  confidence: number;
  evidence: { url: string; note: string }[];
  explanation: string;
  agent_steps: string[];
};

function extractFacts(claim: string): {
  numbers: string[];
  years: string[];
  money: string[];
} {
  const numbers = [...claim.matchAll(/\d[\d,.]*\d|\d+/g)].map((m) => m[0]);
  const years = [...claim.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => m[0]);
  const money = [...claim.matchAll(/\$[\d,.]+[BMK]?|\d+(\.\d+)?\s*(billion|million|bn|mn)/gi)].map((m) => m[0]);
  return { numbers, years, money };
}

function normalizeOrgName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function corpusText(results: SearchResult[]): string {
  return results.map((r) => `${r.title} ${r.content}`).join(" ").toLowerCase();
}

function heuristicJudge(orgName: string, claim: string, evidence: SearchResult[]): Verdict {
  const steps: string[] = ["heuristic_judge:start"];
  const corpus = corpusText(evidence);
  const orgNorm = normalizeOrgName(orgName);
  const orgTokens = orgNorm.split(" ").filter((t) => t.length > 2);

  if (!evidence.length) {
    return {
      verdict: "unclear",
      confidence: 0.1,
      evidence: [],
      explanation: "No search evidence returned for this claim.",
      agent_steps: [...steps, "no_evidence"],
    };
  }

  const orgMentioned = orgTokens.some((t) => corpus.includes(t));
  steps.push(orgMentioned ? "org_mentioned_in_evidence" : "org_not_clearly_mentioned");

  const facts = extractFacts(claim);
  const keyFacts = [...new Set([...facts.money, ...facts.years, ...facts.numbers])];
  const matchedFacts = keyFacts.filter((f) => corpus.includes(f.toLowerCase().replace(/,/g, "")));
  steps.push(`matched_facts:${matchedFacts.length}/${keyFacts.length}`);

  let confidence = 0.35;
  if (orgMentioned) confidence += 0.2;
  if (keyFacts.length && matchedFacts.length === keyFacts.length) confidence += 0.35;
  else if (matchedFacts.length > 0) confidence += 0.15;

  const evidenceNotes = evidence.slice(0, 3).map((e) => ({
    url: e.url,
    note: `${e.source}: ${e.title}`.slice(0, 160),
  }));

  if (orgMentioned && keyFacts.length && matchedFacts.length === keyFacts.length) {
    return {
      verdict: "supported",
      confidence: Math.min(confidence, 0.85),
      evidence: evidenceNotes,
      explanation:
        "Company name and key numeric facts from the claim appear in retrieved web evidence.",
      agent_steps: steps,
    };
  }

  if (orgMentioned && matchedFacts.length > 0) {
    return {
      verdict: "unclear",
      confidence: Math.min(confidence, 0.65),
      evidence: evidenceNotes,
      explanation:
        "Partial evidence found (company + some facts) but not all claim details corroborated.",
      agent_steps: steps,
    };
  }

  return {
    verdict: "unclear",
    confidence: Math.min(confidence, 0.4),
    evidence: evidenceNotes,
    explanation:
      "Search returned results but could not confidently match the specific claim facts.",
    agent_steps: steps,
  };
}

async function llmJudgeAnthropic(
  orgName: string,
  claim: string,
  evidence: SearchResult[]
): Promise<Verdict | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const evidenceBlock = evidence.length
    ? evidence.map((e, i) => `[${i + 1}] ${e.title} (${e.url})\n${e.content}`).join("\n\n")
    : "(no search results returned)";

  const prompt = `You are a strict fact-checker. Judge ONLY from the snippets.

Company: ${orgName}
Claim: "${claim}"

Search results:
${evidenceBlock}

Respond with ONLY JSON:
{"verdict":"supported"|"contradicted"|"unclear","confidence":0-1,"evidence":[{"url":"...","note":"..."}],"explanation":"..."}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return null;

  const data = await res.json();
  const text = (data.content || []).find((b: { type?: string }) => b.type === "text")?.text || "";
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return { ...parsed, agent_steps: ["llm_judge:anthropic"] };
  } catch {
    return null;
  }
}

/** Judge a claim from pre-fetched search evidence (LLM if available, else heuristic). */
export async function judgeClaim(
  orgName: string,
  claim: string,
  evidence: SearchResult[]
): Promise<Verdict> {
  const llmVerdict = await llmJudgeAnthropic(orgName, claim, evidence);
  if (llmVerdict) return llmVerdict;
  return heuristicJudge(orgName, claim, evidence);
}

/**
 * Agentic claim verification loop:
 * 1) search web (Tavily → Exa)
 * 2) if thin evidence, reformulate query and search again
 * 3) judge with LLM if available, else heuristic evidence scorer
 */
export async function verifyClaim(orgName: string, claim: string): Promise<Verdict> {
  const steps: string[] = ["agent:start"];

  let evidence = await searchEvidence(orgName, claim);
  steps.push(`search_pass_1:${evidence.length}_results`);

  if (evidence.length < 2) {
    const reformulated = `${orgName} funding revenue patent award ${claim}`.slice(0, 350);
    const more = await searchEvidence(orgName, reformulated);
    const seen = new Set(evidence.map((e) => e.url));
    for (const item of more) {
      if (!seen.has(item.url)) evidence.push(item);
    }
    steps.push(`search_pass_2:${evidence.length}_results`);
  }

  const verdict = await judgeClaim(orgName, claim, evidence);
  return { ...verdict, agent_steps: [...steps, ...verdict.agent_steps] };
}
