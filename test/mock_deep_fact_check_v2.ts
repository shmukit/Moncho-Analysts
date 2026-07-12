// In-process test: mocks fetch, imports deep_fact_check.ts's own functions,
// and verifies real behavior — no live API keys, no subprocess.
//
// Run: npm run qa:test

process.env.TAVILY_API_KEY = "test-key";
process.env.ANTHROPIC_API_KEY = "test-key";

const originalFetch = globalThis.fetch;
// @ts-expect-error test mock
globalThis.fetch = async (url: string, opts: { body?: string; method?: string }) => {
  if (typeof url === "string" && url.includes("tavily.com")) {
    const body = JSON.parse(opts.body || "{}");
    const query: string = body.query || "";
    const isAnthropicFundingQuery = query.includes("Anthropic") && query.toLowerCase().includes("series f");
    return {
      ok: true,
      json: async () => ({
        results: isAnthropicFundingQuery
          ? [
              {
                title: "Anthropic raises $13B Series F",
                url: "https://www.reuters.com/example-anthropic-funding",
                content:
                  "Anthropic announced a $13 billion Series F funding round in March 2025, " +
                  "valuing the AI safety company at roughly $61.5 billion.",
              },
            ]
          : [],
      }),
    };
  }
  if (typeof url === "string" && url.includes("anthropic.com")) {
    const body = JSON.parse(opts.body || "{}");
    const promptText = body.messages?.[0]?.content as string;
    const claimIsFunding = promptText?.includes("Series F");
    const verdict = claimIsFunding
      ? {
          verdict: "supported",
          confidence: 0.92,
          evidence: [
            {
              url: "https://www.reuters.com/example-anthropic-funding",
              note: "Confirms $13B Series F, March 2025.",
            },
          ],
          explanation: "Reuters snippet directly corroborates the funding amount and date.",
        }
      : {
          verdict: "unclear",
          confidence: 0.2,
          evidence: [],
          explanation: "No relevant snippet found for this specific claim.",
        };
    return {
      ok: true,
      json: async () => ({ content: [{ type: "text", text: JSON.stringify(verdict) }] }),
    };
  }
  return originalFetch(url, opts as RequestInit);
};

async function run() {
  const mod = await import("../scripts/deep_fact_check.ts");

  console.log("--- Test 1: real claim with strong evidence ---");
  const evidence1 = await mod.tavilySearch("Anthropic Series F funding");
  console.log("Tavily returned", evidence1.length, "result(s)");
  const verdict1 = await mod.judgeClaim(
    "Anthropic",
    "Raised a $13B Series F round in March 2025, valuing the company at approximately $61.5B.",
    evidence1
  );
  console.log("Verdict:", verdict1);
  if (verdict1.verdict !== "supported" || verdict1.confidence < 0.75) {
    throw new Error("FAILED: expected strongly-evidenced claim to be judged 'supported' with high confidence");
  }
  if (!verdict1.evidence[0]?.url.includes("reuters.com")) {
    throw new Error("FAILED: expected evidence to cite the actual source URL returned by search");
  }

  console.log("\n--- Test 2: vague claim with no real evidence ---");
  const evidence2 = await mod.tavilySearch("TotallyRealCompanyXYZ good market position");
  const verdict2 = await mod.judgeClaim(
    "TotallyRealCompanyXYZ",
    "Good market position with great potential.",
    evidence2
  );
  console.log("Verdict:", verdict2);
  if (verdict2.verdict === "supported" && verdict2.confidence >= 0.75) {
    throw new Error("FAILED: vague/unsupported claim should NOT be auto-verified as supported");
  }

  console.log("\n--- Test 3: concurrency helper processes all items ---");
  const items = [1, 2, 3, 4, 5];
  const results = await mod.mapWithConcurrency(items, 2, async (n: number) => n * 2);
  console.log("Results:", results);
  if (JSON.stringify(results) !== JSON.stringify([2, 4, 6, 8, 10])) {
    throw new Error("FAILED: mapWithConcurrency did not preserve order/correctness");
  }

  console.log("\nALL TESTS PASSED.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
