import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  name: string;
  message: string;
  sender: boolean;
}

export interface BotResponse {
  name: "Sarah" | "Mike";
  message: string;
}

export async function sendChatMessage(
  messages: ChatMessage[], 
  retries = 2
): Promise<BotResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("group-chat", {
      body: { messages },
    });

    if (error) {
      console.error("Error calling group-chat function:", error);
      
      // Retry on network errors
      if (retries > 0 && error.message?.includes("fetch")) {
        console.log(`Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return sendChatMessage(messages, retries - 1);
      }
      
      throw new Error("Connection failed. Please try again.");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    if (!data?.name || !data?.message) {
      throw new Error("Invalid response from chat");
    }

    return {
      name: data.name,
      message: data.message,
    };
  } catch (err) {
    console.error("sendChatMessage error:", err);
    throw err;
  }
}
