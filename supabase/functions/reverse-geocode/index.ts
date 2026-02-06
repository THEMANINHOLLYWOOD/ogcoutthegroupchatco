import { Hono } from "https://deno.land/x/hono@v3.12.6/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const app = new Hono();

app.options("/*", (c) => {
  return c.text("ok", 200, corsHeaders);
});

app.post("/", async (c) => {
  try {
    const { latitude, longitude } = await c.req.json();

    if (!latitude || !longitude) {
      return c.json(
        { error: "latitude and longitude are required" },
        400,
        corsHeaders
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
      return c.json(
        { error: "Failed to fetch location data" },
        500,
        corsHeaders
      );
    }

    const data = await response.json();
    console.log("Nominatim response:", JSON.stringify(data.address));

    if (!data.address) {
      return c.json(
        { error: "Could not determine location" },
        404,
        corsHeaders
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

    return c.json(
      {
        city,
        state,
        country,
        countryCode,
        raw: address, // Include raw data for debugging
      },
      200,
      corsHeaders
    );
  } catch (error) {
    console.error("Reverse geocode error:", error);
    return c.json(
      { error: "Internal server error" },
      500,
      corsHeaders
    );
  }
});

Deno.serve(app.fetch);
