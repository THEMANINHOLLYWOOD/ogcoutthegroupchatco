

# Plan: Auto-Add Current Location to Places Visited

## Overview

When users first visit their profile or the "Places" tab, we'll prompt them to share their current location. Using the browser's Geolocation API combined with a reverse geocoding service (via a new edge function), we'll automatically populate their:
- Current **city** (e.g., "Los Angeles")
- Current **state/province** (e.g., "California")  
- Current **country** (e.g., "United States")

This creates a delightful onboarding experience where users see their travel history pre-populated with their home location.

---

## User Flow

```text
[User Opens Profile → Places Tab]
          |
          v
    [Check: Has user set home location?]
          |
    ┌─────┴─────┐
    │ NO        │ YES
    v           v
[Show Location      [Show normal
 Prompt Modal]       Places UI]
    |
    | User clicks "Share My Location"
    v
[Browser Geolocation API]
    |
    | Get lat/lng coordinates
    v
[Edge Function: reverse-geocode]
    |
    | Returns city, state, country
    v
[Preview Location Card]
    |
    | User confirms or skips
    v
[Insert city, state, country to DB]
    |
    | Mark home_location_set = true
    v
[Show Success Animation]
```

---

## Implementation Steps

### Step 1: Database Migration

Add fields to track home location setup:

**Modify `profiles` table:**
- `home_city` (text, nullable) - User's current city
- `home_state` (text, nullable) - User's current state/province
- `home_country` (text, nullable) - User's current country
- `home_location_set` (boolean, default false) - Whether location has been set

This lets us:
1. Know if we should show the location prompt
2. Store their home location for future reference (e.g., default departure airport)

### Step 2: Create Reverse Geocoding Edge Function

**File: `supabase/functions/reverse-geocode/index.ts`**

Edge function that:
1. Receives latitude/longitude coordinates
2. Uses a free reverse geocoding API (OpenStreetMap Nominatim or Google's free tier via Gemini)
3. Returns structured location data (city, state, country)

We'll use OpenStreetMap's Nominatim API (free, no API key required):
```typescript
// Example: https://nominatim.openstreetmap.org/reverse?lat=34.0522&lon=-118.2437&format=json
```

### Step 3: Create Location Prompt Component

**File: `src/components/profile/LocationPrompt.tsx`**

A beautiful modal/card that appears when `home_location_set` is false:
- Friendly illustration or icon (MapPin animation)
- Header: "Where do you call home?"
- Subtext: "We'll add your current city to your travel history"
- Primary button: "Share My Location" (with location icon)
- Secondary button: "I'll add it manually"
- Privacy note: "Your exact location is not stored"

### Step 4: Create Location Detection Hook

**File: `src/hooks/useLocationDetection.ts`**

Custom hook that handles:
- Browser geolocation permission request
- Loading/error states
- Calling the reverse-geocode edge function
- Returning city, state, country data

### Step 5: Create Location Preview Component

**File: `src/components/profile/LocationPreview.tsx`**

After detection, show a preview card:
- Flag emoji for the country
- City, State, Country displayed beautifully
- "This looks right!" confirm button
- "That's not quite right" edit option
- Animated checkmarks for each item being added

### Step 6: Update PlacesVisited Component

**File: `src/components/profile/PlacesVisited.tsx`**

Modify to:
1. Check if `home_location_set` is false in profile
2. If false, show LocationPrompt before the main content
3. After location is set, auto-add city/state/country (avoiding duplicates)
4. Update profile.home_location_set to true

### Step 7: Update Auth Hook and Profile Type

**File: `src/hooks/useAuth.tsx`**

Add new fields to Profile interface:
- home_city, home_state, home_country, home_location_set

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| (Database Migration) | Create | Add home location fields to profiles |
| `supabase/functions/reverse-geocode/index.ts` | Create | Geocoding edge function |
| `supabase/config.toml` | Modify | Add reverse-geocode function |
| `src/hooks/useLocationDetection.ts` | Create | Location detection hook |
| `src/components/profile/LocationPrompt.tsx` | Create | Initial prompt modal |
| `src/components/profile/LocationPreview.tsx` | Create | Preview and confirm UI |
| `src/components/profile/PlacesVisited.tsx` | Modify | Integrate location prompt |
| `src/hooks/useAuth.tsx` | Modify | Update Profile interface |

---

## Technical Details

### Reverse Geocoding Edge Function

Using OpenStreetMap Nominatim (free, no API key):

```typescript
const response = await fetch(
  `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
  {
    headers: {
      'User-Agent': 'OutTheGroupChat/1.0'
    }
  }
);

const data = await response.json();
// data.address contains: city, state, country, etc.
```

### Duplicate Prevention

Before inserting, check if place already exists:

```typescript
// Check if city already exists for user
const { data: existingCity } = await supabase
  .from('visited_cities')
  .select('id')
  .eq('user_id', userId)
  .eq('city_name', city)
  .eq('country', country)
  .maybeSingle();

if (!existingCity) {
  // Insert new city
}
```

### Animation Pattern

When places are auto-added, use staggered animations:

```typescript
<motion.div
  initial={{ opacity: 0, scale: 0.8, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  transition={{ delay: index * 0.2, type: 'spring' }}
>
  ✓ Added {city}
</motion.div>
```

---

## UI/UX Details

### Location Prompt Modal

- Subtle glass background
- Large MapPin icon with pulsing animation
- Friendly, conversational copy
- Clear privacy messaging
- Smooth fade-in on mount

### Location Preview Card

- Country flag prominently displayed
- City name large and bold
- State and country in smaller text below
- Green checkmarks appearing one by one
- Confetti or particle effect on confirm

### Error States

- Geolocation denied: "No worries! You can add places manually"
- API error: Retry button with "Having trouble detecting your location"
- Outside known regions: Show what we found with edit option

---

## Privacy Considerations

- Only city/state/country stored (not exact coordinates)
- User must explicitly opt-in to share location
- Clear messaging about what data is stored
- Easy skip option for privacy-conscious users
- Coordinates are only used for reverse geocoding, never persisted

