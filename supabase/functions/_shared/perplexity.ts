// Live web search via Perplexity (direct API). Returns answer text + citation URLs.
export async function webSearch(query: string, system = "Be precise. Give real, currently listed prices, times and names with sources."): Promise<string> {
  const key = Deno.env.get("PERPLEXITY_API_KEY");
  if (!key) return "";
  try {
    const r = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [{ role: "system", content: system }, { role: "user", content: query }],
        search_recency_filter: "month",
      }),
    });
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
}
