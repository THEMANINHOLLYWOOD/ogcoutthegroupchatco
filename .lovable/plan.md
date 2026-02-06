

# Plan: Add "Trips" Navigation + My Trips Page

## Overview

Add a "Trips" link in the navigation for signed-in users (between avatar and "Getaway" button) that navigates to a new page displaying all trips the user has created or claimed.

---

## Current Navigation Layout

```text
Signed In:
[Logo] .......................... [Avatar ▼] [Getaway]

Signed Out:
[Logo] .......................... [Sign In] [Getaway]
```

## New Navigation Layout

```text
Signed In:
[Logo] .......................... [Avatar ▼] [Trips] [Getaway]
```

---

## Implementation Steps

### Step 1: Update Navigation in Index.tsx

**File: `src/pages/Index.tsx`**

Add a "Trips" button between the avatar dropdown and the "Getaway" button:

```typescript
<div className="flex items-center gap-3">
  {user ? (
    <>
      <DropdownMenu>
        {/* Avatar dropdown */}
      </DropdownMenu>
      
      {/* New Trips link */}
      <Button variant="ghost" size="sm" asChild>
        <Link to="/trips">Trips</Link>
      </Button>
    </>
  ) : (
    <Button variant="ghost" size="sm" asChild>
      <Link to="/auth">Sign In</Link>
    </Button>
  )}
  <Button size="sm" className="rounded-full" asChild>
    <Link to="/create-trip">Getaway</Link>
  </Button>
</div>
```

### Step 2: Create Trips Page

**File: `src/pages/Trips.tsx`**

New page at `/trips`:
- Fetches all trips where `organizer_id = current user`
- Displays trips in a mobile-optimized card grid
- Shows trip destination, dates, status, and traveler count
- Links to trip dashboard for each trip
- Empty state when no trips exist

### Step 3: Add Trip Service Function

**File: `src/lib/tripService.ts`**

New function to fetch user's trips:

```typescript
export async function fetchUserTrips(): Promise<{ 
  success: boolean; 
  trips?: SavedTrip[]; 
  error?: string 
}> {
  // Fetch trips where organizer_id matches current user
  // Order by created_at descending (newest first)
}
```

### Step 4: Create TripCard Component

**File: `src/components/trip/TripCard.tsx`**

Compact card for displaying a trip summary:
- Destination city + country
- Date range
- Traveler count
- Status indicator (countdown active / all paid / expired)
- Links to dashboard

### Step 5: Add Route

**File: `src/App.tsx`**

Add protected route:

```tsx
<Route path="/trips" element={
  <ProtectedRoute>
    <Trips />
  </ProtectedRoute>
} />
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/Index.tsx` | Modify | Add "Trips" link in nav for signed-in users |
| `src/pages/Trips.tsx` | Create | My Trips page with trip list |
| `src/components/trip/TripCard.tsx` | Create | Trip summary card component |
| `src/lib/tripService.ts` | Modify | Add fetchUserTrips function |
| `src/App.tsx` | Modify | Add /trips route |

---

## Technical Details

### Trips Page Layout

```text
┌──────────────────────────────────────┐
│ ← Back                    + New Trip │
├──────────────────────────────────────┤
│                                      │
│  My Trips                            │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 📍 Paris, France               │  │
│  │ Mar 15-18, 2024                │  │
│  │ 3 travelers                    │  │
│  │ ⏱ 23h remaining               │  │
│  │                          →     │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 📍 Tokyo, Japan                │  │
│  │ Apr 1-7, 2024                  │  │
│  │ 4 travelers                    │  │
│  │ ✓ Confirmed                    │  │
│  │                          →     │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

### Empty State

```text
┌──────────────────────────────────────┐
│                                      │
│          🌍                          │
│                                      │
│    No trips yet                      │
│                                      │
│    Create your first trip and       │
│    share it with friends            │
│                                      │
│    [Create a Trip →]                │
│                                      │
└──────────────────────────────────────┘
```

### TripCard Component

```typescript
<motion.div
  whileHover={{ y: -2 }}
  whileTap={{ scale: 0.98 }}
  className="bg-card border border-border rounded-2xl p-4 shadow-soft"
>
  <Link to={`/trip/${trip.id}/dashboard`}>
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground">
          {trip.destination_city}, {trip.destination_country}
        </h3>
        <p className="text-sm text-muted-foreground">
          {formatDateRange(trip.departure_date, trip.return_date)}
        </p>
        <p className="text-xs text-muted-foreground">
          {trip.travelers.length} travelers
        </p>
      </div>
      
      <div className="flex flex-col items-end gap-2">
        <StatusBadge trip={trip} />
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </div>
  </Link>
</motion.div>
```

### Trip Status Logic

| Condition | Display |
|-----------|---------|
| `link_expires_at` in future | `⏱ Xh remaining` (orange) |
| All travelers paid | `✓ Confirmed` (green) |
| `link_expires_at` passed | `Expired` (red) |
| No `link_created_at` | `Draft` (gray) |

### fetchUserTrips Query

```typescript
const { data, error } = await supabase
  .from("trips")
  .select("*")
  .eq("organizer_id", user.id)
  .order("created_at", { ascending: false });
```

---

## Animation Specifications

| Element | Animation | Duration |
|---------|-----------|----------|
| Page entrance | Fade + slide up | 300ms |
| Card hover | Lift (y: -2) | 150ms |
| Card tap | Scale (0.98) | 100ms |
| Card entrance | Staggered fade | 50ms delay each |
| Empty state | Bounce + fade | 400ms |

---

## Mobile Optimizations

- Cards stack vertically in single column
- Touch targets minimum 44px
- Back button easily accessible
- "New Trip" button in header
- Pull-to-refresh (future enhancement)

---

## Edge Cases

1. **User has no trips**: Show empty state with CTA
2. **Loading state**: Show skeleton cards
3. **Error fetching**: Show error message with retry
4. **Mixed status trips**: Sort active first, then confirmed, then expired

