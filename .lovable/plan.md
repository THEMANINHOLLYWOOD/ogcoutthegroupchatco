

# Add Reactions to Public Itinerary and Reorganize Cost Layout

## Overview
This plan adds thumbs up/down reactions to the public trip itinerary (shared link view) so all travelers can vote on activities, and moves the cost breakdown section below the itinerary so users see what they're doing first, then the cost.

---

## Current Architecture

```text
TripDashboard (organizer)          TripView (public shared link)
├── DashboardItineraryView          ├── ItineraryView
│   └── DashboardActivityCard       │   └── DayCard
│       └── ReactionBubbles ✓       │       └── ActivityBubble ✗
└── Cost Summary (simple)           └── CostSummary (detailed)
```

**Problem**: The public `TripView` page doesn't have reactions, only the organizer dashboard does.

---

## Part 1: Add Reactions to ActivityBubble

### Changes to ActivityBubble.tsx

Add props to support reactions:

```typescript
interface ActivityBubbleProps {
  activity: Activity;
  index: number;
  dayNumber: number;               // NEW
  reactions?: ReactionCounts;       // NEW
  onReact?: (reaction: 'thumbs_up' | 'thumbs_down') => void;  // NEW
  canReact?: boolean;               // NEW
}
```

Add reaction UI at the bottom of each activity bubble (after the tip):

```typescript
{/* Reactions Row */}
{onReact && (
  <div className="flex items-center justify-end pt-2 mt-2 border-t border-border/30">
    <ReactionBubbles
      counts={reactions || { thumbs_up: 0, thumbs_down: 0, user_reaction: null }}
      onReact={onReact}
      disabled={!canReact}
    />
  </div>
)}
```

---

## Part 2: Wire Reactions Through Components

### DayCard.tsx Updates

Pass reactions and callbacks through to ActivityBubble:

```typescript
interface DayCardProps {
  day: DayPlan;
  isActive: boolean;
  tripId?: string;                  // NEW
  reactions?: ReactionsMap;          // NEW
  onReact?: (dayNumber: number, activityIndex: number, reaction: 'thumbs_up' | 'thumbs_down') => void;  // NEW
  canReact?: boolean;                // NEW
}

// In render:
<ActivityBubble
  activity={activity}
  index={index}
  dayNumber={day.day_number}
  reactions={reactions?.get(getReactionKey(day.day_number, index))}
  onReact={(reaction) => onReact?.(day.day_number, index, reaction)}
  canReact={canReact}
/>
```

### ItineraryView.tsx Updates

Accept and pass reactions props:

```typescript
interface ItineraryViewProps {
  itinerary: Itinerary;
  tripId?: string;
  reactions?: ReactionsMap;          // NEW
  onReact?: (dayNumber: number, activityIndex: number, reaction: 'thumbs_up' | 'thumbs_down') => void;  // NEW
  canReact?: boolean;                // NEW
  // ... existing props
}
```

---

## Part 3: Integrate Reactions in TripView

### TripView.tsx Updates

1. Import reaction functions and hooks
2. Add reaction state management (similar to TripDashboard)
3. Subscribe to realtime reaction updates
4. Pass reactions to ItineraryView

```typescript
// New imports
import { fetchReactions, subscribeToReactions, addReaction, removeReaction, ReactionsMap, getReactionKey } from "@/lib/reactionService";
import { useAuth } from "@/hooks/useAuth";

// New state
const { user } = useAuth();
const [reactions, setReactions] = useState<ReactionsMap>(new Map());

// Load and subscribe to reactions
const loadReactions = useCallback(async () => {
  if (!tripId) return;
  const reactionsData = await fetchReactions(tripId, user?.id);
  setReactions(reactionsData);
}, [tripId, user?.id]);

// Handle reaction toggle
const handleReact = async (dayNumber: number, activityIndex: number, reaction: 'thumbs_up' | 'thumbs_down') => {
  if (!tripId || !user) {
    toast({ title: "Sign in required", description: "Please sign in to react", variant: "destructive" });
    return;
  }
  
  const key = getReactionKey(dayNumber, activityIndex);
  const currentReaction = reactions.get(key)?.user_reaction;
  
  if (currentReaction === reaction) {
    await removeReaction(tripId, dayNumber, activityIndex);
  } else {
    await addReaction(tripId, dayNumber, activityIndex, reaction);
  }
  
  loadReactions();
};

// Pass to ItineraryView
<ItineraryView 
  itinerary={trip.itinerary}
  tripId={trip.id}
  reactions={reactions}
  onReact={handleReact}
  canReact={!!user}
  ...
/>
```

---

## Part 4: Reorganize Layout - Itinerary First, Then Costs

### Current TripView Layout:
```text
1. Hero Header
2. Itinerary Section
3. Cost Breakdown Section  ← Already in correct order!
4. Share Section (sticky)
```

Actually the current layout already shows itinerary first, then costs. But I'll verify the CostSummary shows the itemized activities after the base costs.

### CostSummary Already Shows:
1. Base Trip Total (collapsed header)
2. When expanded:
   - Accommodation details
   - Activities & Experiences (itemized by day)
   - Per Person Breakdown

**This is correct** - shows base cost first, then activity costs can be added.

---

## Part 5: Remove LIVE Badge from DashboardActivityCard

I noticed `DashboardActivityCard.tsx` still shows the LIVE badge (line 88-92). Remove it for consistency:

```typescript
// Remove these lines (88-92):
{activity.is_live_event && (
  <span className="text-[10px] sm:text-xs font-medium text-destructive px-2 py-0.5 sm:py-1 bg-destructive/10 rounded-full">
    🎫 Live
  </span>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/trip/ActivityBubble.tsx` | Add reactions props and ReactionBubbles component |
| `src/components/trip/DayCard.tsx` | Pass tripId, reactions, onReact, canReact to ActivityBubble |
| `src/components/trip/ItineraryView.tsx` | Accept and pass reactions props |
| `src/pages/TripView.tsx` | Add reaction state, load/subscribe to reactions, pass to ItineraryView |
| `src/components/trip/DashboardActivityCard.tsx` | Remove LIVE badge |

---

## Data Flow

### Public Trip View Reactions Flow
```text
1. User opens shared trip link (/trip/{id})
2. TripView loads trip data + reactions
3. Subscribes to realtime reaction updates
4. User taps thumbs up/down on activity
   └─ If not signed in → Show "sign in required" toast
   └─ If signed in → Toggle reaction in database
5. Realtime subscription triggers → Reload reactions
6. All other viewers see updated counts instantly
```

### Realtime Updates
Both the organizer dashboard and public trip view subscribe to the same `activity_reactions` table. When anyone reacts:
1. Database updates
2. Realtime event fires
3. Both views reload reactions
4. UI updates for all viewers

---

## Updated UI Preview

### Activity Bubble (Public View)
```text
┌──────────────────────────────────────────────────┐
│  9:00 AM                                          │
│  ┌──────────────────────────────────────────────┐ │
│  │ 🏛️  Eiffel Tower                              │ │
│  │     Marvel at Paris's iconic iron lady        │ │
│  │                                               │ │
│  │     ~$30/person  💡 Book skip-the-line!       │ │
│  │     ─────────────────────────────────────     │ │
│  │                         [👍 3] [👎 0]         │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## Summary

| Change | Impact |
|--------|--------|
| Add reactions to ActivityBubble | Public trip viewers can vote |
| Wire reactions through components | Clean prop drilling |
| Integrate in TripView | Full reaction support on shared links |
| Realtime subscriptions | Everyone sees live updates |
| Remove LIVE badge from dashboard | Consistent with ActivityBubble cleanup |

