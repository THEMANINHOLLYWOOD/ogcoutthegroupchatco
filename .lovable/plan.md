

# Accommodation Selection and Button Text Update

## Overview
Add accommodation type selection (Airbnb or Hotel) to the "Add Travelers" step and change the button text from "Search Flights" to "Create a Trip". When users select an accommodation type, the AI search will find matching options based on their preference.

## Current State
- Button text says "Search Flights"
- No accommodation preference selection
- The edge function automatically searches for a "mid-range hotel/accommodation"

## Proposed Changes

### Visual Layout
```text
┌─────────────────────────────────────┐
│     Who's coming along?             │
│                                     │
│  [Traveler Cards...]                │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  + Add Traveler             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ── Where to stay ──                │
│                                     │
│  ┌──────────┐    ┌──────────┐       │
│  │  🏠      │    │  🏨      │       │
│  │ Airbnb   │    │  Hotel   │       │
│  │ (○)      │    │  (●)     │       │
│  └──────────┘    └──────────┘       │
│                                     │
│  [Trip Summary]                     │
│                                     │
│  [Back]        [Create a Trip →]    │
│                                     │
└─────────────────────────────────────┘
```

---

## Technical Implementation

### Step 1: Update AddTravelersStep Component
**File:** `src/components/trip-wizard/AddTravelersStep.tsx`

**Changes:**
1. Add `accommodationType` state: `"airbnb" | "hotel"`
2. Add two selectable cards below "Add Traveler" button
3. Change button text from "Search Flights" to "Create a Trip"
4. Pass `accommodationType` to `onContinue` callback

**New Props Interface:**
```typescript
interface AddTravelersStepProps {
  organizerName: string;
  defaultOrigin: Airport;
  destination: Airport;
  onContinue: (travelers: Traveler[], accommodationType: AccommodationType) => void;
  onBack: () => void;
}

type AccommodationType = "airbnb" | "hotel";
```

### Step 2: Update CreateTrip Page
**File:** `src/pages/CreateTrip.tsx`

**Changes:**
1. Add `accommodationType` state
2. Update `handleTravelersContinue` to accept and store accommodation type
3. Pass accommodation type to `searchTrip`

### Step 3: Update Trip Search Types
**File:** `src/lib/tripTypes.ts`

**Changes:**
- Add `accommodationType?: "airbnb" | "hotel"` to `TripSearch` interface

### Step 4: Update Trip Search Function
**File:** `src/lib/tripSearch.ts`

**Changes:**
- Include `accommodationType` in the request to the edge function

### Step 5: Update Search Trip Edge Function
**File:** `supabase/functions/search-trip/index.ts`

**Changes:**
1. Accept `accommodationType` in request body
2. Modify prompt based on selection:
   - **Airbnb**: "Find a well-rated Airbnb or vacation rental that can accommodate the group..."
   - **Hotel**: "Find a mid-range hotel with rooms for the group..."

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/trip-wizard/AddTravelersStep.tsx` | Add accommodation selector, change button text |
| `src/pages/CreateTrip.tsx` | Handle accommodation type in state and search |
| `src/lib/tripTypes.ts` | Add `accommodationType` to interfaces |
| `src/lib/tripSearch.ts` | Pass accommodation type to edge function |
| `supabase/functions/search-trip/index.ts` | Use accommodation type in prompt |

---

## Component Design Details

### Accommodation Selector Cards
```typescript
// Clean, minimal card design
<div className="space-y-3 mb-6">
  <p className="text-sm text-muted-foreground">Where to stay</p>
  <div className="grid grid-cols-2 gap-3">
    <button 
      onClick={() => setAccommodationType("airbnb")}
      className={cn(
        "p-4 rounded-2xl border-2 transition-all",
        accommodationType === "airbnb" 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50"
      )}
    >
      <Home className="w-6 h-6 mx-auto mb-2" />
      <span className="text-sm font-medium">Airbnb</span>
    </button>
    <button 
      onClick={() => setAccommodationType("hotel")}
      className={...}
    >
      <Building2 className="w-6 h-6 mx-auto mb-2" />
      <span className="text-sm font-medium">Hotel</span>
    </button>
  </div>
</div>
```

### Button Text Change
```typescript
<Button onClick={handleContinue} className="...">
  Create a Trip
  <ArrowRight className="w-4 h-4 ml-2" />
</Button>
```

---

## Edge Function Prompt Updates

### For Airbnb Selection
```text
Please provide realistic current market estimates for:
1. Round-trip flights for each traveler...
2. A well-rated Airbnb or vacation rental that can comfortably accommodate ${travelers.length} guests. 
   Look for entire homes/apartments with good reviews, modern amenities, and central location.
```

### For Hotel Selection
```text
Please provide realistic current market estimates for:
1. Round-trip flights for each traveler...
2. A mid-range hotel (3-4 star) with enough rooms for the group.
   Consider hotels with good location, breakfast included if possible, and standard amenities.
```

---

## Data Flow

```text
1. User selects travelers
2. User taps Airbnb or Hotel card (Hotel selected by default)
3. User clicks "Create a Trip"
4. onContinue(travelers, accommodationType) called
5. CreateTrip stores accommodationType
6. searchTrip() includes accommodationType
7. Edge function adjusts prompt based on type
8. AI returns accommodation matching preference
9. Results displayed on Ready page
```

---

## Default Behavior
- Hotel is selected by default (most common choice)
- Selection is required (one must always be active)
- Visual indicator shows which is selected

