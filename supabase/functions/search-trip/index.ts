import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { installAiShim } from "../_shared/ai.ts";
installAiShim();
import { webSearch } from "../_shared/perplexity.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TravelerRequest {
  name: string;
  origin: {
    iata: string;
    city: string;
    country: string;
  };
  isOrganizer: boolean;
}

interface SearchRequest {
  destination: {
    iata: string;
    city: string;
    country: string;
  };
  travelers: TravelerRequest[];
  departureDate: string;
  returnDate: string;
  accommodationType?: "airbnb" | "hotel";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const request: SearchRequest = await req.json();
    console.log("Search trip request:", JSON.stringify(request));

    const { destination, travelers, departureDate, returnDate, accommodationType = "hotel" } = request;

    // Calculate number of nights
    const departure = new Date(departureDate);
    const returnDt = new Date(returnDate);
    const nights = Math.ceil((returnDt.getTime() - departure.getTime()) / (1000 * 60 * 60 * 24));

    // Build the prompt for Gemini
    const travelerRoutes = travelers.map(t => 
      `- ${t.name}: Flying from ${t.origin.city} (${t.origin.iata}) to ${destination.city} (${destination.iata})`
    ).join("\n");

    // Accommodation-specific prompt section
    const accommodationPrompt = accommodationType === "airbnb"
      ? `2. A well-rated Airbnb or vacation rental that can comfortably accommodate ${travelers.length} guests. 
   Look for entire homes/apartments with good reviews, modern amenities, and central location.
   Provide realistic nightly rates for vacation rentals in ${destination.city}.`
      : `2. A mid-range hotel (3-4 star) with enough rooms for the group.
   Consider hotels with good location, breakfast included if possible, and standard amenities.
   Provide realistic nightly rates for hotels in ${destination.city}.`;

    const uniqueOrigins = [...new Set(travelers.map(t => t.origin.iata))];
    const searches = await Promise.all([
      ...uniqueOrigins.map(o => webSearch(`Cheapest round-trip economy flights from ${o} to ${destination.iata} departing ${departureDate} returning ${returnDate}. List airline, departure and arrival times, price in USD per person, and where it's listed (Google Flights, Kayak, Expedia, airline site).`)),
      webSearch(accommodationType === "airbnb"
        ? `Best-rated Airbnb or vacation rental in ${destination.city}, ${destination.country} for ${travelers.length} guests, ${departureDate} to ${returnDate}. Give name, nightly price in USD, rating, and listing URL.`
        : `Best-rated 3-4 star hotel in ${destination.city}, ${destination.country} for ${departureDate} to ${returnDate}. Give name, nightly price in USD, star rating, and booking URL.`),
    ]);
    const liveResults = searches.map((r, i) => `--- Search ${i + 1} ---\n${r || "(no results)"}`).join("\n\n");

    const prompt = `You are a travel planning assistant. Search for realistic flight and accommodation pricing for a group trip.

TRIP DETAILS:
- Destination: ${destination.city}, ${destination.country} (${destination.iata})
- Departure Date: ${departureDate}
- Return Date: ${returnDate}
- Duration: ${nights} nights
- Number of Travelers: ${travelers.length}
- Accommodation Type: ${accommodationType === "airbnb" ? "Airbnb/Vacation Rental" : "Hotel"}

TRAVELERS AND ROUTES:
${travelerRoutes}

LIVE WEB SEARCH RESULTS (use these real prices, airlines, times and source URLs; only estimate when nothing was found, and mark is_estimate true):
${liveResults}

Provide, based on the live results:
1. Round-trip flights for each traveler from their origin to ${destination.iata}
${accommodationPrompt}
3. Calculate the per-person cost breakdown including their share of accommodation

Set source_url to the matching SOURCES link for each price. Keep airline and hotel names clean (no notes like "suggested" or "unverified"); use is_estimate for that. Prefer a specific named hotel/listing found in the results with its URL.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "compile_trip_results",
          description: "Compile the flight and accommodation search results into a structured format",
          parameters: {
            type: "object",
            properties: {
              flights: {
                type: "array",
                description: "Flight information for each traveler",
                items: {
                  type: "object",
                  properties: {
                    traveler_name: { type: "string", description: "Name of the traveler" },
                    origin: { type: "string", description: "Origin airport IATA code" },
                    destination: { type: "string", description: "Destination airport IATA code" },
                    outbound_price: { type: "number", description: "One-way outbound flight price in USD" },
                    return_price: { type: "number", description: "One-way return flight price in USD" },
                    airline: { type: "string", description: "Suggested airline" },
                    departure_time: { type: "string", description: "Approximate departure time" },
                    arrival_time: { type: "string", description: "Approximate arrival time" },
                    source_url: { type: "string", description: "URL where this fare was found" },
                    is_estimate: { type: "boolean", description: "True if not confirmed by live search" },
                  },
                  required: ["traveler_name", "origin", "destination", "outbound_price", "return_price", "airline"],
                },
              },
              accommodation: {
                type: "object",
                description: "Accommodation details",
                properties: {
                  name: { type: "string", description: "Hotel/accommodation name" },
                  price_per_night: { type: "number", description: "Price per night in USD" },
                  total_nights: { type: "number", description: "Number of nights" },
                  rating: { type: "number", description: "Star rating (1-5)" },
                  source_url: { type: "string", description: "Listing or booking URL" },
                  is_estimate: { type: "boolean", description: "True if not confirmed by live search" },
                },
                required: ["name", "price_per_night", "total_nights", "rating"],
              },
            },
            required: ["flights", "accommodation"],
          },
        },
      },
    ];

    console.log("Calling Lovable AI Gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a travel planning assistant Use the live web search results provided. Never invent sources." },
          { role: "user", content: prompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "compile_trip_results" } },
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
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response:", JSON.stringify(aiResponse));

    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "compile_trip_results") {
      throw new Error("No valid tool call in response");
    }

    const tripData = JSON.parse(toolCall.function.arguments);
    console.log("Parsed trip data:", JSON.stringify(tripData));

    // Calculate totals
    const accommodationTotal = tripData.accommodation.price_per_night * tripData.accommodation.total_nights;
    const accommodationPerPerson = Math.round(accommodationTotal / travelers.length);

    const breakdown = tripData.flights.map((flight: any) => {
      const flightCost = flight.outbound_price + flight.return_price;
      return {
        traveler_name: flight.traveler_name,
        origin: flight.origin,
        destination: flight.destination,
        flight_cost: flightCost,
        accommodation_share: accommodationPerPerson,
        subtotal: flightCost + accommodationPerPerson,
      };
    });

    const tripTotal = breakdown.reduce((sum: number, b: any) => sum + b.subtotal, 0);
    const perPersonAverage = Math.round(tripTotal / travelers.length);

    const result = {
      flights: tripData.flights,
      accommodation: {
        ...tripData.accommodation,
        total_price: accommodationTotal,
      },
      breakdown,
      total_per_person: perPersonAverage,
      trip_total: tripTotal,
    };

    console.log("Final result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Search trip error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to search for trips" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
