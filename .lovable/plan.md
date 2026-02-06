

# Plan: Interactive Cost Breakdown with Activity Selection

## Overview

Redesign the cost breakdown to separate base costs (flights + accommodation) from activities. Users can:
1. See base trip total (flights + hotel only)
2. Add all itinerary activities at once with a single + button
3. Expand day-by-day to add/remove specific paid activities
4. Click into a day to toggle individual events on/off

Activities become "opt-in" rather than automatically included — users curate what they want in their trip cost.

---

## User Flow

```text
[Cost Breakdown - Collapsed]
       Trip Total: $2,400
       ~$800/person (base)
              |
              v
[Expand to see breakdown]
              |
   ┌─────────────────────────────────┐
   │ Flights + Accommodation         │
   │ The Venetian: $897              │
   └─────────────────────────────────┘
              |
   ┌─────────────────────────────────┐
   │ Activities & Experiences    [+] │ ← Add all at once
   │ $250/person available           │
   │                                 │
   │ ▶ Day 1 - $120 (3 paid)     [+] │ ← Add all day's events
   │ ▶ Day 2 - $85 (2 paid)      [+] │
   │ ▶ Day 3 - $45 (1 paid)      [+] │
   └─────────────────────────────────┘
              |
[Click Day 1 to expand]
              |
   ┌─────────────────────────────────┐
   │ ▼ Day 1 - $120                  │
   │   ☑ Museum Tour - $45       [-] │ ← Remove individual
   │   ☐ Free Walking Tour - $0      │ ← Already free
   │   ☑ Dinner Cruise - $75     [-] │
   └─────────────────────────────────┘
              |
[Per-person breakdown updates live]
```

---

## Implementation Steps

### Step 1: Add Selected Activities State

Track which activities are "selected" (added to cost):

**State Structure:**
```typescript
// Map of "dayNumber-activityIndex" => boolean
type SelectedActivities = Set<string>;

// Example: Day 1, Activity 2 selected
selectedActivities.has("1-2") // true
```

### Step 2: Update CostSummary Component

**File: `src/components/trip/CostSummary.tsx`**

Major restructure:
- Add `selectedActivities` state (or receive as prop)
- Add `onActivityToggle` callback to update selection
- Show base cost (tripTotal from props) without activities
- Add "Activities & Experiences" section with master + button
- Add expandable day rows with individual activity toggles
- Calculate selected activities total dynamically
- Update per-person breakdown to include only selected activities

### Step 3: Create DayCostRow Component

**File: `src/components/trip/DayCostRow.tsx`**

New collapsible component:
- Shows day number, total available cost, count of paid activities
- + button to add all day's paid activities at once
- Expandable to show individual activities
- Each paid activity has a toggle (checkbox or +/- button)
- Ultra-smooth expand/collapse animation

### Step 4: Create ActivityCostItem Component

**File: `src/components/trip/ActivityCostItem.tsx`**

New component for individual activity in cost breakdown:
- Shows activity title and cost
- Toggle button (+/- or checkbox)
- Subtle animations on add/remove
- Grayed out for free activities (no toggle needed)

### Step 5: Update TripView for State Management

**File: `src/pages/TripView.tsx`**

Changes:
- Add `selectedActivities` state at trip level
- Pass state and callbacks to CostSummary
- Optionally persist selections (future enhancement)

### Step 6: Lift Calculations to Parent

Ensure cost calculations respect selected activities:
- `calculateSelectedActivitiesCost(itinerary, selectedActivities)`
- Per-person breakdown uses selected total, not all activities

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/trip/CostSummary.tsx` | Modify | Restructure with activity selection |
| `src/components/trip/DayCostRow.tsx` | Create | Collapsible day cost section |
| `src/components/trip/ActivityCostItem.tsx` | Create | Individual activity toggle item |
| `src/pages/TripView.tsx` | Modify | Add selectedActivities state |
| `src/lib/tripService.ts` | Modify | Add calculateSelectedActivitiesCost helper |

---

## Technical Details

### Selected Activities State

```typescript
// In TripView.tsx
const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());

const toggleActivity = (dayNumber: number, activityIndex: number) => {
  const key = `${dayNumber}-${activityIndex}`;
  setSelectedActivities(prev => {
    const next = new Set(prev);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    return next;
  });
};

const addAllActivities = () => {
  if (!itinerary) return;
  const allKeys = new Set<string>();
  itinerary.days.forEach(day => {
    day.activities.forEach((activity, index) => {
      if ((activity.estimated_cost || 0) > 0) {
        allKeys.add(`${day.day_number}-${index}`);
      }
    });
  });
  setSelectedActivities(allKeys);
};

const addDayActivities = (dayNumber: number) => {
  const day = itinerary?.days.find(d => d.day_number === dayNumber);
  if (!day) return;
  setSelectedActivities(prev => {
    const next = new Set(prev);
    day.activities.forEach((activity, index) => {
      if ((activity.estimated_cost || 0) > 0) {
        next.add(`${dayNumber}-${index}`);
      }
    });
    return next;
  });
};
```

### Cost Calculation with Selection

```typescript
// In tripService.ts
export function calculateSelectedActivitiesCost(
  itinerary: Itinerary | null,
  selectedActivities: Set<string>
): number {
  if (!itinerary?.days) return 0;
  
  let total = 0;
  itinerary.days.forEach(day => {
    day.activities.forEach((activity, index) => {
      const key = `${day.day_number}-${index}`;
      if (selectedActivities.has(key)) {
        total += activity.estimated_cost || 0;
      }
    });
  });
  
  return total;
}
```

### DayCostRow Animation

```typescript
<motion.div layout>
  {/* Header - always visible */}
  <motion.button
    onClick={() => setIsExpanded(!isExpanded)}
    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
    whileTap={{ scale: 0.98 }}
  >
    <div className="flex items-center gap-2">
      <motion.div
        animate={{ rotate: isExpanded ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronRight className="w-4 h-4" />
      </motion.div>
      <span>Day {dayNumber}</span>
      <span className="text-muted-foreground text-xs">
        ({paidCount} paid)
      </span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm">${dayCost}</span>
      {!allDaySelected && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onAddAll(); }}
          className="w-6 h-6 rounded-full bg-primary/10 text-primary"
        >
          <Plus className="w-3 h-3" />
        </motion.button>
      )}
    </div>
  </motion.button>

  {/* Expandable content */}
  <AnimatePresence>
    {isExpanded && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className="overflow-hidden"
      >
        {/* Activity items */}
      </motion.div>
    )}
  </AnimatePresence>
</motion.div>
```

### ActivityCostItem Toggle Animation

```typescript
<motion.div
  layout
  initial={{ opacity: 0, x: -10 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: 10 }}
  className="flex items-center justify-between py-1.5 px-2"
>
  <div className="flex items-center gap-2">
    <motion.div
      animate={{ 
        scale: isSelected ? 1 : 0.9,
        backgroundColor: isSelected ? "var(--primary)" : "transparent"
      }}
      className={cn(
        "w-4 h-4 rounded-full border flex items-center justify-center",
        isSelected ? "border-primary" : "border-muted-foreground/50"
      )}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-2 h-2 rounded-full bg-primary-foreground"
        />
      )}
    </motion.div>
    <span className={cn(
      "text-sm",
      isSelected ? "text-foreground" : "text-muted-foreground"
    )}>
      {activity.title}
    </span>
  </div>
  <div className="flex items-center gap-2">
    <span className="text-xs text-muted-foreground">
      ${activity.estimated_cost}
    </span>
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onToggle}
      className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center",
        isSelected 
          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
          : "bg-primary/10 text-primary hover:bg-primary/20"
      )}
    >
      {isSelected ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
    </motion.button>
  </div>
</motion.div>
```

### Updated CostSummary Header

```typescript
{/* Header shows base cost only */}
<button onClick={() => setIsExpanded(!isExpanded)}>
  <div>
    <p className="text-sm text-muted-foreground">Base Trip Cost</p>
    <p className="text-2xl font-bold">${tripTotal.toLocaleString()}</p>
    {selectedActivitiesCost > 0 && (
      <motion.p
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-primary"
      >
        +${selectedActivitiesCost} activities
      </motion.p>
    )}
  </div>
  <div>
    <span>~${(tripTotal + selectedActivitiesCost) / travelerCount}/person</span>
    <ChevronDown />
  </div>
</button>
```

---

## UI/UX Details

### Visual Hierarchy

1. **Base Cost** (always visible): Flights + Accommodation = $X
2. **Activities Section** (expandable): Optional add-ons
   - Master "+ Add All" button in section header
   - Per-day rows with + buttons
   - Individual activity toggles when day expanded
3. **Per-Person Breakdown**: Updates live as activities toggle

### Animation Specifications

| Action | Animation | Duration |
|--------|-----------|----------|
| Expand day | Spring slide + fade | 300ms |
| Toggle activity | Scale bounce + color | 150ms |
| Cost update | Counter animate | 200ms |
| Add all flash | Brief highlight pulse | 400ms |

### States

- **Empty**: No activities selected → "Add activities to your trip"
- **Partial**: Some selected → Shows count and + for remaining
- **Full**: All selected → "+ Add All" becomes "✓ All Added"

### Mobile Considerations

- Touch targets minimum 44px
- Swipe-to-remove gesture (future)
- Sticky header with running total

---

## Data Flow

```text
[User taps "+" on Day 1]
      |
      v
[addDayActivities(1)]
      |
      | Updates selectedActivities Set
      v
[CostSummary re-renders]
      |
      | calculateSelectedActivitiesCost()
      v
[Total updates with animation]
      |
      | Per-person breakdown recalculates
      v
[All affected rows animate]
```

---

## Edge Cases

1. **No paid activities**: Hide activities section entirely
2. **All free activities**: Show section but no + buttons
3. **Single paid activity in day**: No "Add All" for that day (just toggle)
4. **Activity replaced via +/-**: If selected, new activity auto-selected
5. **Itinerary not loaded**: Show skeleton in activities section

