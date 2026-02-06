
# Plan: Trip Sharing with AI-Generated Itineraries

## Overview

When users click "Share Trip", we'll save the trip to the database and generate a beautiful, shareable trip page at `/trip/:tripId`. This page features an AI-generated day-by-day itinerary created by Gemini with search grounding, finding both classic attractions and live events (concerts, festivals, etc.) happening during the trip dates. Anyone with the link can view the trip details without authentication.

---

## User Flow

```text
[Trip Summary Page]
      |
      | Click "Share Trip"
      v
[Create Trip in Database]
      |
      | Generate unique trip ID
      v
[Call generate-itinerary Edge Function]
      |
      | Gemini searches for:
      | - Classic attractions in destination
      | - Live events during trip dates
      | - Restaurants & nightlife
      v
[Store itinerary in trip record]
      |
      v
[Navigate to /trip/:tripId]
      |
      | Show shareable trip page with:
      | - Trip overview header
      | - Day-by-day itinerary (chat bubble style)
      | - Cost breakdown per person
      | - Copy link button
      v
[Anyone with link can view]
```

---

## URL Structure

The trip page will use a clean, shareable URL format:

```text
/trip/:tripId

Example: /trip/a1b2c3d4-e5f6-7890
```

This keeps URLs short and easy to share while the trip details (destination, dates, organizer) are displayed on the page itself.

---

## Implementation Steps

### Step 1: Database Schema

Create a new `trips` table to persist trip data:

**trips table:**
- `id` (uuid, primary key) - Unique trip identifier for URL
- `organizer_id` (uuid, nullable, FK to profiles) - Who created it (null for guests)
- `organizer_name` (text) - Organizer's display name
- `destination_city` (text) - e.g., "Las Vegas"
- `destination_country` (text) - e.g., "United States"  
- `destination_iata` (text) - e.g., "LAS"
- `departure_date` (date)
- `return_date` (date)
- `travelers` (jsonb) - Array of traveler info with costs
- `flights` (jsonb) - Flight data from search
- `accommodation` (jsonb) - Hotel data from search
- `cost_breakdown` (jsonb) - Per-person cost breakdown
- `total_per_person` (numeric)
- `trip_total` (numeric)
- `itinerary` (jsonb, nullable) - AI-generated itinerary
- `itinerary_status` (text) - 'pending' | 'generating' | 'complete' | 'failed'
- `created_at` (timestamp)
- `updated_at` (timestamp)

**RLS Policy:**
- Anyone can SELECT (public viewing of trips)
- Authenticated users can INSERT (create trips)
- Only organizer can UPDATE their own trips

### Step 2: Create generate-itinerary Edge Function

**File: `supabase/functions/generate-itinerary/index.ts`**

This function uses Gemini 3 Flash to create a personalized day-by-day itinerary:

1. Receives trip details (destination, dates, traveler count)
2. Builds a prompt asking Gemini to search for:
   - Top attractions and landmarks in the destination
   - Live events, concerts, festivals happening during the exact dates
   - Best restaurants and nightlife spots
   - Day-by-day schedule optimized for the group
3. Uses structured output (tool calling) to return formatted itinerary

**Itinerary structure:**
```typescript
interface Itinerary {
  overview: string;  // Brief trip description
  highlights: string[];  // 3-4 trip highlights
  days: DayPlan[];
}

interface DayPlan {
  day_number: number;
  date: string;
  theme: string;  // e.g., "Explore the Strip"
  activities: Activity[];
}

interface Activity {
  time: string;  // e.g., "10:00 AM"
  title: string;  // e.g., "Bellagio Fountains"
  description: string;
  type: 'attraction' | 'restaurant' | 'event' | 'travel' | 'free_time';
  is_live_event?: boolean;  // For concerts, shows, etc.
  estimated_cost?: number;
  tip?: string;  // Insider tip
}
```

### Step 3: Update Trip Types

**File: `src/lib/tripTypes.ts`**

Add new types for saved trips and itineraries:

```typescript
export interface SavedTrip {
  id: string;
  organizer_name: string;
  destination_city: string;
  destination_country: string;
  destination_iata: string;
  departure_date: string;
  return_date: string;
  travelers: TravelerCost[];
  accommodation: AccommodationOption;
  total_per_person: number;
  trip_total: number;
  itinerary: Itinerary | null;
  itinerary_status: 'pending' | 'generating' | 'complete' | 'failed';
}

export interface Itinerary {
  overview: string;
  highlights: string[];
  days: DayPlan[];
}

export interface DayPlan {
  day_number: number;
  date: string;
  theme: string;
  activities: Activity[];
}

export interface Activity {
  time: string;
  title: string;
  description: string;
  type: 'attraction' | 'restaurant' | 'event' | 'travel' | 'free_time';
  is_live_event?: boolean;
  estimated_cost?: number;
  tip?: string;
}
```

### Step 4: Create Trip Service

**File: `src/lib/tripService.ts`**

Functions to manage trips:

- `saveTrip(tripData)` - Creates trip in database, returns trip ID
- `fetchTrip(tripId)` - Fetches trip by ID for viewing
- `generateItinerary(tripId)` - Triggers itinerary generation

### Step 5: Update CreateTrip Page - Share Handler

**File: `src/pages/CreateTrip.tsx`**

Update `handleShareTrip` to:
1. Save trip to database
2. Navigate to `/trip/:tripId`
3. Show loading toast during save

### Step 6: Create Trip View Page

**File: `src/pages/TripView.tsx`**

A beautiful, Apple-inspired trip page with:

**Header Section:**
- Large destination image (Unsplash)
- Destination city and country
- Date range and traveler count
- Organizer name

**Itinerary Section (chat-style):**
- Day tabs or vertical timeline
- Each day shows activities as iMessage-style bubbles
- Live events highlighted with special styling (pulsing dot)
- Activities stagger in with spring animations

**Cost Section:**
- Collapsible per-person breakdown
- Total prominently displayed

**Share Section:**
- "Copy Link" button with success animation
- Share via native share sheet on mobile

### Step 7: Create Itinerary Components

**File: `src/components/trip/ItineraryView.tsx`**
Main itinerary container with day navigation

**File: `src/components/trip/DayCard.tsx`**
Single day with activities list

**File: `src/components/trip/ActivityBubble.tsx`**
Individual activity rendered as a chat bubble with:
- Time badge
- Activity title and description
- Type icon (attractions, food, event, etc.)
- Live event indicator (pulsing red dot)
- Cost if applicable

**File: `src/components/trip/ItinerarySkeleton.tsx`**
Loading skeleton while itinerary generates

**File: `src/components/trip/TripHeader.tsx`**
Hero section with destination image

**File: `src/components/trip/ShareButton.tsx`**
Copy link functionality with animation

### Step 8: Update App Routes

**File: `src/App.tsx`**

Add new route:
```tsx
<Route path="/trip/:tripId" element={<TripView />} />
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| (Database Migration) | Create | trips table with RLS policies |
| `supabase/functions/generate-itinerary/index.ts` | Create | AI itinerary generation |
| `supabase/config.toml` | Modify | Add generate-itinerary function |
| `src/lib/tripTypes.ts` | Modify | Add SavedTrip, Itinerary types |
| `src/lib/tripService.ts` | Create | Trip CRUD operations |
| `src/pages/TripView.tsx` | Create | Public trip view page |
| `src/pages/CreateTrip.tsx` | Modify | Update share handler |
| `src/components/trip/ItineraryView.tsx` | Create | Itinerary container |
| `src/components/trip/DayCard.tsx` | Create | Day section component |
| `src/components/trip/ActivityBubble.tsx` | Create | Activity chat bubble |
| `src/components/trip/ItinerarySkeleton.tsx` | Create | Loading state |
| `src/components/trip/TripHeader.tsx` | Create | Hero header |
| `src/components/trip/ShareButton.tsx` | Create | Share functionality |
| `src/App.tsx` | Modify | Add /trip/:tripId route |

---

## Technical Details

### Gemini Prompt for Itinerary Generation

```text
You are a world-class travel planner creating an unforgettable trip itinerary.

TRIP DETAILS:
- Destination: Las Vegas, United States
- Dates: March 22-25, 2025 (3 nights)
- Group Size: 3 people
- Accommodation: The Venetian Resort

Search for and include:
1. MUST-SEE ATTRACTIONS: Classic landmarks and experiences in Las Vegas
2. LIVE EVENTS: Search for concerts, shows, sports, festivals happening March 22-25, 2025
3. DINING: Best restaurants for groups, mix of casual and upscale
4. NIGHTLIFE: Top bars, clubs, experiences
5. LOCAL SECRETS: Off-the-beaten-path gems

Create a day-by-day itinerary that:
- Balances activities with downtime
- Groups nearby attractions together
- Includes specific times
- Notes which activities are live events with exact dates
- Estimates costs where applicable
```

### Activity Type Icons

- `attraction` - Landmark icon
- `restaurant` - Utensils icon
- `event` - Ticket icon (with pulsing indicator for live)
- `travel` - Plane/Car icon
- `free_time` - Coffee icon

### Animation Patterns

**Page Entry:**
```typescript
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.6 }}
/>
```

**Activity Bubbles (staggered):**
```typescript
<motion.div
  initial={{ opacity: 0, y: 20, scale: 0.95 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ 
    delay: index * 0.1,
    type: "spring",
    stiffness: 400,
    damping: 25
  }}
/>
```

**Live Event Indicator:**
```typescript
<motion.div
  animate={{ scale: [1, 1.2, 1] }}
  transition={{ duration: 1.5, repeat: Infinity }}
  className="w-2 h-2 rounded-full bg-red-500"
/>
```

**Copy Link Success:**
```typescript
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring" }}
>
  <Check className="text-green-500" />
</motion.div>
```

---

## UI/UX Details

### Trip Page Design (Apple-inspired)

**Hero Section:**
- Full-bleed destination photo with gradient overlay
- Large destination name in SF Pro Display style
- Dates as a subtle pill badge
- Minimal, clean aesthetic

**Day Navigation:**
- Horizontal scrolling day pills
- Active day highlighted with primary color
- Sticky to top on scroll

**Activity Timeline:**
- Vertical timeline with time labels
- Activities as rounded cards with subtle shadows
- Live events have colored left border + pulsing indicator
- Icons match activity type

**Cost Summary:**
- Expandable accordion
- Each person's breakdown
- Total in large, bold text

**Share Footer:**
- Sticky bottom bar on mobile
- "Copy Link" primary action
- Native share fallback

### Responsive Behavior

**Mobile:**
- Single column layout
- Bottom sticky share bar
- Swipe between days

**Desktop:**
- Two column: Itinerary left, Cost right
- Horizontal day tabs
- Fixed share button in header

### Loading States

While itinerary generates:
- Show trip header immediately
- Skeleton animation for itinerary
- Animated "Building your itinerary..." message
- Progress indicators per day as they stream in (future enhancement)

---

## Security Considerations

- Trip pages are public (anyone with link can view)
- No sensitive data exposed (just names, destinations, costs)
- Trip creation requires being on the app (no auth required initially)
- Future: Add password protection option for private trips
