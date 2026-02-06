
# Plan: Dashboard Itinerary with Emoji Reactions + Organizer Event Management

## Overview

Enhance the Trip Dashboard with three key features:

1. **Embedded Itinerary View**: Display the full itinerary in the dashboard so all travelers can see activities
2. **Emoji Reactions**: Signed-in users can react (👍/👎) to activities in real-time
3. **Organizer Event Management**: After all travelers have paid, the organizer can add/remove activities

All designed mobile-first with minimalistic Apple-style aesthetics and ultra-smooth Framer Motion animations.

---

## User Experience Flow

```text
[Traveler opens shared link]
          |
          v
[Trip Dashboard]
┌─────────────────────────────────────┐
│ 🗓 Paris, France                    │
│ Mar 15-18, 2024                     │
├─────────────────────────────────────┤
│ [Countdown Timer / Confirmation]    │
├─────────────────────────────────────┤
│ Travelers & Payment                 │
│ John [$1,080] → [Pay]              │
│ Sarah [$1,080] → ✓ Paid            │
├─────────────────────────────────────┤
│ 📍 Itinerary                        │
│                                     │
│ Day 1  Day 2  Day 3                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🏛 Louvre Museum                │ │
│ │ Explore the famous museum...    │ │
│ │ ~$20/person                     │ │
│ │                                 │ │
│ │ 👍 3    👎 1    [+ Add]        │ │← Reactions + Organizer add
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [Share with Friends]               │
└─────────────────────────────────────┘
```

---

## Database Design

### New Table: `activity_reactions`

Stores emoji reactions from signed-in users on specific activities:

```sql
CREATE TABLE activity_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  day_number integer NOT NULL,
  activity_index integer NOT NULL,
  reaction text NOT NULL CHECK (reaction IN ('thumbs_up', 'thumbs_down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (trip_id, user_id, day_number, activity_index)
);

-- Enable RLS
ALTER TABLE activity_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can read reactions for trips they can view
CREATE POLICY "Anyone can view reactions"
  ON activity_reactions FOR SELECT
  USING (true);

-- Authenticated users can insert their own reactions
CREATE POLICY "Users can add their own reactions"
  ON activity_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reactions
CREATE POLICY "Users can update own reactions"
  ON activity_reactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own reactions  
CREATE POLICY "Users can delete own reactions"
  ON activity_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE activity_reactions;
```

---

## Implementation Steps

### Step 1: Database Migration

Create the `activity_reactions` table with RLS policies and realtime enabled.

### Step 2: Create Reaction Service Functions

**File: `src/lib/reactionService.ts`**

New service file for managing reactions:

```typescript
// Functions to implement:
- fetchReactions(tripId: string) → Map of reactions by activity key
- addReaction(tripId, dayNumber, activityIndex, reaction) → Add/update reaction
- removeReaction(tripId, dayNumber, activityIndex) → Remove user's reaction
- subscribeToReactions(tripId, onUpdate) → Realtime subscription
```

### Step 3: Create ReactionBubbles Component

**File: `src/components/trip/ReactionBubbles.tsx`**

Compact emoji reaction display with counts:

```typescript
// Features:
- Shows 👍 count and 👎 count
- Highlights if current user has reacted
- Tapping toggles user's reaction
- Spring animations on tap
- Requires sign-in to react (subtle prompt)
```

### Step 4: Create DashboardItineraryView Component

**File: `src/components/trip/DashboardItineraryView.tsx`**

Simplified itinerary view optimized for dashboard context:

```typescript
// Differences from ItineraryView:
- No +/- price adjustment buttons (that's for TripView)
- Includes reaction bubbles on each activity
- Shows organizer controls when applicable
- More compact mobile-first layout
```

### Step 5: Create DashboardActivityCard Component

**File: `src/components/trip/DashboardActivityCard.tsx`**

Activity card with reactions and organizer controls:

```typescript
// Features:
- Activity icon, title, description, cost
- ReactionBubbles component
- Organizer-only: remove button (after all paid)
- Smooth entrance animations
```

### Step 6: Create AddActivityModal Component

**File: `src/components/trip/AddActivityModal.tsx`**

Modal for organizer to add new activities after everyone paid:

```typescript
// Features:
- Form: time, title, description, type, estimated_cost
- Or: AI-powered "Suggest an activity" button
- Validates required fields
- Smooth sheet animation (mobile) or dialog (desktop)
```

### Step 7: Update TripDashboard Page

**File: `src/pages/TripDashboard.tsx`**

Add itinerary section with all new functionality:

```typescript
// Changes:
- Add DashboardItineraryView component
- Pass reactions data
- Handle add/remove activity (organizer only, after all paid)
- Subscribe to reaction updates
```

### Step 8: Update tripService with Activity Management

**File: `src/lib/tripService.ts`**

Add functions for modifying itinerary:

```typescript
// New functions:
- addActivityToItinerary(tripId, dayNumber, activity) → Add new activity
- removeActivityFromItinerary(tripId, dayNumber, activityIndex) → Remove activity
- updateTripItinerary(tripId, itinerary) → Save full itinerary update
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Database migration | Create | `activity_reactions` table |
| `src/lib/reactionService.ts` | Create | Reaction CRUD + realtime |
| `src/components/trip/ReactionBubbles.tsx` | Create | Emoji reaction UI |
| `src/components/trip/DashboardActivityCard.tsx` | Create | Activity with reactions |
| `src/components/trip/DashboardItineraryView.tsx` | Create | Dashboard itinerary layout |
| `src/components/trip/AddActivityModal.tsx` | Create | Add activity form/sheet |
| `src/pages/TripDashboard.tsx` | Modify | Embed itinerary + reactions |
| `src/lib/tripService.ts` | Modify | Add activity management |
| `src/lib/tripTypes.ts` | Modify | Add reaction types |

---

## Technical Details

### Reaction State Management

```typescript
// Reaction type
interface ActivityReaction {
  id: string;
  trip_id: string;
  user_id: string;
  day_number: number;
  activity_index: number;
  reaction: 'thumbs_up' | 'thumbs_down';
}

// Aggregated for display
interface ReactionCounts {
  thumbs_up: number;
  thumbs_down: number;
  user_reaction?: 'thumbs_up' | 'thumbs_down' | null;
}

// Map key format: "dayNumber-activityIndex"
type ReactionsMap = Map<string, ReactionCounts>;
```

### ReactionBubbles Component

```typescript
<motion.div className="flex items-center gap-3">
  {/* Thumbs Up */}
  <motion.button
    onClick={() => handleReaction('thumbs_up')}
    whileTap={{ scale: 0.85 }}
    className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm",
      "transition-colors duration-200",
      userReaction === 'thumbs_up'
        ? "bg-primary/20 text-primary"
        : "bg-muted text-muted-foreground hover:bg-muted/80"
    )}
  >
    <motion.span
      animate={{ scale: userReaction === 'thumbs_up' ? [1, 1.3, 1] : 1 }}
      transition={{ duration: 0.3 }}
    >
      👍
    </motion.span>
    <AnimatePresence mode="wait">
      <motion.span
        key={thumbsUpCount}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="font-medium"
      >
        {thumbsUpCount}
      </motion.span>
    </AnimatePresence>
  </motion.button>

  {/* Thumbs Down */}
  <motion.button
    onClick={() => handleReaction('thumbs_down')}
    whileTap={{ scale: 0.85 }}
    className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm",
      "transition-colors duration-200",
      userReaction === 'thumbs_down'
        ? "bg-destructive/20 text-destructive"
        : "bg-muted text-muted-foreground hover:bg-muted/80"
    )}
  >
    <motion.span
      animate={{ scale: userReaction === 'thumbs_down' ? [1, 1.3, 1] : 1 }}
      transition={{ duration: 0.3 }}
    >
      👎
    </motion.span>
    <span className="font-medium">{thumbsDownCount}</span>
  </motion.button>
</motion.div>
```

### DashboardActivityCard Layout (Mobile-First)

```typescript
<motion.div
  layout
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-card border border-border rounded-2xl p-4 space-y-3"
>
  {/* Header: Icon + Title + Time */}
  <div className="flex items-start gap-3">
    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorClasses)}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground">{activity.title}</h4>
        <span className="text-xs text-muted-foreground">{activity.time}</span>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
        {activity.description}
      </p>
    </div>
  </div>

  {/* Footer: Cost + Reactions + Organizer Controls */}
  <div className="flex items-center justify-between pt-2 border-t border-border/50">
    <div className="flex items-center gap-2">
      {hasCost && (
        <span className="text-xs font-medium text-primary px-2 py-1 bg-primary/10 rounded-full">
          ${activity.estimated_cost}
        </span>
      )}
    </div>
    
    <div className="flex items-center gap-2">
      <ReactionBubbles
        tripId={tripId}
        dayNumber={dayNumber}
        activityIndex={activityIndex}
        reactions={reactions}
        onReact={onReact}
      />
      
      {isOrganizer && allPaid && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onRemove}
          className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  </div>
</motion.div>
```

### Dashboard Layout with Itinerary

```typescript
// In TripDashboard.tsx
<main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
  {/* Trip Info - Compact */}
  {/* Countdown / Confirmation */}
  {/* Payment Status */}
  
  {/* Itinerary Section */}
  <motion.section
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        📍 Itinerary
      </h3>
      {allPaid && isOrganizer && (
        <Button variant="ghost" size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      )}
    </div>
    
    <DashboardItineraryView
      itinerary={trip.itinerary}
      tripId={trip.id}
      reactions={reactions}
      isOrganizer={isOrganizer}
      allPaid={allPaid}
      onReact={handleReact}
      onRemoveActivity={handleRemoveActivity}
    />
  </motion.section>
  
  {/* Share Section */}
</main>
```

---

## Animation Specifications

| Element | Animation | Duration |
|---------|-----------|----------|
| Reaction tap | Scale down + bounce | 150ms |
| Count change | Number slide (y -10 → 0) | 200ms |
| Emoji pop | Scale [1, 1.3, 1] on select | 300ms |
| Activity card | Fade + slide up | 250ms |
| Remove activity | Scale + fade out | 200ms |
| Add activity | Scale up + fade in | 250ms |
| Day tabs scroll | Momentum + snap | Native |

---

## UI/UX Details

### Reaction States

| State | Appearance |
|-------|------------|
| No reaction | Gray background, muted text |
| User reacted 👍 | Blue/primary tint, emoji pop |
| User reacted 👎 | Red/destructive tint, emoji pop |
| Not signed in | Tap shows subtle "Sign in to react" toast |

### Organizer Controls

- Remove button only visible after ALL travelers paid
- Add button appears in section header (top right)
- Confirmation dialog before removing activity
- Toast feedback on add/remove

### Mobile Optimizations

- Cards stack vertically (no horizontal scroll)
- Day tabs have horizontal scroll with momentum
- Touch targets minimum 44px
- Reactions inline (not in overflow menu)
- Bottom sheet for Add Activity form

---

## Realtime Updates

```typescript
// Subscribe to reactions
useEffect(() => {
  const channel = supabase
    .channel(`reactions-${tripId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'activity_reactions',
      filter: `trip_id=eq.${tripId}`,
    }, (payload) => {
      // Update local reactions state
      refetchReactions();
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [tripId]);
```

---

## Edge Cases

1. **Not signed in**: Show reactions but prompt to sign in when tapping
2. **Own trip**: Organizer can still react to activities
3. **No itinerary yet**: Show skeleton/loading state
4. **Failed itinerary**: Show error with retry option
5. **Activity removed while viewing**: Animate out smoothly
6. **Offline**: Queue reactions, sync when back online (future)

---

## Summary

**Database**: New `activity_reactions` table with RLS + realtime

**Components**:
- `ReactionBubbles`: Compact 👍/👎 display with counts
- `DashboardActivityCard`: Activity with reactions + organizer controls
- `DashboardItineraryView`: Itinerary optimized for dashboard
- `AddActivityModal`: Form for organizer to add activities

**Features**:
- Real-time emoji reactions for signed-in users
- Organizer can add/remove activities after all paid
- Mobile-first with Apple-style smooth animations
- Day tabs navigation with horizontal scroll
