// Shared Lovable AI Gateway helper: accepts a chat-completions style body,
// calls the streaming Responses API, and returns a chat-completions shaped Response
// so existing callers keep working.
export const TEXT_MODEL = "openai/gpt-6-astra";
const URL = "https://ai.gateway.lovable.dev/v1/responses";

type AnyObj = Record<string, any>;

function toInput(messages: AnyObj[]) {
  return messages.map((m) => {
    if (typeof m.content === "string") return { role: m.role, content: m.content };
    const content = (m.content || []).map((p: AnyObj) =>
      p.type === "image_url"
        ? { type: "input_image", image_url: p.image_url?.url }
        : { type: m.role === "assistant" ? "output_text" : "input_text", text: p.text ?? "" }
    );
    return { role: m.role, content };
  });
}

export async function aiFetch(body: AnyObj, signal?: AbortSignal): Promise<Response> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const payload: AnyObj = {
    model: TEXT_MODEL,
    input: toInput(body.messages || []),
    stream: true,
    store: false,
    reasoning: { effort: "low" },
  };
  if (body.tools) {
    payload.tools = body.tools.map((t: AnyObj) => ({
      type: "function",
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
      strict: false,
    }));
  }
  if (body.tool_choice?.function?.name) {
    payload.tool_choice = { type: "function", name: body.tool_choice.function.name };
  }

  const res = await fetch(URL, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok || !res.body) {
    return new Response(await res.text(), { status: res.status || 500 });
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let text = "";
  let final: AnyObj | null = null;
  let failure: string | null = null;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const ev = JSON.parse(data);
        if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        else if (ev.type === "response.completed") final = ev.response;
        else if (ev.type === "response.failed" || ev.type === "error")
          failure = ev.response?.error?.message || ev.message || "AI request failed";
      } catch { /* ignore partial */ }
    }
  }
  if (failure && !final) return new Response(JSON.stringify({ error: failure }), { status: 500 });

  const toolCalls = (final?.output || [])
    .filter((o: AnyObj) => o.type === "function_call")
    .map((o: AnyObj) => ({ type: "function", function: { name: o.name, arguments: o.arguments } }));
  const compat = {
    choices: [{ message: { role: "assistant", content: text, tool_calls: toolCalls.length ? toolCalls : undefined } }],
  };
  return new Response(JSON.stringify(compat), { status: 200, headers: { "Content-Type": "application/json" } });
}

// Route legacy chat-completions text calls through aiFetch (image calls pass through).
export function installAiShim() {
  const g = globalThis as AnyObj;
  if (g.__aiShim) return;
  g.__aiShim = true;
  const orig = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith("https://ai.gateway.lovable.dev/v1/chat/completions") && typeof init?.body === "string") {
      const body = JSON.parse(init.body);
      if (!body.modalities) return aiFetch(body, init.signal ?? undefined);
    }
    return orig(input as any, init);
  }) as typeof fetch;
}
