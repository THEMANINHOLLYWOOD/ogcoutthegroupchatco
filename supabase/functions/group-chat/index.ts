import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  name: string;
  message: string;
  sender: boolean;
}

const SYSTEM_PROMPT = `You are roleplaying as TWO friends in a group chat: Sarah and Mike.

PERSONALITIES:
- Sarah: Enthusiastic, uses emojis frequently, loves planning and finding deals, gets excited easily, uses phrases like "omg", "yesss", "we NEED to"
- Mike: Chill and laid-back, supportive but occasionally sarcastic, uses casual language like "bet", "tbh", "lol", keeps it real

CONTEXT:
The conversation started with everyone sharing their Wordle scores. The user (named "You" in the chat) got an impressive 2/6 and the group is now excited to celebrate with a Vegas trip. Sarah just shared a trip preview card for Las Vegas.

RULES:
1. Respond as ONE character per message (either Sarah or Mike, not both)
2. Keep responses SHORT and casual (1-2 sentences max, like real texts)
3. Reference what others said in the chat to show you're paying attention
4. Stay on topic: Wordle victory, Vegas trip planning, travel details, group activities
5. Alternate between Sarah and Mike naturally - don't have the same person respond twice in a row unless it makes sense
6. Be helpful and engaged - these are friends planning an exciting trip together
7. You MUST return valid JSON in this exact format: {"name": "Sarah", "message": "your message here"} or {"name": "Mike", "message": "your message here"}
8. Do not include any text outside of the JSON object`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json() as { messages: ChatMessage[] };
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Convert our chat format to the API format
    const apiMessages = messages.map((msg) => ({
      role: msg.sender ? "user" : "assistant",
      content: msg.sender 
        ? msg.message 
        : `[${msg.name}]: ${msg.message}`,
    }));

    console.log("Calling Lovable AI Gateway with messages:", JSON.stringify(apiMessages, null, 2));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...apiMessages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));
    
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response from the AI
    let parsedResponse: { name: string; message: string };
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content, parseError);
      // Fallback response
      parsedResponse = {
        name: "Sarah",
        message: "omg yes!! I'm so excited for this trip! 🎉",
      };
    }

    // Validate the response
    if (!parsedResponse.name || !parsedResponse.message) {
      console.error("Invalid response structure:", parsedResponse);
      parsedResponse = {
        name: "Mike",
        message: "sounds good to me tbh",
      };
    }

    // Ensure name is either Sarah or Mike
    if (parsedResponse.name !== "Sarah" && parsedResponse.name !== "Mike") {
      parsedResponse.name = "Sarah";
    }

    console.log("Returning response:", parsedResponse);

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in group-chat function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
