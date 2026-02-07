
# Trip Creator Image, Itinerary Cleanup, and Trip Details Enhancement

## Overview
This plan addresses four improvements:
1. **Include trip creator in AI group image** - Pass the organizer's profile picture to the image generator
2. **Remove LIVE indicator from itinerary** - Clean up the random "LIVE" labels
3. **Move edit pencil to trip details card** - Relocate from countdown timer to destination card
4. **Add accommodation address and flight times** - Display more trip details in the destination card

---

## Part 1: Include Trip Creator in AI Group Image

### Problem
Currently, the organizer traveler is created without `avatar_url` or `user_id`:
```typescript
// AddTravelersStep.tsx line 29-36
{
  id: "organizer",
  name: organizerName || "You",
  origin: defaultOrigin,
  isOrganizer: true,
  // Missing: user_id, avatar_url
}
```

The AI image generation only includes travelers with `avatar_url`, so the trip creator is excluded.

### Solution

**AddTravelersStep.tsx**: Accept `user` and `profile` props to populate the organizer traveler correctly:

```typescript
interface AddTravelersStepProps {
  organizerName: string;
  organizerId?: string;        // NEW: user.id
  organizerAvatarUrl?: string; // NEW: profile.avatar_url
  defaultOrigin: Airport;
  destination: Airport;
  onContinue: (travelers: Traveler[], accommodationType: AccommodationType) => void;
  onBack: () => void;
}

// Initialize organizer with full data
const [travelers, setTravelers] = useState<Traveler[]>([
  {
    id: "organizer",
    name: organizerName || "You",
    origin: defaultOrigin,
    isOrganizer: true,
    user_id: organizerId,           // NEW
    avatar_url: organizerAvatarUrl, // NEW
  },
]);
```

**CreateTrip.tsx**: Pass the user/profile data to AddTravelersStep:

```typescript
<AddTravelersStep
  organizerName={organizerName}
  organizerId={user?.id}                    // NEW
  organizerAvatarUrl={profile?.avatar_url || undefined}  // NEW
  defaultOrigin={origin}
  destination={destination}
  onContinue={handleTravelersContinue}
  onBack={() => setStep("trip-details")}
/>
```

This ensures:
- If the trip creator has a profile picture, they'll be included in the AI group image
- Their `user_id` is tracked for linking purposes

---

## Part 2: Remove LIVE Indicator from Itinerary

### Current State
`ActivityBubble.tsx` displays a pulsing "LIVE" indicator for activities with `is_live_event: true`:

```typescript
// Lines 86-96
{activity.is_live_event && (
  <motion.div animate={{ scale: [1, 1.2, 1] }} ...>
    <div className="w-2 h-2 rounded-full bg-destructive" />
    <span className="text-xs font-medium text-destructive">LIVE</span>
  </motion.div>
)}
```

Also has a red left border on live events (line 71).

### Solution
Remove all `is_live_event` rendering from `ActivityBubble.tsx`:
1. Remove the conditional LIVE indicator JSX (lines 86-96)
2. Remove the `border-l-2 border-l-red-500` conditional class (line 71)

The `is_live_event` field will remain in the types for potential future use, but won't render anything.

---

## Part 3: Move Edit Pencil to Trip Details Card

### Current State
The edit button is in `CountdownTimer.tsx` positioned absolutely in the top-right corner.

### Solution

**CountdownTimer.tsx**: Remove the `onEdit` prop and pencil button entirely. Keep the component focused solely on time display.

**TripReadyStep.tsx**: Add the edit button to the destination card instead:

```typescript
// Destination Card (lines 252-291)
<motion.div className="relative bg-gradient-to-br ...">
  {/* NEW: Edit button in top-right of destination card */}
  <Button
    variant="ghost"
    size="icon"
    onClick={() => setIsEditModalOpen(true)}
    className="absolute top-3 right-3 h-8 w-8 ..."
  >
    <Pencil className="h-4 w-4" />
  </Button>
  
  {/* Existing content... */}
</motion.div>
```

---

## Part 4: Add Accommodation Address and Flight Times

### Data Available
From `TripResult.flights`:
```typescript
interface FlightOption {
  traveler_name: string;
  departure_time: string;  // e.g., "9:00 AM"
  arrival_time: string;    // e.g., "2:30 PM"
  // ...
}
```

From `TripResult.accommodation`:
```typescript
interface AccommodationOption {
  name: string;           // e.g., "The Grand Hotel"
  // Note: No address field currently exists
}
```

### Solution

**Extend AccommodationOption type** (optional enhancement):
```typescript
interface AccommodationOption {
  name: string;
  address?: string;  // NEW: Optional address field
  // ...
}
```

**Update TripReadyStep destination card** to show:

```typescript
// Updated trip details card layout
<div className="grid grid-cols-2 gap-4 mt-4">
  {/* Row 1: Dates & Stay */}
  <div>
    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
      <Calendar className="w-3 h-3" />
      Dates
    </div>
    <div className="text-sm font-medium">
      {format(departureDate, "MMM d")} – {format(returnDate, "MMM d")}
    </div>
  </div>
  <div>
    <div className="text-xs text-muted-foreground mb-1">Stay</div>
    <div className="text-sm font-medium">{nights} nights</div>
  </div>
  
  {/* Row 2: Group & Accommodation */}
  <div>
    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
      <Users className="w-3 h-3" />
      Group
    </div>
    <div className="text-sm font-medium">{travelers.length} people</div>
  </div>
  <div>
    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
      <Building2 className="w-3 h-3" />
      {accommodationType === 'airbnb' ? 'Airbnb' : 'Hotel'}
    </div>
    <div className="text-sm font-medium truncate">
      {tripResult.accommodation?.name || 'TBD'}
    </div>
  </div>
</div>

{/* Flight Times Section */}
{tripResult.flights.length > 0 && (
  <div className="mt-4 pt-4 border-t border-border/50">
    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
      <Plane className="w-3 h-3" />
      Flights
    </div>
    <div className="flex justify-between text-sm">
      <div>
        <span className="text-muted-foreground">Depart: </span>
        <span className="font-medium">{tripResult.flights[0].departure_time}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Arrive: </span>
        <span className="font-medium">{tripResult.flights[0].arrival_time}</span>
      </div>
    </div>
  </div>
)}
```

This displays:
- Accommodation name with icon indicating Airbnb or Hotel
- First traveler's flight departure and arrival times

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/trip-wizard/AddTravelersStep.tsx` | Accept `organizerId` and `organizerAvatarUrl` props, use in organizer traveler |
| `src/pages/CreateTrip.tsx` | Pass `user.id` and `profile.avatar_url` to AddTravelersStep |
| `src/components/trip/ActivityBubble.tsx` | Remove LIVE indicator and red border |
| `src/components/trip/CountdownTimer.tsx` | Remove `onEdit` prop and pencil button |
| `src/components/trip-wizard/TripReadyStep.tsx` | Add edit button to destination card, add accommodation/flight info |

---

## Updated UI Layout

```text
┌─────────────────────────────────────────────┐
│  ⏱ 23:45:32                                │
│  Time remaining to lock in                  │
│  Collect payments before time runs out      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  📍 Paris                         [✏️ Edit] │
│  France                                     │
│                                             │
│  📅 Dates          Stay                     │
│  Feb 15 – Feb 22   7 nights                 │
│                                             │
│  👥 Group          🏨 Hotel                  │
│  3 people          The Grand Paris          │
│                                             │
│  ─────────────────────────────────────────  │
│  ✈️ Flights                                  │
│  Depart: 9:00 AM       Arrive: 2:30 PM      │
└─────────────────────────────────────────────┘
```

---

## Data Flow Update

### Trip Creator in Image
```text
1. CreateTrip loads with useAuth → has user.id, profile.avatar_url
2. Passes to AddTravelersStep as organizerId, organizerAvatarUrl
3. Organizer traveler now has avatar_url populated
4. When trip saved → travelers array includes organizer with avatar
5. TripGroupImage filters for travelers with avatars → includes organizer
6. Edge function receives organizer's avatar in reference photos
7. AI generates image including trip creator
```

---

## Summary

| Change | Impact |
|--------|--------|
| Pass organizer user data to traveler list | Trip creator appears in AI group image |
| Remove LIVE indicator | Cleaner itinerary without random labels |
| Move edit button to destination card | Better UX - edit where the data is |
| Add accommodation name and flight times | More useful trip overview at a glance |
