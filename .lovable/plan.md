

# Itinerary-First Layout with Reactions on TripReadyStep

## Overview
This plan reorganizes the TripReadyStep page (the one with the countdown timer) to:
1. Show the itinerary before the cost breakdown
2. Enable thumbs up/down reactions on individual itinerary activities
3. Display minimalistic reaction counts on the day navigation buttons

---

## Current Layout (TripReadyStep.tsx)

```text
1. Countdown Timer
2. AI Group Image
3. Destination Card (with edit)
4. Traveler Payment Status
5. Cost Summary          ← Will move AFTER itinerary
6. Your Itinerary        ← Will move BEFORE cost
7. Share Button
```

## Target Layout

```text
1. Countdown Timer
2. AI Group Image
3. Destination Card (with edit)
4. Traveler Payment Status
5. Your Itinerary        ← Moved up, with reactions
6. Cost Summary          ← Moved down
7. Share Button
```

---

## Part 1: Swap Order of Itinerary and Cost Summary

In `TripReadyStep.tsx`, move the itinerary section (lines 368-392) above the cost summary section (lines 347-366).

---

## Part 2: Add Reactions to TripReadyStep

### New State and Logic Required

```typescript
// Import reaction functions
import { fetchReactions, subscribeToReactions, addReaction, removeReaction, ReactionsMap, getReactionKey } from "@/lib/reactionService";
import { useAuth } from "@/hooks/useAuth";

// Add state
const { user } = useAuth();
const [reactions, setReactions] = useState<ReactionsMap>(new Map());

// Load reactions
const loadReactions = useCallback(async () => {
  if (!tripId) return;
  const reactionsData = await fetchReactions(tripId, user?.id);
  setReactions(reactionsData);
}, [tripId, user?.id]);

// Subscribe to realtime updates
useEffect(() => {
  loadReactions();
  const unsubscribe = subscribeToReactions(tripId, loadReactions);
  return unsubscribe;
}, [tripId, loadReactions]);

// Handle reaction
const handleReact = async (dayNumber: number, activityIndex: number, reaction: 'thumbs_up' | 'thumbs_down') => {
  if (!user) {
    toast({ title: "Sign in required", variant: "destructive" });
    return;
  }
  const key = getReactionKey(dayNumber, activityIndex);
  const current = reactions.get(key)?.user_reaction;
  
  if (current === reaction) {
    await removeReaction(tripId, dayNumber, activityIndex);
  } else {
    await addReaction(tripId, dayNumber, activityIndex, reaction);
  }
  loadReactions();
};
```

### Pass Props to ItineraryView

```typescript
<ItineraryView 
  itinerary={itinerary}
  tripId={tripId}
  reactions={reactions}
  onReact={handleReact}
  canReact={!!user}
/>
```

---

## Part 3: Add Reaction Counts to Day Buttons

### Update ItineraryView.tsx

Add a helper function to compute total reactions per day:

```typescript
// Helper to count reactions for a day
const getDayReactionCount = (dayNumber: number): number => {
  if (!reactions) return 0;
  let count = 0;
  const day = itinerary.days.find(d => d.day_number === dayNumber);
  if (!day) return 0;
  
  day.activities.forEach((_, index) => {
    const key = getReactionKey(dayNumber, index);
    const reaction = reactions.get(key);
    if (reaction) {
      count += reaction.thumbs_up + reaction.thumbs_down;
    }
  });
  return count;
};
```

### Update Day Button UI

Show a small badge when there are reactions:

```typescript
<button className={cn("...", selectedDay === day.day_number ? "..." : "...")}>
  <span>Day {day.day_number}</span>
  {getDayReactionCount(day.day_number) > 0 && (
    <span className="ml-1.5 text-xs opacity-70">
      {getDayReactionCount(day.day_number)}
    </span>
  )}
</button>
```

Visual result:
```text
[ Day 1 · 5 ]  [ Day 2 ]  [ Day 3 · 2 ]
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/trip-wizard/TripReadyStep.tsx` | Swap order of itinerary/cost; add reaction state, handlers, and props to ItineraryView |
| `src/components/trip/ItineraryView.tsx` | Add day reaction count helper; show count on day buttons |

---

## Updated UI Preview

### Day Navigation with Reaction Counts
```text
┌─────────────────────────────────────────────────┐
│  [Day 1 · 3]  [Day 2]  [Day 3 · 7]              │
└─────────────────────────────────────────────────┘
           ↑              ↑
       3 reactions    7 reactions
       on Day 1       on Day 3
```

### Activity with Reactions
```text
┌──────────────────────────────────────────────────┐
│  9:00 AM                                          │
│  ┌──────────────────────────────────────────────┐ │
│  │ 🏛️  Eiffel Tower                              │ │
│  │     Marvel at Paris's iconic iron lady        │ │
│  │     ~$30/person  💡 Book skip-the-line!       │ │
│  │     ─────────────────────────────────────     │ │
│  │                         [👍 2] [👎 1]         │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## Summary

| Change | Impact |
|--------|--------|
| Move itinerary above cost summary | Users see activities before prices |
| Add reaction handlers to TripReadyStep | Trip creator can react to activities |
| Wire reactions to ItineraryView | Same reaction UI as public view |
| Show counts on day buttons | Quick visibility of which days have engagement |

