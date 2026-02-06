import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TravelerData {
  name: string;
  avatar_url?: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { tripId, userId, destinationCity, destinationCountry, travelers, travelerCount } = await req.json();

    console.log(`Generating share image for trip ${tripId}, user: ${userId || 'anonymous'}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine storage path - per-user if userId provided
    const fileName = userId 
      ? `share-images/${tripId}/${userId}.png`
      : `share-images/${tripId}.png`;

    // Check for existing cached image (only for per-user requests)
    if (userId) {
      const { data: existingFiles } = await supabase.storage
        .from("travel-media")
        .list(`share-images/${tripId}`, {
          search: `${userId}.png`
        });

      if (existingFiles && existingFiles.length > 0) {
        console.log("Found cached image for user, returning cached URL");
        const { data: urlData } = supabase.storage
          .from("travel-media")
          .getPublicUrl(fileName);
        
        return new Response(
          JSON.stringify({ success: true, imageUrl: urlData.publicUrl, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get avatar URL - either from userId lookup or legacy travelers array
    let avatarUrl: string | null = null;

    if (userId) {
      // Fetch the requesting user's profile avatar
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .eq("id", userId)
        .single();

      if (!profileError && profile?.avatar_url) {
        avatarUrl = profile.avatar_url;
        console.log(`Using profile avatar for user ${userId}`);
      }
    } else if (travelers) {
      // Legacy: use first traveler with avatar from travelers array
      const travelerList: TravelerData[] = travelers || [];
      const avatarUrls = travelerList
        .map(t => t.avatar_url)
        .filter((url): url is string => !!url);
      
      if (avatarUrls.length > 0) {
        avatarUrl = avatarUrls[0];
        console.log("Using legacy traveler avatar");
      }
    }

    const count = travelers?.length || travelerCount || 1;
    console.log(`Destination: ${destinationCity}, ${destinationCountry}, Avatar: ${avatarUrl ? 'yes' : 'no'}`);

    // Build the prompt - personalized if we have an avatar
    const basePrompt = avatarUrl
      ? `Create a stunning ultra-wide cinematic travel photo at ${destinationCity}, ${destinationCountry}.
Show a happy traveler enjoying a famous landmark, golden hour lighting, vibrant colors.
Use the reference photo to create a realistic depiction of this person at the destination.
Professional travel photography style, Instagram-worthy, 16:9 aspect ratio.
The person should look excited and joyful, capturing a perfect travel memory.`
      : `Create a stunning ultra-wide cinematic travel photo at ${destinationCity}, ${destinationCountry}.
Show ${count} diverse friends enjoying a famous landmark, golden hour lighting, vibrant colors.
Professional travel photography style, Instagram-worthy, 16:9 aspect ratio.
The friends should look happy and excited, capturing a perfect travel memory together.`;

    // Build multi-modal content array
    const contentArray: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: basePrompt }
    ];

    // Add reference photo if available
    if (avatarUrl) {
      contentArray.push({
        type: "image_url",
        image_url: { url: avatarUrl }
      });
    }

    console.log("Calling Nano Banana for image generation");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{
          role: "user",
          content: contentArray
        }],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Nano Banana API error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Nano Banana response received");

    const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 500));
      throw new Error("No image generated");
    }

    // Extract base64 data (remove data:image/png;base64, prefix if present)
    const base64Data = imageBase64.includes(",") 
      ? imageBase64.split(",")[1] 
      : imageBase64;

    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log("Uploading image to storage:", fileName);

    const { error: uploadError } = await supabase.storage
      .from("travel-media")
      .upload(fileName, bytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("travel-media")
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;
    console.log("Image uploaded successfully:", imageUrl);

    // Only update trip share_image_url for legacy (non-user) calls
    if (!userId) {
      const { error: updateError } = await supabase
        .from("trips")
        .update({ share_image_url: imageUrl })
        .eq("id", tripId);

      if (updateError) {
        console.error("Error updating trip with share_image_url:", updateError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating share image:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
