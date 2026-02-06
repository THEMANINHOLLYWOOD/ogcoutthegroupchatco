import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const extractTravelerInfoTool = {
  type: "function",
  function: {
    name: "extract_traveler_info",
    description:
      "Extract traveler information from an ID card, driver's license, or passport image. Extract all visible fields accurately.",
    parameters: {
      type: "object",
      properties: {
        document_type: {
          type: "string",
          enum: ["passport", "drivers_license", "national_id", "unknown"],
          description: "The type of identification document",
        },
        full_legal_name: {
          type: "string",
          description: "The complete legal name exactly as shown on the document",
        },
        first_name: {
          type: "string",
          description: "First/given name",
        },
        middle_name: {
          type: "string",
          description: "Middle name if present",
        },
        last_name: {
          type: "string",
          description: "Last/family/surname",
        },
        date_of_birth: {
          type: "string",
          description: "Date of birth in YYYY-MM-DD format",
        },
        gender: {
          type: "string",
          enum: ["M", "F", "X", "unknown"],
          description: "Gender as shown on document (M, F, X, or unknown)",
        },
        nationality: {
          type: "string",
          description: "Nationality or citizenship",
        },
        document_number: {
          type: "string",
          description: "The document/passport/license number",
        },
        expiration_date: {
          type: "string",
          description: "Document expiration date in YYYY-MM-DD format",
        },
        issue_date: {
          type: "string",
          description: "Document issue date in YYYY-MM-DD format if visible",
        },
        place_of_birth: {
          type: "string",
          description: "Place of birth if shown",
        },
        issuing_country: {
          type: "string",
          description: "Country that issued the document",
        },
        confidence: {
          type: "string",
          enum: ["high", "medium", "low"],
          description:
            "Confidence level in the extraction. High if all text is clear, medium if some fields are partially visible, low if image quality is poor",
        },
        issues: {
          type: "array",
          items: { type: "string" },
          description:
            "List any issues with the image or extraction (e.g., 'blurry text', 'glare on photo', 'partial document visible', 'expiration date unclear')",
        },
      },
      required: ["document_type", "confidence"],
    },
  },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "API configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Processing ID extraction request...");

    // Call Gemini with vision capabilities
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are an expert at extracting information from identification documents. 
              
Your task is to carefully analyze the provided ID/passport image and extract all visible traveler information.

Guidelines:
- Extract all text exactly as shown on the document
- For dates, convert to YYYY-MM-DD format
- If a field is not visible or unclear, do not guess - leave it empty
- Be honest about confidence level based on image quality
- Report any issues that might affect accuracy (glare, blur, partial visibility, etc.)
- For names, extract first, middle, and last names separately, plus the full legal name as shown`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Please extract all traveler information from this identification document image. Be thorough and accurate.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: image,
                  },
                },
              ],
            },
          ],
          tools: [extractTravelerInfoTool],
          tool_choice: {
            type: "function",
            function: { name: "extract_traveler_info" },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Service is busy. Please try again in a moment." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to process image" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== "extract_traveler_info") {
      console.error("Unexpected response format:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Could not extract information from the image" }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const travelerInfo = JSON.parse(toolCall.function.arguments);
    console.log("Extraction complete. Document type:", travelerInfo.document_type, "Confidence:", travelerInfo.confidence);

    return new Response(
      JSON.stringify({ travelerInfo }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
