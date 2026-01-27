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

export async function sendChatMessage(messages: ChatMessage[]): Promise<BotResponse> {
  const { data, error } = await supabase.functions.invoke("group-chat", {
    body: { messages },
  });

  if (error) {
    console.error("Error calling group-chat function:", error);
    throw new Error(error.message || "Failed to get response from chat");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return {
    name: data.name,
    message: data.message,
  };
}
