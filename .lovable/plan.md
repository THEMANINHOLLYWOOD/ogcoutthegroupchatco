

# Plan: Cost Breakdown Sync + Create Link Flow

## Overview

Two interconnected features:

1. **Activity Cost Sync**: When users swap activities via +/- buttons, the cost breakdown automatically updates to reflect the new activity's price (currently it shows stale data).

2. **Create Link Flow**: Transform the current "Copy Link" into a "Create Link" action that requires authentication, saves the trip to the user's profile, and creates an organizer dashboard with countdown, payment tracking, and confirmation.

---

## Part 1: Cost Breakdown Sync with Activity Changes

### Problem

Currently, when a user clicks +/- on an activity and it gets replaced with a cheaper/pricier alternative, the `CostSummary` component's `DayCostRow` still shows the old activity costs because:
- `CostSummary` receives the itinerary from `trip.itinerary`
- When `ItineraryView` updates its local state, it calls `onItineraryUpdate`
- `TripView` updates its local `trip` state
- But the `DayCostRow` maps activities by index, and the new activity has a different cost

### Solution

The data flow is already correct. The issue is that when activities are replaced, the `selectedActivities` Set tracks by `dayNumber-index`. If a selected activity at index 2 is replaced with a new one, the selection should remain (same index), but now reflect the new cost.

**Verification needed**: The `calculateSelectedActivitiesCost` function already reads from the current `itinerary.days[].activities[]`, so when the activity is replaced, the cost should update automatically.

**Actual fix needed**: Ensure `TripView` passes the **updated** itinerary to `CostSummary`. Currently it does this via the `trip` state update in `onItineraryUpdate`.

**Files to verify/update:**
- `src/pages/TripView.tsx` - Confirm itinerary updates flow to CostSummary
- `src/lib/tripService.ts` - Ensure cost calculation uses current activity data

---

## Part 2: Create Link Flow

### Current State
- "Copy Link" button copies the trip URL
- Anyone with the link can view the trip
- No ownership, no tracking, no payment status

### New Flow

```text
[Trip View Page]
       |
       | User taps "Create Link"
       v
[Auth Check]
       |
       ├── Not logged in → Redirect to /auth?redirect=/trip/{tripId}/claim
       │
       └── Logged in → Continue
              |
              v
[Claim Trip API]
       |
       | Sets organizer_id = current user
       | Creates link_created_at timestamp
       v
[Redirect to Trip Dashboard]
       |
       | /trip/{tripId}/dashboard
       v
[Trip Dashboard Page]
       |
       ├── 24-hour countdown (from link_created_at)
       ├── Itinerary preview (read-only)
       ├── Travelers list with payment status
       │     - John (Paid ✓)
       │     - Sarah (Pending...)
       │     - Mike (Pending...)
       └── Share controls (copy link, copy code)
              |
              v
[When all paid]
       |
       | "You are going to {destination}!"
       | Confetti animation
```

---

## Database Changes

Add fields to `trips` table:

```sql
ALTER TABLE trips ADD COLUMN link_created_at timestamptz;
ALTER TABLE trips ADD COLUMN link_expires_at timestamptz;
```

Update the trip when user claims it:
- Set `organizer_id` to current user
- Set `link_created_at` to now()
- Set `link_expires_at` to now() + 24 hours

---

## Implementation Steps

### Step 1: Fix Cost Breakdown Sync

**File: `src/pages/TripView.tsx`**

The current implementation should already work. Need to verify that:
1. When `onItineraryUpdate` is called from `ItineraryView`, the `trip` state is updated
2. `CostSummary` receives the updated `trip.itinerary`
3. Cost calculations use the current activity data

If there's a bug, it may be that the `key` prop on `DayCostRow` or `ActivityCostItem` isn't changing, causing React to skip re-renders.

### Step 2: Update ShareButton to "Create Link"

**File: `src/components/trip/ShareButton.tsx`**

Changes:
- Check if trip has `organizer_id` (already claimed)
- If claimed by current user: show "Share Link" + "Copy Code"
- If not claimed: show "Create Link" button
- On click: check auth, redirect if needed, then claim trip

### Step 3: Create Trip Claim Service

**File: `src/lib/tripService.ts`**

New function:
```typescript
export async function claimTrip(tripId: string): Promise<{ success: boolean; error?: string }> {
  // Sets organizer_id to current user
  // Sets link_created_at and link_expires_at
}
```

### Step 4: Create Trip Dashboard Page

**File: `src/pages/TripDashboard.tsx`**

New page at `/trip/:tripId/dashboard`:
- Protected route (must be trip organizer)
- Shows 24-hour countdown timer
- Shows itinerary (read-only preview)
- Shows travelers with payment status
- Share controls at bottom

### Step 5: Add Countdown Timer Component

**File: `src/components/trip/CountdownTimer.tsx`**

New component:
- Accepts `expiresAt` timestamp
- Shows hours:minutes:seconds remaining
- Smooth animation as time ticks down
- Shows "Expired" when time is up

### Step 6: Create Traveler Payment Status Component

**File: `src/components/trip/TravelerPaymentStatus.tsx`**

New component:
- List of travelers with payment status indicators
- "Paid" = green checkmark
- "Pending" = subtle pulsing indicator
- When all paid: celebration state

### Step 7: Add Confirmation State

When all travelers have paid:
- Show "You are going to {destination}!"
- Confetti or celebration animation
- Trip is "locked in"

### Step 8: Update Routes

**File: `src/App.tsx`**

Add new routes:
```tsx
<Route path="/trip/:tripId/dashboard" element={
  <ProtectedRoute>
    <TripDashboard />
  </ProtectedRoute>
} />
<Route path="/trip/:tripId/claim" element={<ClaimTrip />} />
```

### Step 9: Database Migration

Add columns for link tracking and payment status.

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/TripView.tsx` | Modify | Verify/fix itinerary update flow |
| `src/components/trip/ShareButton.tsx` | Modify | Change to "Create Link" flow |
| `src/lib/tripService.ts` | Modify | Add claimTrip function |
| `src/pages/TripDashboard.tsx` | Create | Organizer dashboard with countdown |
| `src/pages/ClaimTrip.tsx` | Create | Handle claim redirect after auth |
| `src/components/trip/CountdownTimer.tsx` | Create | 24-hour countdown display |
| `src/components/trip/TravelerPaymentStatus.tsx` | Create | Payment status list |
| `src/components/trip/ConfirmationBanner.tsx` | Create | "You are going to..." message |
| `src/App.tsx` | Modify | Add new routes |
| Database migration | Create | Add link_created_at, link_expires_at columns |

---

## UI/UX Details

### Create Link Button

```text
[Before claiming - not logged in]
┌────────────────────────────────┐
│        Create Link             │ ← Primary button, prominent
│   Sign up to share this trip   │ ← Subtext
└────────────────────────────────┘

[After claiming - logged in as organizer]
┌────────────────────────────────┐
│ Trip Code: ABC123         [📋] │
│ [Copy Link]      [Share 📤]    │
│         View Dashboard →       │
└────────────────────────────────┘
```

### Trip Dashboard Layout

```text
┌──────────────────────────────────────┐
│ ← Back                         Edit  │
├──────────────────────────────────────┤
│                                      │
│          Las Vegas, USA              │
│          Mar 15-18, 2024             │
│                                      │
│    ┌─────────────────────────┐       │
│    │  23:45:30 remaining     │       │ ← Countdown
│    │  to lock in this trip   │       │
│    └─────────────────────────┘       │
│                                      │
├──────────────────────────────────────┤
│ Travelers                            │
│                                      │
│ 👤 John (You)         ✓ Paid         │
│ 👤 Sarah              ○ Pending      │
│ 👤 Mike               ○ Pending      │
│                                      │
│ Total: $3,240                        │
│ $1,080/person                        │
│                                      │
├──────────────────────────────────────┤
│ Itinerary Preview                    │
│ [Collapsed day cards...]             │
│                                      │
├──────────────────────────────────────┤
│                                      │
│ [Share with Friends]                 │
│                                      │
└──────────────────────────────────────┘
```

### All Paid Confirmation

```text
┌──────────────────────────────────────┐
│                                      │
│            ✨ 🎉 ✨                   │
│                                      │
│     You are going to                 │
│        Las Vegas!                    │
│                                      │
│     Mar 15-18, 2024                  │
│                                      │
│     All 3 travelers confirmed        │
│                                      │
└──────────────────────────────────────┘
```

---

## Animation Specifications

| Element | Animation | Duration |
|---------|-----------|----------|
| Countdown tick | Subtle number flip | 200ms |
| Payment status change | Scale pop + color | 300ms |
| All paid reveal | Staggered fade + confetti | 600ms |
| Dashboard sections | Staggered slide-up | 100ms each |

---

## Data Flow for Cost Sync

```text
[User clicks + on $50 restaurant]
      |
      v
[ItineraryView.handleFindAlternative()]
      |
      | API returns $75 alternative
      v
[setItinerary(updatedItinerary)]
      |
      v
[onItineraryUpdate(updatedItinerary)]
      |
      v
[TripView.setTrip({ ...prev, itinerary: updatedItinerary })]
      |
      v
[CostSummary receives new trip.itinerary]
      |
      v
[DayCostRow re-renders with new activity data]
      |
      v
[calculateSelectedActivitiesCost uses new $75 cost]
      |
      v
[Total updates: $50 → $75]
```

---

## Payment Status (Simplified)

For now, payment status will be:
- **Paid**: Boolean flag on each traveler (future: Stripe integration)
- **Manual toggle** for MVP (organizer can mark as paid)
- Later: Real Stripe checkout integration

```typescript
// Future addition to TravelerCost
interface TravelerPaymentStatus {
  traveler_name: string;
  paid: boolean;
  paid_at?: string;
}
```

---

## Technical Notes

1. **Auth redirect**: Use `?redirect=/trip/${tripId}/claim` to return user to claim flow after auth
2. **Countdown precision**: Use `requestAnimationFrame` for smooth countdown without jank
3. **Real-time updates**: Existing Supabase subscription will handle payment status changes
4. **Expiration handling**: When countdown reaches 0, show "Expired" but don't delete trip

