

# Interactive AI Group Chat with Gemini 3

Transform the hero animation into a fully interactive group chat where users can type messages and receive responses from AI-powered "Sarah" and "Mike" bots, each with distinct personalities.

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              HeroAnimation Component                     │   │
│  │  - User types message in input                          │   │
│  │  - Messages state tracks full conversation              │   │
│  │  - Shows typing indicator while AI responds             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Supabase Edge Function                      │   │
│  │  /functions/v1/group-chat                                │   │
│  │  - Receives full conversation history                   │   │
│  │  - Calls Lovable AI Gateway (Gemini 3)                  │   │
│  │  - Returns response for Sarah OR Mike                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Lovable AI Gateway                          │   │
│  │  https://ai.gateway.lovable.dev/v1/chat/completions     │   │
│  │  Model: google/gemini-3-flash-preview                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### 1. Create Edge Function: `group-chat`

**File**: `supabase/functions/group-chat/index.ts`

Creates a backend function that:
- Receives full conversation history from the frontend
- Maintains context of all messages (Sarah, Mike, and user)
- Calls Lovable AI Gateway with `google/gemini-3-flash-preview`
- Generates responses from either Sarah or Mike based on conversation flow

**System Prompt Design**:
```text
You are roleplaying as TWO friends in a group chat: Sarah and Mike.
- Sarah: Enthusiastic, uses emojis, loves planning and finding deals
- Mike: Chill, supportive, occasionally sarcastic, uses casual language

The conversation started with everyone sharing their Wordle scores.
You won with a 2/6 and they're excited to celebrate with a Vegas trip.

RULES:
1. Respond as ONE character per message (either Sarah or Mike)
2. Keep responses short and casual (1-2 sentences max)
3. Reference what others said in the chat
4. Stay on topic: Wordle, Vegas trip, travel planning
5. Return JSON: {"name": "Sarah" or "Mike", "message": "..."}
```

### 2. Update Config

**File**: `supabase/config.toml`

Add the edge function configuration with JWT verification disabled for public access.

### 3. Refactor HeroAnimation Component

**File**: `src/components/HeroAnimation.tsx`

Transform from auto-playing animation to interactive chat:

| Feature | Implementation |
|---------|----------------|
| **Messages State** | `useState` array holding all messages with `{name, message, sender}` |
| **User Input** | Real input field with `onChange` and `onKeyDown` handlers |
| **Send Handler** | On submit: add user message, call edge function, add bot response |
| **Typing Indicator** | Show while waiting for AI response |
| **Auto-Scroll** | Continue scrolling to bottom on new messages |
| **Initial Animation** | Keep the Wordle opening sequence, then transition to interactive |

**Message Type**:
```typescript
interface ChatMessage {
  name: string;      // "Sarah", "Mike", or "You"
  message: string;
  sender: boolean;   // true if from user
}
```

**Conversation Flow**:
1. Wordle messages animate in (existing behavior)
2. Trip card appears
3. Input becomes active
4. User types → message appears → typing indicator → AI responds
5. Both Sarah and Mike can respond (AI decides who speaks)

### 4. Add Chat API Utility

**File**: `src/lib/chatApi.ts`

Create a helper function to call the edge function:
- Sends full message history for context
- Handles errors gracefully
- Returns parsed response with bot name and message

---

## Bot Personalities

| Bot | Personality | Example Responses |
|-----|-------------|-------------------|
| **Sarah** | Enthusiastic planner, emoji lover, finds deals | "omg yes!! I found flights for $299 ✈️", "we NEED to do this 🎉" |
| **Mike** | Chill, supportive, occasionally sarcastic | "I'm down for whatever tbh", "lol ok but who's sharing a room" |

The AI will naturally alternate between them based on conversation context.

---

## Technical Details

### Edge Function Flow

1. Receive: `{ messages: ChatMessage[] }`
2. Build system prompt with personality definitions
3. Convert messages to Gemini format with role mapping
4. Call Lovable AI Gateway
5. Parse JSON response: `{ name: "Sarah" | "Mike", message: string }`
6. Return to frontend

### Error Handling

- Show toast on API errors
- Fallback message if parsing fails
- Rate limit handling (429) with user-friendly message

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/group-chat/index.ts` | Create |
| `supabase/config.toml` | Update |
| `src/components/HeroAnimation.tsx` | Refactor |
| `src/lib/chatApi.ts` | Create |

---

## User Experience

1. User lands on homepage
2. Sees animated Wordle chat play out
3. Trip card appears, input activates with subtle glow
4. User types "what hotel should we book?"
5. Typing indicator shows
6. Sarah responds: "I was thinking the Venetian! they have a pool 🏊‍♀️"
7. Typing indicator shows again
8. Mike responds: "bet. as long as there's a buffet nearby"
9. Conversation continues naturally

---

## Summary

This implementation creates an engaging, interactive demo where visitors can actually chat with AI-powered "friends" in the group chat. The bots maintain full context of the conversation and respond with distinct personalities, showcasing how the app facilitates trip planning through natural conversation.

