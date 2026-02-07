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
    const { tripId, userId, destinationCity, destinationCountry, travelers, travelerCount, type, regenerate } = await req.json();

    const isGroupImage = type === "group";
    console.log(`Generating ${isGroupImage ? 'group' : 'personal'} image for trip ${tripId}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine storage path based on type
    const fileName = isGroupImage
      ? `share-images/${tripId}/group.png`
      : userId 
        ? `share-images/${tripId}/${userId}.png`
        : `share-images/${tripId}.png`;

    // Check for existing cached image (skip if regenerate flag is true)
    if (!regenerate) {
      const searchPath = isGroupImage ? "group.png" : userId ? `${userId}.png` : null;
      if (searchPath) {
        const { data: existingFiles } = await supabase.storage
          .from("travel-media")
          .list(`share-images/${tripId}`, { search: searchPath });

        if (existingFiles && existingFiles.length > 0) {
          console.log("Found cached image, returning cached URL");
          const { data: urlData } = supabase.storage
            .from("travel-media")
            .getPublicUrl(fileName);
          
          return new Response(
            JSON.stringify({ success: true, imageUrl: urlData.publicUrl, cached: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Collect avatar URLs from travelers
    const travelerList: TravelerData[] = travelers || [];
    const avatarUrls = travelerList
      .map(t => t.avatar_url)
      .filter((url): url is string => !!url);

    // For group images, require at least one avatar - skip if none provided
    if (isGroupImage && avatarUrls.length === 0) {
      console.log("Skipping group image generation - no avatars provided");
      return new Response(
        JSON.stringify({ 
          success: true, 
          skipped: true, 
          reason: "no_avatars" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For personal images, fetch the requesting user's profile avatar
    let personalAvatarUrl: string | null = null;
    if (!isGroupImage && userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .single();

      if (profile?.avatar_url) {
        personalAvatarUrl = profile.avatar_url;
      }
    }

    // For personal images without avatar, skip generation
    if (!isGroupImage && userId && !personalAvatarUrl) {
      console.log("Skipping personal image generation - no avatar for user");
      return new Response(
        JSON.stringify({ 
          success: true, 
          skipped: true, 
          reason: "no_avatar" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const count = avatarUrls.length;
    console.log(`Destination: ${destinationCity}, ${destinationCountry}, Avatars: ${count}`);

    // Build the prompt - now only runs when we have avatars
    let basePrompt: string;
    
    if (isGroupImage) {
      basePrompt = `Create a stunning ultra-wide cinematic travel photo at ${destinationCity}, ${destinationCountry}.

CRITICAL INSTRUCTION: The reference photos below show the ACTUAL people who should appear in this image.
Generate realistic depictions of THESE SPECIFIC INDIVIDUALS at the destination.

Requirements:
- Match their exact facial features, skin tones, hair styles, and overall appearance
- Do NOT create generic or random people - recreate these SPECIFIC individuals
- Place these ${count} people at a famous landmark in ${destinationCity}
- Show them looking happy and excited, capturing a perfect travel memory together

Style: Golden hour lighting, vibrant colors, professional travel photography
Composition: Ultra-wide cinematic shot, 16:9 aspect ratio, Instagram-worthy
Mood: Authentic joy, friendship, adventure`;
    } else {
      basePrompt = `Create a stunning ultra-wide cinematic travel photo at ${destinationCity}, ${destinationCountry}.

CRITICAL INSTRUCTION: The reference photo below shows the ACTUAL person who should appear in this image.
Generate a realistic depiction of THIS SPECIFIC INDIVIDUAL at the destination.

Requirements:
- Match their exact facial features, skin tone, hair style, and overall appearance
- Do NOT create a generic or random person - recreate this SPECIFIC individual
- Place them at a famous landmark in ${destinationCity}
- Show them looking happy and excited, capturing a perfect travel memory

Style: Golden hour lighting, vibrant colors, professional travel photography
Composition: Ultra-wide cinematic shot, 16:9 aspect ratio, Instagram-worthy
Mood: Authentic joy, adventure, wanderlust`;
    }

    // Build multi-modal content array
    const contentArray: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: basePrompt }
    ];

    // Add reference photos
    if (isGroupImage) {
      // Add up to 4 avatar references for group image
      for (const url of avatarUrls.slice(0, 4)) {
        contentArray.push({
          type: "image_url",
          image_url: { url }
        });
      }
    } else if (personalAvatarUrl) {
      contentArray.push({
        type: "image_url",
        image_url: { url: personalAvatarUrl }
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

    // Only update trip share_image_url for legacy (non-user, non-group) calls
    if (!userId && !isGroupImage) {
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
