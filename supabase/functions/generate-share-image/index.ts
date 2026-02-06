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
    const { tripId, destinationCity, destinationCountry, travelers, travelerCount } = await req.json();

    // Support both old format (travelerCount) and new format (travelers array)
    const travelerList: TravelerData[] = travelers || [];
    const count = travelerList.length || travelerCount || 1;

    console.log(`Generating share image for trip ${tripId}: ${count} travelers to ${destinationCity}, ${destinationCountry}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Collect avatar URLs for multi-modal generation
    const avatarUrls = travelerList
      .map(t => t.avatar_url)
      .filter((url): url is string => !!url);

    console.log(`Found ${avatarUrls.length} traveler photos for reference`);

    // Build the prompt
    const basePrompt = `Create a stunning ultra-wide cinematic travel photo at ${destinationCity}, ${destinationCountry}.
Show ${count} diverse friends enjoying a famous landmark, golden hour lighting, vibrant colors.
Professional travel photography style, Instagram-worthy, 16:9 aspect ratio.
The friends should look happy and excited, capturing a perfect travel memory together.`;

    // Build multi-modal content array
    const contentArray: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: basePrompt }
    ];

    // Add reference photos if available
    if (avatarUrls.length > 0) {
      contentArray[0].text = `${basePrompt}

IMPORTANT: Use the reference photos below as inspiration for the faces/appearance of the people in the image. Create realistic depictions of these travelers enjoying ${destinationCity} together.`;

      for (const url of avatarUrls.slice(0, 4)) { // Limit to 4 reference photos
        contentArray.push({
          type: "image_url",
          image_url: { url }
        });
      }
    }

    console.log("Calling Nano Banana with multi-modal content");

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

    // Initialize Supabase client with service role for storage access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upload to storage
    const fileName = `share-images/${tripId}.png`;
    
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

    // Update trip with share_image_url
    const { error: updateError } = await supabase
      .from("trips")
      .update({ share_image_url: imageUrl })
      .eq("id", tripId);

    if (updateError) {
      console.error("Error updating trip with share_image_url:", updateError);
      // Don't throw - image is still uploaded successfully
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
