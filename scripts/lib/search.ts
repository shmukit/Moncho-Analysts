export type SearchResult = { title: string; url: string; content: string; source: "tavily" | "exa" };

export async function tavilySearch(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: 5,
    }),
  });
  if (!res.ok) {
    throw new Error(`Tavily search failed: HTTP ${res.status}`);
  }
  const data = await res.json();
  return (data.results || []).map((r: { title?: string; url?: string; content?: string }) => ({
    title: r.title || "",
    url: r.url || "",
    content: (r.content || "").slice(0, 1200),
    source: "tavily" as const,
  }));
}

export async function exaSearch(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return [];

  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query,
      numResults: 5,
      useAutoprompt: true,
      contents: { text: { maxCharacters: 1200 } },
    }),
  });
  if (!res.ok) {
    throw new Error(`Exa search failed: HTTP ${res.status}`);
  }
  const data = await res.json();
  return (data.results || []).map((r: { title?: string; url?: string; text?: string }) => ({
    title: r.title || "",
    url: r.url || "",
    content: (r.text || "").slice(0, 1200),
    source: "exa" as const,
  }));
}

/** Agent search: Tavily first, Exa fallback, dedupe by URL. */
export async function searchEvidence(orgName: string, claim: string): Promise<SearchResult[]> {
  const queries = [
    `${orgName} ${claim}`.slice(0, 400),
    `${orgName} ${claim}`.replace(/[^\w\s$%.,-]/g, " ").slice(0, 300),
  ];

  const seen = new Set<string>();
  const results: SearchResult[] = [];

  for (const query of queries) {
    let batch: SearchResult[] = [];
    try {
      batch = await tavilySearch(query);
    } catch {
      batch = [];
    }
    if (!batch.length) {
      try {
        batch = await exaSearch(query);
      } catch {
        batch = [];
      }
    }

    for (const item of batch) {
      if (!item.url || seen.has(item.url)) continue;
      seen.add(item.url);
      results.push(item);
    }
    if (results.length >= 5) break;
  }

  return results;
}
