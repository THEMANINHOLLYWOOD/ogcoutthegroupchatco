// Live web search via Perplexity (direct API). Returns answer text + citation URLs.
let queue: Promise<unknown> = Promise.resolve();

// Serialize calls (rate limit) and retry 429s with backoff.
export function webSearch(query: string, system?: string): Promise<string> {
  const run = queue.then(() => webSearchOnce(query, system));
  queue = run.catch(() => {});
  return run;
}

async function webSearchOnce(query: string, system = "Be precise. Give real, currently listed prices, times and names with sources."): Promise<string> {
  const key = Deno.env.get("PERPLEXITY_API_KEY");
  if (!key) return "";
  for (let attempt = 0; attempt < 3; attempt++) try {
    const r = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [{ role: "system", content: system }, { role: "user", content: query }],
        search_recency_filter: "month",
      }),
    });
    if (r.status === 429 && attempt < 2) {
      await r.text();
      await new Promise((res) => setTimeout(res, 2000 * (attempt + 1) + Math.random() * 500));
      continue;
    }
    if (!r.ok) {
      console.error("Perplexity failed", r.status, await r.text());
      return "";
    }
    const d = await r.json();
    const text = d.choices?.[0]?.message?.content ?? "";
    const cites: string[] = d.citations ?? [];
    return `${text}\n\nSOURCES:\n${cites.map((c, i) => `[${i + 1}] ${c}`).join("\n")}`;
  } catch (e) {
    console.error("Perplexity error", e);
    return "";
  }
  return "";
}
