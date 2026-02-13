import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "You suggest a single random aspirational travel destination. Pick something exciting and fun — a place friends would spontaneously book. Vary your picks widely across the globe."
          },
          {
            role: "user",
            content: "Suggest one random travel destination for a group of friends."
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
                },
                required: ["city", "country", "emoji", "price_estimate"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_destination" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      // Fallback destination
      return new Response(JSON.stringify({ city: "Tokyo", country: "Japan", emoji: "🗼", price_estimate: 849 }), {
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

    // Fallback
    return new Response(JSON.stringify({ city: "Tokyo", country: "Japan", emoji: "🗼", price_estimate: 849 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-destination error:", e);
    return new Response(JSON.stringify({ city: "Tokyo", country: "Japan", emoji: "🗼", price_estimate: 849 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
