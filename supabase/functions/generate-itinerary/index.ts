import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ItineraryRequest {
  tripId: string;
  destinationCity: string;
  destinationCountry: string;
  departureDate: string;
  returnDate: string;
  travelerCount: number;
  accommodationName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { tripId, destinationCity, destinationCountry, departureDate, returnDate, travelerCount, accommodationName } = await req.json() as ItineraryRequest;

    console.log("Generating itinerary for:", { tripId, destinationCity, departureDate, returnDate });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check current status before generating to prevent race conditions
    const { data: currentTrip, error: fetchError } = await supabase
      .from("trips")
      .select("itinerary_status, itinerary")
      .eq("id", tripId)
      .single();

    if (fetchError) {
      console.error("Failed to fetch trip status:", fetchError);
      throw new Error("Trip not found");
    }

    // Skip if already complete - return stored itinerary
    if (currentTrip?.itinerary_status === "complete" && currentTrip?.itinerary) {
      console.log("Itinerary already complete, returning stored version for trip:", tripId);
      return new Response(JSON.stringify({ 
        success: true, 
        itinerary: currentTrip.itinerary,
        skipped: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip if already generating - another request is handling it
    if (currentTrip?.itinerary_status === "generating") {
      console.log("Itinerary generation already in progress for trip:", tripId);
      return new Response(JSON.stringify({ 
        success: true, 
        inProgress: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only proceed if status is "pending"
    console.log("Status is pending, proceeding with generation for trip:", tripId);

    // Update status to generating
    await supabase
      .from("trips")
      .update({ itinerary_status: "generating" })
      .eq("id", tripId);

    // Calculate number of days
    const start = new Date(departureDate);
    const end = new Date(returnDate);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const prompt = `TRIP: ${destinationCity}, ${destinationCountry}
DATES: ${departureDate} to ${returnDate} (${nights} nights)
GROUP: ${travelerCount} people
${accommodationName ? `STAYING: ${accommodationName}` : ""}

Include: landmarks, live events (${departureDate}-${returnDate}), dining, nightlife, local gems.

WRITING STYLE - SMART BREVITY:
- Overview: 1-2 punchy sentences. Lead with what makes this trip unique.
- Day themes: 2-4 words max (e.g., "Downtown & Eats", "Desert Escape")
- Descriptions: One sentence. Specific details only.
- Tips: One sentence. Actionable insider knowledge only.
- Highlights: 4-6 words each. Concrete, not generic.

BAD: "You'll absolutely love exploring the amazing sights and incredible atmosphere of this unforgettable destination!"
GOOD: "Three days of poolside mornings, rooftop bars, and a desert sunset drive."

BAD: "This is a really great restaurant that serves delicious food with a wonderful atmosphere."
GOOD: "Farm-to-table Italian. Book the patio."

Group nearby attractions. Balance activities with downtime. Note LIVE EVENTS with exact dates.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a travel expert. Write with smart brevity: every word must earn its place. No filler. No fluff. Specific beats generic. Return structured data only." },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_itinerary",
              description: "Create a structured day-by-day trip itinerary",
              parameters: {
                type: "object",
                properties: {
                  overview: {
                    type: "string",
                    description: "1-2 sentences. Lead with what's unique. No generic excitement."
                  },
                  highlights: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-4 highlights, 4-6 words each. Concrete, not generic."
                  },
                  days: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day_number: { type: "number" },
                        date: { type: "string", description: "YYYY-MM-DD" },
                        theme: { type: "string", description: "2-4 words. e.g., 'Downtown & Eats', 'Beach Day'" },
                        activities: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              time: { type: "string", description: "e.g., '10:00 AM'" },
                              title: { type: "string", description: "Place or activity name" },
                              description: { type: "string", description: "One sentence. Specific details only. No filler words." },
                              type: { 
                                type: "string", 
                                enum: ["attraction", "restaurant", "event", "travel", "free_time"]
                              },
                              is_live_event: { type: "boolean", description: "True for concerts, shows, sports on specific dates" },
                              estimated_cost: { type: "number", description: "USD per person" },
                              tip: { type: "string", description: "One sentence. Actionable insider knowledge only." }
                            },
                            required: ["time", "title", "description", "type"]
                          }
                        }
                      },
                      required: ["day_number", "date", "theme", "activities"]
                    }
                  }
                },
                required: ["overview", "highlights", "days"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_itinerary" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        await supabase.from("trips").update({ itinerary_status: "failed" }).eq("id", tripId);
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        await supabase.from("trips").update({ itinerary_status: "failed" }).eq("id", tripId);
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      await supabase.from("trips").update({ itinerary_status: "failed" }).eq("id", tripId);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    let itinerary;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        itinerary = JSON.parse(toolCall.function.arguments);
      } catch (parseError) {
        console.error("Failed to parse itinerary:", parseError);
        await supabase.from("trips").update({ itinerary_status: "failed" }).eq("id", tripId);
        throw new Error("Failed to parse itinerary response");
      }
    } else {
      console.error("No tool call in response");
      await supabase.from("trips").update({ itinerary_status: "failed" }).eq("id", tripId);
      throw new Error("No itinerary generated");
    }

    // Save itinerary to database
    const { error: updateError } = await supabase
      .from("trips")
      .update({ 
        itinerary,
        itinerary_status: "complete"
      })
      .eq("id", tripId);

    if (updateError) {
      console.error("Failed to save itinerary:", updateError);
      throw updateError;
    }

    console.log("Itinerary saved successfully for trip:", tripId);

    return new Response(JSON.stringify({ success: true, itinerary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-itinerary error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
