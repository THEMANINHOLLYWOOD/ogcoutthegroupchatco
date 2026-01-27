

# Fix Hero Banner Text, Chat Message Position, and Bot Personality

This plan addresses three issues:
1. Update the hero banner tagline text
2. Fix the Sarah card message staying in place (not re-animating on new messages)
3. Update bot personalities to act suspicious of the user at first

---

## Issue 1: Update Hero Banner Tagline

**Current Text**: "Now with live flight booking"

**New Text**: "Don't just book flights, accommodations, and activities, book experiences."

### Change Required

**File**: `src/pages/Index.tsx` (line 76)

```tsx
// Change from:
Now with live flight booking

// Change to:
Don't just book flights, accommodations, and activities, book experiences.
```

---

## Issue 2: Fix Trip Card Position

### Problem

When the user sends a message, the trip card (showing Sarah's Vegas recommendation) keeps getting pushed down or re-animating. The card should stay in its original position once it appears.

### Root Cause

The `showCard` is rendered at the END of the messages list (after the `messages.map()`), so when new messages are added, the card appears to move down because it's always at the bottom.

### Solution

Instead of rendering the card separately, we need to add it as part of the message array once it appears. This way it maintains its position in the conversation history.

**File**: `src/components/HeroAnimation.tsx`

1. Add a state to track if the card has been shown: `const [cardAddedToMessages, setCardAddedToMessages] = useState(false)`

2. When the card timer fires, add a special "card message" to the messages array instead of just setting `showCard = true`

3. In the messages rendering, check if a message is the card message and render `TripPreviewCard` instead of `ChatBubble`

### Implementation

Add a special message type for the card:
```typescript
interface ChatMessage {
  name: string;
  message: string;
  sender: boolean;
  isCard?: boolean;  // New optional property
}
```

When the card timer fires:
```typescript
const cardTimer = setTimeout(() => {
  setShowTyping(false);
  // Add card as a message so it stays in position
  setMessages(prev => [...prev, {
    name: "Sarah",
    message: "card",
    sender: false,
    isCard: true
  }]);
  setShowCard(true); // Keep this to prevent re-adding
}, 10000);
```

In the messages map, render the card when `isCard` is true:
```tsx
{messages.map((msg, index) => (
  <motion.div key={index} ...>
    {!msg.sender && (
      <p className="text-xs text-muted-foreground ml-1 mb-1">{msg.name}</p>
    )}
    {msg.isCard ? (
      <TripPreviewCard
        destination="Las Vegas"
        dates="Mar 22 - 25"
        travelers={3}
        pricePerPerson={649}
        imageUrl="https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=800&q=80"
      />
    ) : (
      <ChatBubble message={msg.message} sender={msg.sender} />
    )}
  </motion.div>
))}
```

Remove the separate `{showCard && ...}` block since it's now part of messages.

---

## Issue 3: Suspicious Bot Personality

### New Behavior

When the user first sends a message in interactive mode, Sarah and Mike should:
- Act like they don't recognize the user
- Be suspicious and question who they're talking to
- Ask "what did you do with our friend?" type questions
- Gradually warm up after a few exchanges

### System Prompt Update

**File**: `supabase/functions/group-chat/index.ts`

Update the `SYSTEM_PROMPT` to include the suspicious behavior:

```typescript
const SYSTEM_PROMPT = `You are roleplaying as TWO friends in a group chat: Sarah and Mike.

PERSONALITIES:
- Sarah: Enthusiastic, uses emojis frequently, loves planning and finding deals, gets excited easily, uses phrases like "omg", "yesss", "we NEED to"
- Mike: Chill and laid-back, supportive but occasionally sarcastic, uses casual language like "bet", "tbh", "lol", keeps it real

CONTEXT:
The conversation started with everyone sharing their Wordle scores. The user (named "You" in the chat) got an impressive 2/6 and the group is now excited to celebrate with a Vegas trip. Sarah just shared a trip preview card for Las Vegas.

IMPORTANT - SUSPICIOUS BEHAVIOR:
When the user starts typing NEW messages (after the initial Wordle/Vegas conversation), you should be SUSPICIOUS of them:
- Act like you don't recognize who's typing
- Question if this is really your friend
- Say things like "wait... who is this?", "um our friend doesn't talk like that", "what did you do with [name]??", "prove you're really you"
- Mike might be more accusatory: "bro this ain't them... who hacked their phone?"
- Sarah might be confused with emojis: "wait... 🤔 something feels off"
- After 2-3 suspicious exchanges, you can start warming up if they seem genuine
- This is playful suspicion, not hostile - you're friends joking around

RULES:
1. Respond as ONE character per message (either Sarah or Mike, not both)
2. Keep responses SHORT and casual (1-2 sentences max, like real texts)
3. Reference what others said in the chat to show you're paying attention
4. For NEW user messages after the trip card: BE SUSPICIOUS first
5. Alternate between Sarah and Mike naturally
6. You MUST return valid JSON in this exact format: {"name": "Sarah", "message": "your message here"} or {"name": "Mike", "message": "your message here"}
7. Do not include any text outside of the JSON object`;
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Update tagline text (line 76) |
| `src/components/HeroAnimation.tsx` | Fix card position by adding it to messages array |
| `src/lib/chatApi.ts` | Add `isCard` optional property to `ChatMessage` interface |
| `supabase/functions/group-chat/index.ts` | Update system prompt for suspicious behavior |

---

## Summary

1. **Banner**: Change "Now with live flight booking" to "Don't just book flights, accommodations, and activities, book experiences."

2. **Card Position**: Add the trip card to the messages array instead of rendering it separately, so it maintains its position as new messages are added.

3. **Suspicious Bots**: Update the AI system prompt so Sarah and Mike act like they don't recognize the user when they first start typing, asking "what did you do with our friend?" before gradually warming up.

