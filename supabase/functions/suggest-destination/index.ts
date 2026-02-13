import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK = { city: "Cartagena", country: "Colombia", emoji: "🏖️", price_estimate: 620 };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const regions = [
      "Southeast Asia", "East Asia", "South Asia", "Middle East",
      "Caribbean", "Central America", "South America", "West Africa",
      "East Africa", "North Africa", "Southern Africa",
      "Western Europe", "Eastern Europe", "Scandinavia", "Mediterranean",
      "Oceania", "Pacific Islands", "Central Asia"
    ];
    const region = regions[Math.floor(Math.random() * regions.length)];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        temperature: 2.0,
        messages: [
          {
            role: "system",
            content: `You suggest ONE iconic travel destination from ${region}. Pick a city famous for something specific — nightlife, ancient ruins, beaches, food, architecture, nature, etc. NEVER suggest Tokyo, Paris, London, New York, or Dubai. Be creative and pick lesser-known but exciting places that friends would love.`
          },
          {
            role: "user",
            content: `Give me one amazing travel destination in ${region}. Seed: ${crypto.randomUUID()}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_destination",
              description: "Return a single destination suggestion.",
              parameters: {
                type: "object",
                properties: {
                  city: { type: "string", description: "City name" },
                  country: { type: "string", description: "Country name" },
                  emoji: { type: "string", description: "A single emoji that represents this destination" },
                  price_estimate: { type: "number", description: "Estimated price per person in USD for a 3-night trip (flights + hotel), between 400 and 1200" },
                  image_search_term: { type: "string", description: "A specific famous landmark or iconic scene at this destination for image search, e.g. 'Colosseum Rome' or 'Ha Long Bay Vietnam'. Must be a real, well-known landmark." },
                },
                required: ["city", "country", "emoji", "price_estimate", "image_search_term"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_destination" } },
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status, await response.text());
      return new Response(JSON.stringify(FALLBACK), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const args = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
      return new Response(JSON.stringify(args), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(FALLBACK), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-destination error:", e);
    return new Response(JSON.stringify(FALLBACK), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
