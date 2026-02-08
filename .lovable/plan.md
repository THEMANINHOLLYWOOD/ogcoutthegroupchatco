

# Add Full Trip Information + Pay Button to Shared Trip View

## Overview
This plan enhances the shared trip page (`TripView.tsx`) to display all the same information as the creator's page (`TripReadyStep.tsx`) and replaces the Share section with a "Pay" button that lets recipients select themselves and mark as paid.

---

## Current State Comparison

| Section | Creator (TripReadyStep) | Shared (TripView) |
|---------|------------------------|-------------------|
| Countdown Timer | ✓ | ✗ |
| AI Group Image | ✓ | ✗ |
| Destination Card | ✓ | Header only |
| Traveler Payment Status | ✓ | ✗ |
| Itinerary | ✓ | ✓ |
| Cost Summary | ✓ | ✓ |
| Bottom Action | Share Trip | Share Button → **Change to Pay** |

---

## Part 1: Add Missing Components to TripView

### Components to Add

1. **CountdownTimer** - Show the booking window expiration
2. **TripGroupImage** - AI-generated group image
3. **Destination Card** - Detailed trip info with dates, nights, accommodation, flights
4. **TravelerPaymentStatus** - List of travelers with payment status

### Layout Changes

```text
CURRENT TripView:
1. Back Button
2. TripHeader (hero)
3. Your Itinerary
4. Cost Breakdown
5. Share Section ← Remove

NEW TripView:
1. Back Button
2. TripHeader (hero)
3. Countdown Timer         ← ADD
4. AI Group Image          ← ADD
5. Destination Card        ← ADD
6. Traveler Payment Status ← ADD
7. Your Itinerary
8. Cost Breakdown
9. Pay Button (sticky)     ← REPLACE Share
```

---

## Part 2: Replace Share with Pay Button

### Current ShareButton Behavior
- Shows share code display
- Has "Share with Friends" button

### New PayButton Behavior
1. User taps "Pay" button at bottom
2. Modal or drawer opens
3. User selects which traveler they are (from list)
4. User confirms payment
5. Shows "Paid" status with checkmark

### New Component: TravelerPaymentPicker

```typescript
interface TravelerPaymentPickerProps {
  travelers: TravelerCost[];
  paidTravelers: Set<string>;
  onPayForTraveler: (travelerName: string) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

UI Flow:
```text
┌─────────────────────────────────────────────────┐
│  Who are you paying for?                        │
│                                                 │
│  ○ John Smith         $1,245                    │
│  ○ Jane Doe           $1,189                    │
│  ● Mike Johnson       $1,312  ← Selected        │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │        Pay $1,312                       │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘

After payment:
┌─────────────────────────────────────────────────┐
│  ✓ Paid                                         │
│    Mike Johnson's spot is confirmed!            │
└─────────────────────────────────────────────────┘
```

---

## Part 3: Persist Payment Status

### Database Consideration
Currently, `paidTravelers` is stored in local state (not persisted). For the shared view to work:

**Option A: Add to trips table** (Recommended for MVP)
- Add `paid_travelers` JSONB column to `trips` table
- Store array of traveler names who have paid

**Option B: Separate payments table** (Future)
- Create `trip_payments` table with proper tracking

For now, we'll use Option A with a database migration.

### Migration SQL
```sql
ALTER TABLE trips ADD COLUMN paid_travelers jsonb DEFAULT '[]'::jsonb;
```

---

## Part 4: Implementation Details

### TripView.tsx Changes

**New Imports:**
```typescript
import { CountdownTimer } from "@/components/trip/CountdownTimer";
import { TripGroupImage } from "@/components/trip/TripGroupImage";
import { TravelerPaymentStatus } from "@/components/trip/TravelerPaymentStatus";
```

**New State:**
```typescript
const [paidTravelers, setPaidTravelers] = useState<Set<string>>(new Set());
```

**Load paid status from trip:**
```typescript
useEffect(() => {
  if (trip?.paid_travelers) {
    setPaidTravelers(new Set(trip.paid_travelers));
  }
}, [trip]);
```

**Handle payment:**
```typescript
const handlePayForTraveler = async (travelerName: string) => {
  // Update database
  const newPaidTravelers = [...paidTravelers, travelerName];
  await supabase
    .from('trips')
    .update({ paid_travelers: newPaidTravelers })
    .eq('id', tripId);
  
  // Update local state
  setPaidTravelers(new Set(newPaidTravelers));
  
  toast({
    title: "Payment confirmed!",
    description: `${travelerName}'s spot is secured`,
  });
};
```

### New Component: TravelerPaymentDrawer

```typescript
// src/components/trip/TravelerPaymentDrawer.tsx
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { TravelerCost } from "@/lib/tripTypes";

interface TravelerPaymentDrawerProps {
  travelers: TravelerCost[];
  paidTravelers: Set<string>;
  onPay: (travelerName: string) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TravelerPaymentDrawer({
  travelers,
  paidTravelers,
  onPay,
  open,
  onOpenChange,
}: TravelerPaymentDrawerProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  
  const unpaidTravelers = travelers.filter(t => !paidTravelers.has(t.traveler_name));
  
  const handlePay = async () => {
    if (!selected) return;
    setIsPaying(true);
    await onPay(selected);
    setIsPaying(false);
    onOpenChange(false);
  };
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Who are you paying for?</DrawerTitle>
        </DrawerHeader>
        <div className="p-4">
          <RadioGroup value={selected || ""} onValueChange={setSelected}>
            {unpaidTravelers.map((traveler) => (
              <label key={traveler.traveler_name} className="...">
                <RadioGroupItem value={traveler.traveler_name} />
                <span>{traveler.traveler_name}</span>
                <span>${traveler.subtotal}</span>
              </label>
            ))}
          </RadioGroup>
          
          <Button 
            onClick={handlePay}
            disabled={!selected || isPaying}
            className="w-full mt-4"
          >
            {isPaying ? "Processing..." : `Pay $${selectedTraveler?.subtotal}`}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

---

## Part 5: Update TripReadyStep

Also update `TripReadyStep.tsx` to persist paid status to database instead of just local state.

---

## Files to Modify/Create

| File | Action |
|------|--------|
| Database migration | Add `paid_travelers` column |
| `src/components/trip/TravelerPaymentDrawer.tsx` | **CREATE** - New drawer for selecting traveler to pay |
| `src/pages/TripView.tsx` | Add all missing components, replace Share with Pay button |
| `src/components/trip-wizard/TripReadyStep.tsx` | Persist payment status to database |
| `src/lib/tripTypes.ts` | Add `paid_travelers` to `SavedTrip` type |
| `src/integrations/supabase/types.ts` | Will auto-update after migration |

---

## Updated TripView Layout

```text
┌──────────────────────────────────────────────────┐
│  ← Home                                          │
├──────────────────────────────────────────────────┤
│                                                  │
│           [Hero Header: Paris, France]           │
│           May 15 - May 22 • 4 travelers          │
│                                                  │
├──────────────────────────────────────────────────┤
│  ⏱️ Prices locked for: 23:45:12                  │
├──────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐    │
│  │        [AI Group Image]                  │    │
│  └──────────────────────────────────────────┘    │
├──────────────────────────────────────────────────┤
│  📍 Paris                                   ✏️   │
│     France                                       │
│  ──────────────────────────────────────────────  │
│  📅 Dates          🏨 Hotel                      │
│  May 15–22         Le Grand Paris               │
│  ──────────────────────────────────────────────  │
│  👥 Group          ✈️ Flights                   │
│  4 people          8:30 AM → 11:45 AM           │
├──────────────────────────────────────────────────┤
│  Travelers                          2/4 paid     │
│  ──────────────────────────────────────────────  │
│  👤 John Smith (Organizer)  $1,245      ✓ Paid  │
│  👤 Jane Doe                $1,189      ✓ Paid  │
│  👤 Mike Johnson            $1,312      [Pay]   │
│  👤 Sarah Lee               $1,278      [Pay]   │
├──────────────────────────────────────────────────┤
│  Your Itinerary                                  │
│  [Day 1 · 3] [Day 2] [Day 3 · 2]                │
│  ┌──────────────────────────────────────────┐    │
│  │ 9:00 AM - Eiffel Tower                   │    │
│  │           ~$30/person  👍 2 👎 0         │    │
│  └──────────────────────────────────────────┘    │
├──────────────────────────────────────────────────┤
│  Base Trip Cost                                  │
│  $5,024 total    ~$1,256/person                 │
│  [Expand for details]                            │
├──────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐    │
│  │              💳 Pay                       │    │
│  └──────────────────────────────────────────┘    │
│  Secure your spot on this trip                   │
└──────────────────────────────────────────────────┘
```

---

## Summary

| Change | Impact |
|--------|--------|
| Add countdown timer | Recipients see booking window |
| Add group image | Visual consistency with creator view |
| Add destination card | All trip details visible |
| Add traveler status | See who has/hasn't paid |
| Replace Share with Pay | Recipients can mark themselves as paid |
| Persist to database | Payment status syncs across all viewers |

