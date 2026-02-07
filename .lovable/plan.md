

# Profile Reorganization and AI Image Generation Fix

## Overview
This plan restructures the Profile page tabs and improves the AI group image generation to properly use profile pictures and skip generation when no reference photos are available.

---

## Part 1: Profile Tab Reorganization

### Current State
```text
Tabs: About | Companions | Photos | Travel | Places
```

### Target State
```text
Tabs: About | Photos | Trips | Places
         └─ (includes Companions section)
```

### Changes

**Profile.tsx Updates:**
1. Remove the Companions tab trigger and content
2. Remove the Travel tab trigger and content
3. Add a new "Trips" tab that displays the user's trips
4. Change grid from 5 columns to 4 columns

**PersonalInfoForm.tsx Updates:**
- Add the TravelCompanions component below the save button
- Add a divider/section heading for "Travel Companions"

### New Tab Order
| Tab | Content |
|-----|---------|
| About | Personal info form + Travel Companions |
| Photos | PhotoGallery (unchanged) |
| Trips | User's trips list (new) |
| Places | PlacesVisited (unchanged) |

---

## Part 2: Create ProfileTrips Component

### New File: `src/components/profile/ProfileTrips.tsx`

This component will reuse the trip fetching logic from `Trips.tsx` but display inline within the profile tabs. It will:

1. Fetch user trips using `fetchUserTrips()`
2. Display loading skeletons while loading
3. Show empty state with CTA to create a trip
4. List trips using the existing `TripCard` component

```typescript
interface ProfileTripsProps {
  // No props needed, fetches trips for current user
}
```

---

## Part 3: Fix AI Group Image Generation

### Problem
Currently, the edge function generates a generic image with "diverse friends" when no profile pictures are available. The frontend always tries to generate regardless of avatar availability.

### Solution

**TripGroupImage.tsx Updates:**
1. Check if any travelers have `avatar_url` before calling the edge function
2. If no travelers have profile pictures, don't render anything (return null immediately)
3. Only show the loading skeleton and call the API when there's at least one avatar

**generate-share-image Edge Function Updates:**
1. Add explicit check: if `isGroupImage` and `avatarUrls.length === 0`, return early with a "skipped" response
2. Don't generate generic images without reference photos
3. Return `{ success: true, skipped: true, reason: "no_avatars" }` when skipping

### Updated Prompt Strategy
When avatars ARE available:
- Be more explicit about using the provided face references
- Emphasize that the generated people should match the reference photos

```text
Create a stunning travel photo at ${destination}.
IMPORTANT: Generate realistic depictions of EXACTLY the people shown in the reference photos below.
Use their actual faces, features, and characteristics to place them at this destination.
Do not create generic or random people - recreate these specific individuals.
Golden hour lighting, vibrant colors, professional travel photography, 16:9 aspect ratio.
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Profile.tsx` | Remove Companions/Travel tabs, add Trips tab, adjust grid |
| `src/components/profile/PersonalInfoForm.tsx` | Add TravelCompanions section at bottom |
| `src/components/profile/ProfileTrips.tsx` | NEW: Display user trips in profile |
| `src/components/trip/TripGroupImage.tsx` | Skip generation when no avatars available |
| `supabase/functions/generate-share-image/index.ts` | Return early when no avatars, improve prompt |

---

## Detailed Implementation

### Profile.tsx Tab Structure

```typescript
// Updated tabs - now 4 instead of 5
<TabsList className="... sm:grid-cols-4 ...">
  <TabsTrigger value="about">About</TabsTrigger>
  <TabsTrigger value="photos">Photos</TabsTrigger>
  <TabsTrigger value="trips">Trips</TabsTrigger>
  <TabsTrigger value="places">Places</TabsTrigger>
</TabsList>

// About tab now includes companions
<TabsContent value="about">
  <PersonalInfoForm ... />
  {/* Companions moved here */}
</TabsContent>

// New trips tab
<TabsContent value="trips">
  <ProfileTrips />
</TabsContent>
```

### PersonalInfoForm with Companions

```typescript
// At the bottom of PersonalInfoForm.tsx
<form onSubmit={...}>
  {/* Existing form fields */}
  <Button type="submit">Save Changes</Button>
</form>

{/* Companions section */}
<div className="mt-8 pt-6 border-t border-border">
  <h3 className="text-lg font-semibold mb-4">Travel Companions</h3>
  <TravelCompanions />
</div>
```

### TripGroupImage Skip Logic

```typescript
export function TripGroupImage({ tripId, destinationCity, destinationCountry, travelers, onImageReady }) {
  // Check if any travelers have profile pictures
  const travelersWithAvatars = travelers.filter(t => t.avatar_url);
  
  // If no one has a profile picture, don't render anything
  if (travelersWithAvatars.length === 0) {
    return null;
  }
  
  // Rest of component...
}
```

### Edge Function Early Return

```typescript
// In generate-share-image/index.ts
const avatarUrls = travelerList
  .map(t => t.avatar_url)
  .filter((url): url is string => !!url);

// For group images, require at least one avatar
if (isGroupImage && avatarUrls.length === 0) {
  console.log("Skipping group image generation - no avatars provided");
  return new Response(
    JSON.stringify({ 
      success: true, 
      skipped: true, 
      reason: "no_avatars" 
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### Improved Nano Banana Prompt

```text
Create a stunning travel photo at ${destinationCity}, ${destinationCountry}.

CRITICAL INSTRUCTION: The reference photos below show the actual people who should appear in this image.
Generate realistic depictions of THESE SPECIFIC INDIVIDUALS at the destination.
- Match their facial features, skin tones, hair styles, and overall appearance
- Do not generate random or generic people
- Place these exact people at a famous landmark in ${destinationCity}

Style: Golden hour lighting, vibrant colors, professional travel photography
Composition: Ultra-wide cinematic shot, 16:9 aspect ratio
Mood: Happy, excited travelers capturing a perfect memory together
```

---

## Data Flow

### Profile Trips Display
```text
1. User navigates to Profile → Trips tab
2. ProfileTrips component mounts
3. Calls fetchUserTrips() (same as Trips.tsx)
4. Displays TripCard components for each trip
5. Clicking a trip navigates to /trip/{id}/dashboard
```

### AI Image Generation (Updated)
```text
1. Trip created with travelers
2. TripGroupImage component checks: any avatars?
   ├─ NO avatars → return null (no image section shown)
   └─ YES avatars → proceed with generation
3. Edge function receives request
4. Edge function checks: isGroupImage && no avatars?
   ├─ NO avatars → return { skipped: true }
   └─ YES avatars → generate with improved prompt
5. Generated image uses actual faces from references
```

---

## Summary

| Change | Impact |
|--------|--------|
| Merge Companions into About tab | Cleaner profile structure |
| Remove Travel tab | Simplify navigation |
| Add Trips tab | Quick access to user's trips |
| Skip image generation without avatars | No wasted API calls or generic images |
| Improved prompt for face matching | Better likeness in generated images |

