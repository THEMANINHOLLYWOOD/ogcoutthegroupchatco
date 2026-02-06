import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Activity {
  time: string;
  title: string;
  description: string;
  type: 'attraction' | 'restaurant' | 'event' | 'travel' | 'free_time';
  is_live_event?: boolean;
  estimated_cost?: number;
  tip?: string;
}

interface RequestBody {
  tripId: string;
  dayNumber: number;
  activityIndex: number;
  currentActivity: Activity;
  priceDirection: 'cheaper' | 'pricier';
  destinationCity: string;
  destinationCountry: string;
  date: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const {
      tripId,
      dayNumber,
      activityIndex,
      currentActivity,
      priceDirection,
      destinationCity,
      destinationCountry,
      date,
    } = body;

    console.log(`Finding ${priceDirection} alternative for "${currentActivity.title}" in ${destinationCity}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const currentCost = currentActivity.estimated_cost || 0;
    
    const prompt = `Find a ${priceDirection === 'cheaper' ? 'cheaper' : 'pricier'} alternative in ${destinationCity}.

CURRENT: ${currentActivity.title} ($${currentCost}/person)
TYPE: ${currentActivity.type}
TIME: ${currentActivity.time}

${priceDirection === 'cheaper' 
  ? `TARGET: Under $${currentCost}. Free is great.`
  : `TARGET: Above $${currentCost}. Premium experience.`}

WRITING RULES:
- Description: One sentence. Specific details. No filler.
- Tip: One sentence. Actionable only.

BAD: "This is a wonderful place to enjoy delicious food with amazing views."
GOOD: "Michelin-starred tasting menu with Strip views."

JSON only:
{
  "time": "${currentActivity.time}",
  "title": "Place Name",
  "description": "One specific sentence.",
  "type": "${currentActivity.type}",
  "estimated_cost": 25,
  "tip": "One actionable tip."
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a travel expert. Write with smart brevity: every word earns its place. One sentence descriptions. Actionable tips only. Respond with valid JSON only." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty AI response");
    }

    console.log("AI response:", content);

    // Parse the JSON response, handling potential markdown code blocks
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent.slice(7);
    } else if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.slice(3);
    }
    if (cleanContent.endsWith("```")) {
      cleanContent = cleanContent.slice(0, -3);
    }
    cleanContent = cleanContent.trim();

    const newActivity: Activity = JSON.parse(cleanContent);

    // Validate the response has required fields
    if (!newActivity.title || !newActivity.description || !newActivity.type) {
      throw new Error("Invalid activity format from AI");
    }

    // Ensure the time slot is preserved
    newActivity.time = currentActivity.time;

    // Update the trip in the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the current trip
    const { data: tripData, error: fetchError } = await supabase
      .from("trips")
      .select("itinerary")
      .eq("id", tripId)
      .single();

    if (fetchError) {
      console.error("Error fetching trip:", fetchError);
      // Still return the new activity even if we can't update the DB
      return new Response(JSON.stringify({ success: true, activity: newActivity }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the specific activity in the itinerary
    const itinerary = tripData.itinerary as {
      overview: string;
      highlights: string[];
      days: Array<{
        day_number: number;
        date: string;
        theme: string;
        activities: Activity[];
      }>;
    };

    if (itinerary && itinerary.days) {
      const dayIndex = itinerary.days.findIndex(d => d.day_number === dayNumber);
      if (dayIndex !== -1 && itinerary.days[dayIndex].activities[activityIndex]) {
        itinerary.days[dayIndex].activities[activityIndex] = newActivity;

        const { error: updateError } = await supabase
          .from("trips")
          .update({ itinerary })
          .eq("id", tripId);

        if (updateError) {
          console.error("Error updating trip:", updateError);
        } else {
          console.log("Trip updated successfully");
        }
      }
    }

    return new Response(JSON.stringify({ success: true, activity: newActivity }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in find-alternative-activity:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to find alternative" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
