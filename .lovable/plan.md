
# Plan: Itinerary Costs + Price Adjustment Feature

## Overview

This feature adds two enhancements to the trip view:

1. **Itinerary Costs in Breakdown**: Sum all activity costs from the itinerary and display them in the expandable cost summary alongside flights and accommodation.

2. **Price Adjustment Controls**: Add minimalistic +/- buttons to each activity that has a cost. Clicking these triggers Gemini to find a cheaper or more expensive alternative activity in the same city, with ultra-smooth animations when the activity is replaced.

---

## User Flow

```text
[Trip View - Itinerary]
      |
      | Each activity shows cost (if any)
      | +/- buttons appear on hover/tap
      v
[User taps + or -]
      |
      | Activity enters "searching" state
      | Subtle pulse/loading animation
      v
[Gemini searches for alternative]
      |
      | Finds activity above/below current price
      v
[Smooth replacement animation]
      |
      | Old activity fades/slides out
      | New activity fades/slides in
      | Cost updates in real-time
      v
[Cost Breakdown updates]
      |
      | "Activities" line item reflects new total
```

---

## Implementation Steps

### Step 1: Update CostSummary Component

Add a new "Activities" section that sums all itinerary costs:

**File: `src/components/trip/CostSummary.tsx`**

Changes:
- Accept `itinerary` prop
- Calculate total activities cost from all days
- Display as a new expandable section with per-activity breakdown
- Show activities cost per person (divided by traveler count)

### Step 2: Update TripView to Pass Itinerary

**File: `src/pages/TripView.tsx`**

Changes:
- Pass `itinerary` and `travelerCount` to CostSummary component

### Step 3: Create Alternative Activity Edge Function

**File: `supabase/functions/find-alternative-activity/index.ts`**

New edge function that:
- Receives: tripId, dayNumber, activityIndex, currentActivity, priceDirection ('cheaper' | 'pricier'), destination, date
- Uses Gemini to search for an alternative activity
- Returns a new Activity object with updated cost
- Optionally updates the trip in the database

### Step 4: Add Activity Service Functions

**File: `src/lib/tripService.ts`**

New functions:
- `findAlternativeActivity(params)` - Calls the edge function
- `updateActivityInItinerary(tripId, dayNumber, activityIndex, newActivity)` - Updates the database

### Step 5: Update ActivityBubble with +/- Controls

**File: `src/components/trip/ActivityBubble.tsx`**

Changes:
- Add `onFindCheaper` and `onFindPricier` callback props
- Add +/- buttons that appear on activities with costs
- Show loading state when searching
- Implement AnimatePresence for smooth swap animation

### Step 6: Update DayCard to Handle Activity Replacement

**File: `src/components/trip/DayCard.tsx`**

Changes:
- Add callback props for price adjustments
- Pass tripId, dayNumber context to ActivityBubble
- Handle loading states per activity

### Step 7: Update ItineraryView to Orchestrate Changes

**File: `src/components/trip/ItineraryView.tsx`**

Changes:
- Add `tripId`, `destinationCity`, `onActivityUpdate` props
- Implement `handleFindAlternative` function
- Track which activities are currently loading
- Call service function and update local state optimistically

### Step 8: Update TripView to Handle Itinerary Updates

**File: `src/pages/TripView.tsx`**

Changes:
- Pass required props to ItineraryView
- Handle activity updates from ItineraryView

### Step 9: Update supabase/config.toml

Add the new edge function configuration.

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/find-alternative-activity/index.ts` | Create | AI-powered activity replacement |
| `supabase/config.toml` | Modify | Add find-alternative-activity function |
| `src/lib/tripService.ts` | Modify | Add findAlternativeActivity function |
| `src/lib/tripTypes.ts` | Modify | Add ActivitySearchRequest type |
| `src/components/trip/CostSummary.tsx` | Modify | Add itinerary costs section |
| `src/components/trip/ActivityBubble.tsx` | Modify | Add +/- controls and swap animation |
| `src/components/trip/DayCard.tsx` | Modify | Pass adjustment handlers |
| `src/components/trip/ItineraryView.tsx` | Modify | Orchestrate activity replacement |
| `src/pages/TripView.tsx` | Modify | Connect components and pass props |

---

## Technical Details

### Edge Function Prompt Structure

```typescript
const prompt = `You are a travel expert. Find an alternative activity in ${destinationCity} on ${date}.

CURRENT ACTIVITY:
- Title: ${currentActivity.title}
- Type: ${currentActivity.type}
- Current Cost: $${currentActivity.estimated_cost}/person
- Time: ${currentActivity.time}

REQUIREMENT: Find a ${priceDirection === 'cheaper' ? 'CHEAPER' : 'MORE PREMIUM/EXPENSIVE'} alternative.

${priceDirection === 'cheaper' 
  ? `Target price: Under $${currentActivity.estimated_cost}/person. Could be free!`
  : `Target price: Above $${currentActivity.estimated_cost}/person. More upscale/exclusive.`}

Return a similar type of activity (${currentActivity.type}) but at the ${priceDirection === 'cheaper' ? 'lower' : 'higher'} price point.
Maintain the same time slot.`;
```

### Activity Replacement Animation

The key to ultra-smooth animation is using `AnimatePresence` with `mode="popLayout"`:

```typescript
<AnimatePresence mode="popLayout">
  <motion.div
    key={activity.title} // Unique key triggers animation on change
    initial={{ opacity: 0, y: -10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 10, scale: 0.95 }}
    layout
    transition={{
      type: "spring",
      stiffness: 500,
      damping: 30,
    }}
  >
    {/* Activity content */}
  </motion.div>
</AnimatePresence>
```

### +/- Button Design

Minimalistic, appearing on hover/focus:

```typescript
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  className="flex items-center gap-1"
>
  <button
    onClick={onFindCheaper}
    className="w-6 h-6 rounded-full bg-muted hover:bg-muted/80 
               flex items-center justify-center text-muted-foreground
               hover:text-foreground transition-colors"
  >
    <Minus className="w-3 h-3" />
  </button>
  <button
    onClick={onFindPricier}
    className="w-6 h-6 rounded-full bg-muted hover:bg-muted/80
               flex items-center justify-center text-muted-foreground
               hover:text-foreground transition-colors"
  >
    <Plus className="w-3 h-3" />
  </button>
</motion.div>
```

### Loading State

While searching for an alternative:

```typescript
{isSearching ? (
  <motion.div
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 1, repeat: Infinity }}
    className="absolute inset-0 bg-background/80 backdrop-blur-sm 
               rounded-2xl flex items-center justify-center"
  >
    <Loader2 className="w-5 h-5 animate-spin text-primary" />
    <span className="ml-2 text-sm text-muted-foreground">
      Finding alternatives...
    </span>
  </motion.div>
) : null}
```

### Cost Calculation Helper

```typescript
function calculateItineraryCost(itinerary: Itinerary): number {
  return itinerary.days.reduce((total, day) => {
    return total + day.activities.reduce((dayTotal, activity) => {
      return dayTotal + (activity.estimated_cost || 0);
    }, 0);
  }, 0);
}
```

---

## UI/UX Details

### ActivityBubble Layout Update

Current cost display enhanced with +/- controls:

```
[10:00 AM] [Activity Bubble                              ]
           [Icon] Title                    [$45/person +/-]
           Description text here...
           Tip: Some insider tip
```

The +/- buttons appear:
- Always visible on mobile (touch targets need to be accessible)
- On hover on desktop
- Highlighted when the activity has a cost > 0

### CostSummary Activities Section

New section in the expandable breakdown:

```
Trip Total: $3,240
~$1,080/person

[Expanded View]
├── The Venetian Resort (4.5★)
│   $299/night × 3 nights = $897
│
├── Activities & Experiences
│   Day 1: $120 (3 activities)
│   Day 2: $85 (4 activities)
│   Day 3: $45 (2 activities)
│   Total: $250/person
│
└── Per Person Breakdown
    ├── John (from LAX): $1,080
    ├── Sarah (from JFK): $1,120
    └── Mike (from ORD): $1,040
```

### Animation Sequence for Activity Swap

1. User taps +/- button
2. Button scales down slightly (haptic feedback feel)
3. Activity bubble shows subtle overlay with spinner
4. Old activity slides up and fades out
5. New activity slides down and fades in
6. Cost badge updates with a pop animation
7. Total cost in header recalculates

### Error Handling

If the AI can't find an alternative:
- Show subtle toast: "Couldn't find a {cheaper/pricier} option"
- Activity returns to normal state
- No change to itinerary

---

## Data Flow

```text
[User taps "-" on $50 restaurant]
      |
      v
[ItineraryView.handleFindAlternative()]
      |
      | Set loading state for that activity
      v
[tripService.findAlternativeActivity()]
      |
      | Call edge function
      v
[find-alternative-activity edge function]
      |
      | Gemini search for cheaper restaurant
      | Returns new Activity object
      v
[Update local state optimistically]
      |
      | Replace activity in itinerary
      v
[Update database]
      |
      | Save new itinerary to trips table
      v
[Realtime subscription triggers]
      |
      | Other users see the change
      v
[UI animations complete]
```

---

## Security & Performance

- Edge function uses service role key for database updates
- Rate limiting inherited from Lovable AI gateway
- Optimistic UI updates for responsiveness
- Database update is non-blocking (fire and forget)
- Only activities with costs show the +/- controls
