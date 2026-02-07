

# Plan: Streamlined Trip Creation with Upfront Airport Selection

## ✅ IMPLEMENTED

The Create Trip flow now shows destination and origin airports immediately when the page loads.

---

## New Flow (3 Steps)

```text
1. Enter destination + origin + dates (shown immediately)
2. Add travelers
3. Search & Summary
```

---

## Changes Made

| File | Changes |
|------|---------|
| `src/pages/CreateTrip.tsx` | Removed ID scan steps, starts at trip-details, 3-step flow |
| `src/components/trip-wizard/TripDetailsStep.tsx` | Made organizerName optional, updated headline to "Where to next?" |
| `src/components/trip-wizard/AddTravelersStep.tsx` | Changed from `organizer: TravelerInfo` to `organizerName: string` |

---

## User Experience

1. User opens /create-trip
2. Sees "Where to next?" with destination + origin fields immediately
3. Origin auto-detected via geolocation
4. Visual route appears when both airports selected
5. Selects travel dates
6. Continues to Add Travelers step
7. Search & Summary
