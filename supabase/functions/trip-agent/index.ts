import { createClient } from "npm:@supabase/supabase-js@2";
import { streamText, tool, stepCountIs, convertToModelMessages, type UIMessage } from "npm:ai@5";
import { createOpenAI } from "npm:@ai-sdk/openai@2";
import { z } from "npm:zod@3";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SYSTEM = `You are the Out The Group Chat trip agent. Friendly, brief, Apple-calm tone. Short sentences.
You help groups plan real trips: flights, live events, saved trips.
- Always use tools for real data. Never invent prices, flights or events.
- If a tool says a service isn't connected, say so plainly and continue with what you can.
- Use IATA codes for airports (infer common ones, e.g. NYC -> JFK, Miami -> MIA). Ask for origin or dates if missing.
- To buy anything, call prepare_booking. It only creates an approval request; the user must tap Approve and pay. Never claim a purchase happened unless a tool confirms it.
- Collect each passenger's full legal name, date of birth, gender (m/f), email and phone before prepare_booking.
- Today is ${new Date().toISOString().slice(0, 10)}.`;

async function duffel(path: string, init: RequestInit = {}) {
  const key = Deno.env.get("DUFFEL_API_KEY");
  if (!key) return { notConnected: true };
  const r = await fetch(`https://api.duffel.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Duffel-Version": "v2",
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers || {}),
    },
  });
  const body = await r.json();
  if (!r.ok) return { error: body?.errors?.[0]?.message || `Duffel error ${r.status}` };
  return body;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") || "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const sb = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await sb.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return json({ error: "Please sign in to chat." }, 401);

    const { messages, threadId } = (await req.json()) as { messages: UIMessage[]; threadId: string };
    const { data: thread } = await sb.from("agent_threads").select("id,title").eq("id", threadId).maybeSingle();
    if (!thread) return json({ error: "Chat not found" }, 404);

    // Persist latest user message
    const last = messages[messages.length - 1];
    if (last?.role === "user") {
      const { error } = await sb.from("agent_messages").insert({ thread_id: threadId, user_id: user.id, message: last });
      if (error) console.error("save user msg", error);
      if (thread.title === "New chat") {
        const t = last.parts.map((p: any) => (p.type === "text" ? p.text : "")).join(" ").trim().slice(0, 60);
        await sb.from("agent_threads").update({ title: t || "New chat", updated_at: new Date().toISOString() }).eq("id", threadId);
      }
    }

    const tools = {
      search_flights: tool({
        description: "Search real flight offers (Duffel). Returns cheapest options.",
        inputSchema: z.object({
          origin: z.string().describe("IATA origin"),
          destination: z.string().describe("IATA destination"),
          departure_date: z.string().describe("YYYY-MM-DD"),
          return_date: z.string().nullable().describe("YYYY-MM-DD or null for one-way"),
          adults: z.number().describe("Number of adult passengers"),
        }),
        execute: async ({ origin, destination, departure_date, return_date, adults }) => {
          const slices = [{ origin, destination, departure_date }];
          if (return_date) slices.push({ origin: destination, destination: origin, departure_date: return_date });
          const res: any = await duffel("/air/offer_requests?return_offers=true&supplier_timeout=15000", {
            method: "POST",
            body: JSON.stringify({ data: { slices, passengers: Array.from({ length: adults }, () => ({ type: "adult" })), cabin_class: "economy" } }),
          });
          if (res.notConnected) return { error: "Flight booking isn't connected yet." };
          if (res.error) return { error: res.error };
          const offers = (res.data?.offers || [])
            .sort((a: any, b: any) => Number(a.total_amount) - Number(b.total_amount))
            .slice(0, 5)
            .map((o: any) => ({
              offer_id: o.id,
              airline: o.owner?.name,
              total: Number(o.total_amount),
              currency: o.total_currency,
              per_person: Math.round((Number(o.total_amount) / adults) * 100) / 100,
              slices: o.slices.map((s: any) => ({
                from: s.origin?.iata_code,
                to: s.destination?.iata_code,
                depart: s.segments?.[0]?.departing_at,
                arrive: s.segments?.[s.segments.length - 1]?.arriving_at,
                stops: (s.segments?.length || 1) - 1,
                duration: s.duration,
              })),
              passenger_ids: o.passengers?.map((p: any) => p.id),
            }));
          return { offers };
        },
      }),
      search_events: tool({
        description: "Find real live events (Ticketmaster) in a city between dates.",
        inputSchema: z.object({
          city: z.string(),
          start_date: z.string().describe("YYYY-MM-DD"),
          end_date: z.string().describe("YYYY-MM-DD"),
          keyword: z.string().nullable(),
        }),
        execute: async ({ city, start_date, end_date, keyword }) => {
          const key = Deno.env.get("TICKETMASTER_API_KEY");
          if (!key) return { error: "Event search isn't connected yet." };
          const p = new URLSearchParams({
            apikey: key, city, size: "8", sort: "date,asc",
            startDateTime: `${start_date}T00:00:00Z`, endDateTime: `${end_date}T23:59:59Z`,
          });
          if (keyword) p.set("keyword", keyword);
          const r = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${p}`);
          if (!r.ok) return { error: `Ticketmaster error ${r.status}` };
          const d = await r.json();
          return {
            events: (d._embedded?.events || []).map((e: any) => ({
              name: e.name,
              date: e.dates?.start?.localDate,
              time: e.dates?.start?.localTime,
              venue: e._embedded?.venues?.[0]?.name,
              url: e.url,
              image: e.images?.find((i: any) => i.ratio === "16_9")?.url,
              price_min: e.priceRanges?.[0]?.min ?? null,
              currency: e.priceRanges?.[0]?.currency ?? null,
            })),
          };
        },
      }),
      list_my_trips: tool({
        description: "List the user's saved trips.",
        inputSchema: z.object({}),
        execute: async () => {
          const { data } = await sb.from("trips")
            .select("id,destination_city,destination_country,departure_date,return_date,total_per_person,itinerary_status")
            .eq("organizer_id", user.id).order("departure_date", { ascending: false }).limit(20);
          return { trips: data || [] };
        },
      }),
      get_trip: tool({
        description: "Get full details and itinerary for one saved trip.",
        inputSchema: z.object({ trip_id: z.string() }),
        execute: async ({ trip_id }) => {
          const { data } = await sb.from("trips").select("*").eq("id", trip_id).maybeSingle();
          return data ? { trip: data, link: `/trip/${trip_id}` } : { error: "Trip not found" };
        },
      }),
      prepare_booking: tool({
        description: "Create a purchase approval request for a flight offer. Does NOT buy. The user approves and pays in the app.",
        inputSchema: z.object({
          offer_id: z.string(),
          passengers: z.array(z.object({
            given_name: z.string(), family_name: z.string(), born_on: z.string().describe("YYYY-MM-DD"),
            gender: z.string().describe("m or f"), email: z.string(), phone_number: z.string().describe("E.164"),
          })),
        }),
        execute: async ({ offer_id, passengers }) => {
          const res: any = await duffel(`/air/offers/${offer_id}`);
          if (res.notConnected) return { error: "Flight booking isn't connected yet." };
          if (res.error) return { error: res.error };
          const o = res.data;
          if (o.passengers.length !== passengers.length) return { error: `This offer needs ${o.passengers.length} passengers.` };
          const pax = passengers.map((p, i) => ({ ...p, id: o.passengers[i].id, title: p.gender === "f" ? "ms" : "mr" }));
          const { data, error } = await admin.from("bookings").insert({
            user_id: user.id, thread_id: threadId, kind: "flight", duffel_offer_id: offer_id,
            passengers: pax, amount: Number(o.total_amount), currency: o.total_currency,
            summary: {
              airline: o.owner?.name,
              slices: o.slices.map((s: any) => ({ from: s.origin?.iata_code, to: s.destination?.iata_code, depart: s.segments?.[0]?.departing_at })),
              names: passengers.map((p) => `${p.given_name} ${p.family_name}`),
              expires_at: o.expires_at,
            },
          }).select("id,amount,currency,summary").single();
          if (error) return { error: error.message };
          return { booking_id: data.id, amount: data.amount, currency: data.currency, summary: data.summary, status: "awaiting_approval" };
        },
      }),
    };

    const openai = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: Deno.env.get("LOVABLE_API_KEY")!,
      headers: { "Lovable-API-Key": Deno.env.get("LOVABLE_API_KEY")!, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });

    const result = streamText({
      model: openai.responses("openai/gpt-6-astra"),
      system: SYSTEM,
      messages: convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(50),
      abortSignal: req.signal,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    return result.toUIMessageStreamResponse({
      headers: cors,
      originalMessages: messages,
      onFinish: async ({ responseMessage }) => {
        const { error } = await sb.from("agent_messages").insert({ thread_id: threadId, user_id: user.id, message: responseMessage });
        if (error) console.error("save assistant msg", error);
        await sb.from("agent_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
      },
      onError: (e) => (e instanceof Error ? e.message : "Something went wrong"),
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
