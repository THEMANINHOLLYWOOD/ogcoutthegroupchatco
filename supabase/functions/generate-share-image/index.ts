import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { tripId, destinationCity, destinationCountry, travelerCount } = await req.json();

    console.log(`Generating share image for trip ${tripId}: ${travelerCount} travelers to ${destinationCity}, ${destinationCountry}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Generate image using Nano Banana (Gemini)
    const prompt = `Generate a stunning travel photo: ${travelerCount} diverse friends enjoying ${destinationCity}, ${destinationCountry}. 
Candid travel moment, golden hour lighting, vibrant colors, professional travel photography style. 
Show iconic landmarks or scenery of ${destinationCity} in the background. 
The friends should look happy and excited, capturing a perfect travel memory.
16:9 aspect ratio, high quality, Instagram-worthy travel photo.`;

    console.log("Calling Nano Banana with prompt:", prompt);

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
          content: prompt
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
