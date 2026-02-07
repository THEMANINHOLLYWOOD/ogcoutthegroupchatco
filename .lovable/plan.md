
# Edit Travelers in Trip Details + Fix AI Image Generation

## Overview
This plan addresses two features:
1. **Edit Travelers**: Extend the EditTripModal to allow adding, editing, and removing travelers (not just destination/dates)
2. **Fix AI Image Generation**: Make the `travel-media` storage bucket public so generated images display correctly

---

## Current Issues

### Storage Bucket Problem
The `travel-media` bucket is set to `public: false`. When the edge function generates an image and calls `getPublicUrl()`, it returns a URL that requires authentication. Since the frontend can't access these URLs without auth tokens, the images fail to load.

**Evidence from database:**
- `public: false` for `travel-media` bucket
- Edge function logs show successful generation: "Image uploaded successfully: https://..."
- Direct API test returned success with valid imageUrl

### EditTripModal Limitation
Currently only allows editing destination, origin, and dates. Travelers are passed as a prop but cannot be modified.

---

## Solution

### Part 1: Fix Storage Access

**Database Migration Required:**
Make the `travel-media` bucket public for share-images folder, or update the bucket to be public.

Alternatively, generate signed URLs instead of public URLs.

**Recommended Approach:** Make the bucket public since share images are meant to be publicly shareable.

```sql
UPDATE storage.buckets 
SET public = true 
WHERE name = 'travel-media';
```

This also requires adding a public read policy for the `share-images` folder.

### Part 2: Add Traveler Management to EditTripModal

**Current Component Structure:**
```
EditTripModal
├── Destination (AirportAutocomplete)
├── Origin (AirportAutocomplete)
├── Departure Date (Calendar)
├── Return Date (Calendar)
└── Update Button
```

**New Structure:**
```
EditTripModal (scrollable content)
├── Destination (AirportAutocomplete)
├── Origin (AirportAutocomplete)
├── Departure Date (Calendar)
├── Return Date (Calendar)
├── ── Travelers Section ──
│   ├── TravelerCard (organizer - not removable)
│   ├── TravelerCard (guest - editable origin, removable)
│   ├── TravelerCard (guest - editable origin, removable)
│   └── + Add Traveler button
├── UserSearchPicker (sheet)
├── ManualTravelerForm (inline)
└── Update Button
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/trip/EditTripModal.tsx` | Add travelers section with add/edit/remove capability |
| `src/components/trip-wizard/TripReadyStep.tsx` | Accept updated travelers in onUpdateComplete callback |
| `src/pages/CreateTrip.tsx` | Handle traveler updates from edit modal |

## Database Changes

| Change | Purpose |
|--------|---------|
| Make `travel-media` bucket public | Allow share images to be viewed without authentication |
| Add storage policy for public read on `share-images/*` | Security policy for public access |

---

## Detailed Implementation

### EditTripModal Component Updates

**New Props Interface:**
```typescript
interface EditTripModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDestination: Airport;
  currentOrigin: Airport;
  currentDepartureDate: Date;
  currentReturnDate: Date;
  travelers: Traveler[];  // Now editable
  tripId: string;
  onUpdateComplete: (newData: {
    tripResult: TripResult;
    destination: Airport;
    origin: Airport;
    departureDate: Date;
    returnDate: Date;
    expiresAt: string;
    travelers: Traveler[];  // NEW: Return updated travelers
  }) => void;
}
```

**New State:**
```typescript
const [localTravelers, setLocalTravelers] = useState<Traveler[]>(travelers);
const [showUserSearch, setShowUserSearch] = useState(false);
const [showManualForm, setShowManualForm] = useState(false);
const [pendingUser, setPendingUser] = useState<PlatformUser | null>(null);
```

**New Functions:**
```typescript
const addPlatformUser = (user: PlatformUser, origin: Airport) => {
  const newTraveler: Traveler = {
    id: crypto.randomUUID(),
    name: user.full_name || "Unknown User",
    origin,
    isOrganizer: false,
    user_id: user.id,
    avatar_url: user.avatar_url || undefined,
  };
  setLocalTravelers(prev => [...prev, newTraveler]);
};

const addManualTraveler = (name: string, origin: Airport) => {
  const newTraveler: Traveler = {
    id: crypto.randomUUID(),
    name,
    origin,
    isOrganizer: false,
  };
  setLocalTravelers(prev => [...prev, newTraveler]);
};

const removeTraveler = (id: string) => {
  setLocalTravelers(prev => prev.filter(t => t.id !== id));
};

const updateTravelerOrigin = (id: string, newOrigin: Airport) => {
  setLocalTravelers(prev => prev.map(t => 
    t.id === id ? { ...t, origin: newOrigin } : t
  ));
};
```

**UI Layout:**
```
┌─────────────────────────────────────┐
│ Edit Trip Details              [X]  │
├─────────────────────────────────────┤
│  Destination                        │
│  [Airport Autocomplete]             │
│                                     │
│  Departing From                     │
│  [Airport Autocomplete]             │
│                                     │
│  ┌───────────┐    ┌───────────┐     │
│  │ Departure │    │  Return   │     │
│  │  Feb 15   │    │  Feb 22   │     │
│  └───────────┘    └───────────┘     │
│                                     │
│  ── Travelers (3) ──                │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 👤 John Smith (You)   ATL   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 👤 Jane Doe    [ATL ▾] [X]  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 👤 Bob Wilson  [LAX ▾] [X]  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  + Add Traveler             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │     Update Trip             │    │
│  └─────────────────────────────┘    │
│                                     │
│  Updating will refresh prices...    │
└─────────────────────────────────────┘
```

### EditableTravelerCard Sub-Component

Create inline within EditTripModal (or as separate component):

```typescript
interface EditableTravelerCardProps {
  traveler: Traveler;
  onRemove?: () => void;
  onOriginChange?: (origin: Airport) => void;
}
```

Features:
- Shows avatar/fallback, name, origin
- Organizer card: Read-only (no remove button)
- Guest cards: Origin dropdown + remove button
- Compact layout for modal context

### Update Flow

1. User opens edit modal
2. Modal initializes with current travelers
3. User can:
   - Add new traveler (search or manual)
   - Remove non-organizer traveler
   - Change traveler's origin airport
4. User updates destination/dates as before
5. User clicks "Update Trip"
6. System:
   - Re-runs searchTrip with updated travelers
   - Updates database with new costs
   - Regenerates itinerary
   - Regenerates group image
   - Resets 24-hour timer
7. Modal closes, UI updates

### Database Update for Travelers

When updating the trip, also update the travelers JSONB column:

```typescript
const { error: updateError } = await supabase
  .from("trips")
  .update({
    destination_city: destination.city,
    // ... other fields
    travelers: localTravelers.map(t => ({
      traveler_name: t.name,
      origin: t.origin.iata,
      destination: destination.iata,
      flight_cost: 0, // Will be recalculated
      accommodation_share: 0,
      subtotal: 0,
      user_id: t.user_id,
      avatar_url: t.avatar_url,
    })),
    // Update with new breakdown from search
    cost_breakdown: searchResult.data.breakdown,
  })
  .eq("id", tripId);
```

---

## Storage Fix Implementation

### Migration SQL

```sql
-- Make travel-media bucket public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'travel-media';

-- Add public read policy for share-images folder
CREATE POLICY "Public can view share images"
ON storage.objects FOR SELECT
USING (bucket_id = 'travel-media' AND (storage.foldername(name))[1] = 'share-images');
```

This allows:
- Anyone to view images in `share-images/` folder
- Images remain uploadable only via service role (edge function)

---

## Components to Reuse

| Component | Usage in EditTripModal |
|-----------|------------------------|
| `UserSearchPicker` | Search for platform users to add |
| `ManualTravelerForm` | Add travelers by name |
| `PlatformUserConfirm` | Confirm platform user with origin |
| `AirportAutocomplete` | Change traveler's origin |
| `TravelerCard` | Display travelers (with modifications for edit mode) |

---

## TripReadyStep Updates

Update the callback to include travelers:

```typescript
const handleTripUpdate = useCallback((newData: {
  tripResult: TripResult;
  destination: Airport;
  origin: Airport;
  departureDate: Date;
  returnDate: Date;
  expiresAt: string;
  travelers: Traveler[];  // NEW
}) => {
  setTripResult(newData.tripResult);
  setDestination(newData.destination);
  setOrigin(newData.origin);
  setDepartureDate(newData.departureDate);
  setReturnDate(newData.returnDate);
  setExpiresAt(newData.expiresAt);
  // Update travelers in parent via prop
  onTravelersUpdate?.(newData.travelers);
  setGroupImageKey(prev => prev + 1);
}, []);
```

---

## Summary

| Task | Complexity | Impact |
|------|------------|--------|
| Make storage bucket public | Low | Fixes image display |
| Add storage policy | Low | Security for public access |
| Add traveler management to EditTripModal | Medium | Full edit capability |
| Update TripReadyStep callbacks | Low | Data flow |
| Update CreateTrip state management | Low | Handle traveler updates |
