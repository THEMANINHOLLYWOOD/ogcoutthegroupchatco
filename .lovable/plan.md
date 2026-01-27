

# Fix Interactive Group Chat

Resolve the edge function connectivity issue and improve the UI by removing the "Try chatting!" tooltip.

---

## Root Cause Analysis

The "Failed to fetch" error was caused by the edge function not being fully deployed/ready when the frontend tried to call it. The function has now been redeployed and verified working.

**Test Results:**
- Direct API call to edge function: Status 200, valid JSON response
- Edge function logs: Shows successful boot
- Function deployed successfully

---

## Changes Required

### 1. Remove "Try chatting!" Tooltip

**File**: `src/components/HeroAnimation.tsx`

Remove the floating tooltip that appears above the input when interactive mode starts. This removes visual clutter and the element that may have been causing UI issues.

**Lines to remove (243-250):**
```tsx
{isInteractive && !isLoading && (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full whitespace-nowrap"
  >
    Try chatting! ✨
  </motion.div>
)}
```

### 2. Improve Error Handling

**File**: `src/lib/chatApi.ts`

Add better error handling with retry logic and more descriptive error messages:
- Add a retry mechanism for transient failures
- Improve error messages to be user-friendly
- Add logging for debugging

### 3. Add Loading State Stability

**File**: `src/components/HeroAnimation.tsx`

Ensure the UI doesn't "spaz out" during loading:
- Keep typing indicator stable during API calls
- Prevent multiple rapid submissions
- Add debouncing to prevent race conditions

---

## Implementation Details

### Updated chatApi.ts

```typescript
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
```

### Updated HeroAnimation.tsx (Input Section)

Remove the tooltip and add stability improvements:

```tsx
{/* Input bar */}
<div className="p-3 border-t border-border bg-card">
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
      <span className="text-lg">+</span>
    </div>
    <div className="flex-1">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isInteractive ? "Type a message..." : "iMessage"}
        disabled={!isInteractive || isLoading}
        className={`
          w-full bg-muted rounded-full px-4 py-2 text-sm
          placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:ring-primary/50
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-300
          ${isInteractive && !isLoading ? "ring-2 ring-primary/30" : ""}
        `}
      />
    </div>
    {isInteractive && (
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={handleSendMessage}
        disabled={!inputValue.trim() || isLoading}
        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
      >
        <Send className="w-4 h-4" />
      </motion.button>
    )}
  </div>
</div>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/HeroAnimation.tsx` | Remove "Try chatting!" tooltip, remove pulse animation, stabilize loading states |
| `src/lib/chatApi.ts` | Add retry logic and better error handling |

---

## Summary

1. **Edge function is working** - Verified with direct API call
2. **Remove distracting tooltip** - Cleaner UI without the "Try chatting!" message
3. **Add retry logic** - Handle transient network failures gracefully
4. **Stabilize animations** - Remove pulse animation that may cause visual issues
5. **Better error messages** - User-friendly feedback when things go wrong

