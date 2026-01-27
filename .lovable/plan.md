
# Plan: Headline Formatting & Disable User Chat Input

## Overview

Two changes are needed:
1. **Force "out the group chat" to always appear on the second line** of the headline on both mobile and desktop
2. **Disable user input** in the chat and convert it to a continuous AI-driven demo conversation

---

## Change 1: Headline Line Break

### Current Issue
The headline is currently:
```jsx
<h1>
  Let trips make it
  <span className="text-primary"> out the group chat.</span>
</h1>
```

On different screen sizes, the text may wrap unpredictably.

### Solution
Add an explicit `<br />` tag to force the line break, ensuring "out the group chat." is always on its own line.

### File: `src/pages/Index.tsx`
```jsx
<h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold tracking-tight mb-4 lg:mb-6">
  Let trips make it<br />
  <span className="text-primary">out the group chat.</span>
</h1>
```

Note: Also remove the leading space from "out" since it's now on its own line.

---

## Change 2: Disable User Input & Create AI Loop

### Current Behavior
- User can type messages after the initial animation
- Messages are sent to Gemini and responses displayed
- This has been unreliable due to Edge Function issues

### New Behavior
- Remove the interactive input functionality
- After the trip card appears, start an automatic AI conversation loop
- Sarah and Mike continue chatting about the Vegas trip without user interaction
- The chat becomes a "demo showcase" rather than an interactive feature

### Implementation Details

#### File: `src/components/HeroAnimation.tsx`

1. **Remove user input state and handlers:**
   - Remove `inputValue`, `isLoading`, `isRetrying` states
   - Remove `handleSendMessage` and `handleKeyDown` functions
   - Remove `inputRef` and `requestInFlightRef`

2. **Replace input bar with static display:**
   - Change the input to a disabled, non-interactive state
   - Remove the send button entirely
   - Show a simple "iMessage" placeholder

3. **Add automatic conversation loop (optional enhancement):**
   - After the card appears, start a timer that periodically triggers AI responses
   - This creates a living demo where Sarah and Mike keep chatting
   - OR simply leave it as a static demo after the initial animation

### Simplified Input Bar (Static Demo Mode)
```jsx
{/* Input bar - display only, not interactive */}
<div className="p-3 border-t border-border bg-card">
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
      <span className="text-lg">+</span>
    </div>
    <div className="flex-1">
      <div className="w-full bg-muted rounded-full px-4 py-2 text-sm text-muted-foreground">
        iMessage
      </div>
    </div>
  </div>
</div>
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add `<br />` after "Let trips make it" to force line break |
| `src/components/HeroAnimation.tsx` | Remove all interactive chat functionality, replace with static input display |

---

## Technical Notes

- The Edge Function and chat API code (`src/lib/chatApi.ts`, `supabase/functions/group-chat/index.ts`) can remain in place for future use
- This change simplifies the hero section to be a pure animation/demo
- No Gemini API calls will be made after this change (only the initial warmup is removed too)
