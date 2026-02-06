const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "latitude and longitude are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Reverse geocoding: ${latitude}, ${longitude}`);

    // Use OpenStreetMap Nominatim API (free, no API key required)
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "OutTheGroupChat/1.0 (travel-app)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("Nominatim API error:", response.status);
      return new Response(
        JSON.stringify({ error: "Failed to fetch location data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Nominatim response:", JSON.stringify(data.address));

    if (!data.address) {
      return new Response(
        JSON.stringify({ error: "Could not determine location" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const address = data.address;

    // Extract city - Nominatim uses various fields for city
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.hamlet ||
      address.suburb ||
      null;

    // Extract state/province
    const state = address.state || address.province || address.region || null;

    // Extract country
    const country = address.country || null;

    // Get country code for flag emoji
    const countryCode = address.country_code?.toUpperCase() || null;

    console.log(`Parsed location: ${city}, ${state}, ${country}`);

    return new Response(
      JSON.stringify({
        city,
        state,
        country,
        countryCode,
        raw: address,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Reverse geocode error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
