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

    // Update status to generating
    await supabase
      .from("trips")
      .update({ itinerary_status: "generating" })
      .eq("id", tripId);

    // Calculate number of days
    const start = new Date(departureDate);
    const end = new Date(returnDate);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const prompt = `You are a world-class travel planner creating an unforgettable trip itinerary.

TRIP DETAILS:
- Destination: ${destinationCity}, ${destinationCountry}
- Dates: ${departureDate} to ${returnDate} (${nights} nights)
- Group Size: ${travelerCount} people
${accommodationName ? `- Accommodation: ${accommodationName}` : ""}

Search for and include:
1. MUST-SEE ATTRACTIONS: Classic landmarks and top experiences in ${destinationCity}
2. LIVE EVENTS: Search for concerts, shows, sports events, festivals happening during ${departureDate} to ${returnDate}
3. DINING: Best restaurants for groups, mix of casual and upscale options
4. NIGHTLIFE: Top bars, clubs, experiences for groups
5. LOCAL SECRETS: Off-the-beaten-path gems and local favorites

Create a day-by-day itinerary that:
- Balances activities with downtime
- Groups nearby attractions together
- Includes specific times for each activity
- Notes which activities are LIVE EVENTS with their exact dates
- Estimates costs in USD where applicable
- Provides insider tips for key activities

IMPORTANT: Be specific about live events - search for real concerts, shows, and events happening during these exact dates.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a travel expert who creates detailed, personalized itineraries. Always search for current events and real attractions. Return structured data only." },
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
                    description: "A 2-3 sentence exciting overview of the trip"
                  },
                  highlights: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-4 key highlights of the trip"
                  },
                  days: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day_number: { type: "number" },
                        date: { type: "string", description: "Date in YYYY-MM-DD format" },
                        theme: { type: "string", description: "Theme for the day, e.g., 'Explore the Strip'" },
                        activities: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              time: { type: "string", description: "Time like '10:00 AM'" },
                              title: { type: "string" },
                              description: { type: "string" },
                              type: { 
                                type: "string", 
                                enum: ["attraction", "restaurant", "event", "travel", "free_time"]
                              },
                              is_live_event: { type: "boolean", description: "True for concerts, shows, sports happening on specific dates" },
                              estimated_cost: { type: "number", description: "Cost per person in USD" },
                              tip: { type: "string", description: "Insider tip" }
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
