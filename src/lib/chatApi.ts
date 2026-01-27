import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  name: string;
  message: string;
  sender: boolean;
  isCard?: boolean;
}

export interface BotResponse {
  name: "Sarah" | "Mike";
  message: string;
}

const REQUEST_TIMEOUT = 30000; // 30 seconds
const RETRY_DELAY = 1500; // 1.5 seconds between retries
const MAX_RETRIES = 3;

async function invokeWithTimeout(
  messages: Array<{ name: string; message: string; sender: boolean }>,
  timeoutMs: number
): Promise<{ data: any; error: any }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await supabase.functions.invoke("group-chat", {
      body: { messages },
    });
    clearTimeout(timeoutId);
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      return { data: null, error: { message: 'Request timed out' } };
    }
    return { data: null, error: err };
  }
}

export async function sendChatMessage(
  messages: ChatMessage[], 
  retries = MAX_RETRIES,
  onRetry?: (attempt: number, maxRetries: number) => void
): Promise<BotResponse> {
  // Filter out card messages before sending to API
  const filteredMessages = messages
    .filter(msg => !msg.isCard)
    .map(({ name, message, sender }) => ({ name, message, sender }));

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`Chat API attempt ${attempt + 1}/${retries + 1}`);
      
      const { data, error } = await invokeWithTimeout(filteredMessages, REQUEST_TIMEOUT);

      if (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        lastError = new Error(error.message || 'Unknown error');
        
        // If we have retries left, wait and try again
        if (attempt < retries) {
          console.log(`Retrying in ${RETRY_DELAY}ms...`);
          onRetry?.(attempt + 1, retries);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          continue;
        }
        
        throw lastError;
      }

      // Check for API-level errors
      if (data?.error) {
        console.error("API error:", data.error);
        throw new Error(data.error);
      }

      // Validate response structure
      if (!data?.name || !data?.message) {
        console.error("Invalid response structure:", data);
        lastError = new Error("Invalid response from chat");
        
        if (attempt < retries) {
          onRetry?.(attempt + 1, retries);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          continue;
        }
        
        throw lastError;
      }

      // Success!
      console.log("Chat API success:", data.name);
      return {
        name: data.name,
        message: data.message,
      };
      
    } catch (err) {
      console.error(`Attempt ${attempt + 1} exception:`, err);
      lastError = err instanceof Error ? err : new Error('Unknown error');
      
      if (attempt < retries) {
        onRetry?.(attempt + 1, retries);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }
    }
  }

  // All retries exhausted
  console.error("All chat API attempts failed");
  throw new Error("Having trouble connecting. Give it another try!");
}
