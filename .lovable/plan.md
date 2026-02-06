

# Plan: Enhanced Share Image with Real Travelers + Platform User Search

## Overview

Transform the trip sharing experience by:
1. **AI-Generated Share Images**: Include actual travelers in the AI-generated share image using their profile photos as reference, at the destination location (ultra-wide cinematic shot)
2. **Platform User Search**: Allow adding registered outthegroupchatco users as travelers by searching existing platform users

---

## Current State Analysis

| Component | Current Behavior |
|-----------|------------------|
| Share Image (`generate-share-image/index.ts`) | Generates generic "X friends" image with just destination info |
| Add Traveler (`AddTravelersStep.tsx`) | Manual name entry only, no platform user search |
| Traveler Data (`tripTypes.ts`) | Stores `name` and `origin`, no `user_id` or `avatar_url` |
| Trip Storage | `travelers` JSON field stores basic cost breakdown data |

---

## Solution Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ADD TRAVELER FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [+ Add Traveler] ─────▶ [Search Platform Users]               │
│                           │                                     │
│                           ├──▶ "@john" → Shows John's profile   │
│                           │    with avatar, home airport        │
│                           │                                     │
│                           ├──▶ "Enter Manually" → Name input    │
│                           │                                     │
│                           └──▶ "Saved Companions" → ID-based    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SHARE IMAGE GENERATION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Trip Claimed] ─▶ Collect Traveler Photos                     │
│                    │                                            │
│                    ├──▶ Organizer: profile.avatar_url           │
│                    ├──▶ Platform Users: profiles.avatar_url     │
│                    └──▶ Non-users: null (AI generates)          │
│                                                                 │
│                 ─▶ Call Nano Banana with:                       │
│                    • Reference photos (if available)            │
│                    • Destination city/country                   │
│                    • Ultra-wide cinematic prompt                │
│                                                                 │
│                 ─▶ Result: Custom image with actual people      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Extend Traveler Data Model

**File: `src/lib/tripTypes.ts`**

Add optional `user_id` and `avatar_url` fields to track platform users:

```typescript
export interface Traveler {
  id: string;
  name: string;
  origin: Airport;
  isOrganizer: boolean;
  user_id?: string;      // Platform user ID (if registered user)
  avatar_url?: string;   // Profile photo URL
}

export interface TravelerCost {
  traveler_name: string;
  origin: string;
  destination: string;
  flight_cost: number;
  accommodation_share: number;
  subtotal: number;
  user_id?: string;      // Platform user ID
  avatar_url?: string;   // Profile photo for share image
}
```

### Step 2: Create User Search Service

**File: `src/lib/userService.ts` (new)**

Search platform users by name or email:

```typescript
export interface PlatformUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  home_city: string | null;
  home_country: string | null;
}

export async function searchUsers(query: string): Promise<PlatformUser[]> {
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, home_city, home_country")
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10);
  
  return data || [];
}
```

### Step 3: Create User Search Picker Component

**File: `src/components/trip-wizard/UserSearchPicker.tsx` (new)**

Bottom sheet with search to find platform users:

- Search input with debounced query
- Results showing avatar, name, home location
- Fallback options: "Enter Manually" / "Saved Companions"
- Selection returns `PlatformUser` with `user_id` and `avatar_url`

### Step 4: Update AddTravelersStep Component

**File: `src/components/trip-wizard/AddTravelersStep.tsx`**

Replace manual name input with multi-option add flow:

```text
[+ Add Traveler]
       │
       ▼
┌──────────────────────────────┐
│ Search Users (@username)     │
├──────────────────────────────┤
│ 🔍 Search people on OTGC... │
│                              │
│ [John Smith]  📍 LAX        │
│ [Jane Doe]    📍 JFK        │
│                              │
│ ────────────────────────     │
│ [📷 Scan ID]  [✏️ Manual]    │
│ [👥 Saved Companions]        │
└──────────────────────────────┘
```

- When platform user selected: auto-fill name, avatar, user_id
- Store `user_id` and `avatar_url` in traveler object
- Show avatar in TravelerCard instead of generic User icon

### Step 5: Update TravelerCard Component

**File: `src/components/trip-wizard/TravelerCard.tsx`**

Display avatar if available:

```typescript
interface TravelerCardProps {
  name: string;
  origin: Airport;
  isOrganizer: boolean;
  avatarUrl?: string;     // New: show actual photo
  userId?: string;        // New: indicate platform user
  onRemove?: () => void;
}

// In render:
{avatarUrl ? (
  <img src={avatarUrl} className="w-12 h-12 rounded-full object-cover" />
) : (
  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
    <User className="w-6 h-6" />
  </div>
)}
```

### Step 6: Update Trip Save Flow

**File: `src/lib/tripService.ts`**

Ensure `user_id` and `avatar_url` are preserved in travelers JSON:

```typescript
// In saveTrip - travelers already includes user_id/avatar_url from wizard
travelers: input.travelers, // Now includes user_id, avatar_url
```

### Step 7: Enhanced Share Image Generation

**File: `supabase/functions/generate-share-image/index.ts`**

Accept traveler photos and use image editing to create group shot:

```typescript
// Request body now includes traveler details
interface ShareImageRequest {
  tripId: string;
  destinationCity: string;
  destinationCountry: string;
  travelers: Array<{
    name: string;
    avatar_url?: string;
  }>;
}

// Build multi-modal prompt with reference images
const messages = [];

// Add base prompt
messages.push({
  role: "user",
  content: [
    {
      type: "text",
      text: `Create a stunning ultra-wide cinematic travel photo at ${destinationCity}, ${destinationCountry}.
Show ${travelers.length} friends at a famous landmark, golden hour lighting.
Use the reference photos below to create the people in the image.
16:9 aspect ratio, professional travel photography, Instagram-worthy.`
    },
    // Include reference images for each traveler with avatar
    ...travelers
      .filter(t => t.avatar_url)
      .map(t => ({
        type: "image_url",
        image_url: { url: t.avatar_url }
      }))
  ]
});
```

### Step 8: Update claimTrip to Pass Traveler Photos

**File: `src/lib/tripService.ts`**

Include avatar URLs when triggering share image:

```typescript
// In claimTrip function
const travelers = tripData.travelers as TravelerCost[];

// Get organizer's avatar
const { data: profile } = await supabase
  .from("profiles")
  .select("avatar_url")
  .eq("id", user.id)
  .single();

const travelerData = travelers.map(t => ({
  name: t.traveler_name,
  avatar_url: t.avatar_url || null,
}));

// Add organizer's photo as first
if (profile?.avatar_url) {
  travelerData[0].avatar_url = profile.avatar_url;
}

supabase.functions.invoke("generate-share-image", {
  body: {
    tripId,
    destinationCity: tripData.destination_city,
    destinationCountry: tripData.destination_country,
    travelers: travelerData,
  },
});
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/tripTypes.ts` | Modify | Add `user_id`, `avatar_url` to Traveler types |
| `src/lib/userService.ts` | Create | User search functionality |
| `src/components/trip-wizard/UserSearchPicker.tsx` | Create | Platform user search UI |
| `src/components/trip-wizard/AddTravelersStep.tsx` | Modify | Integrate user search picker |
| `src/components/trip-wizard/TravelerCard.tsx` | Modify | Display avatars |
| `src/lib/tripService.ts` | Modify | Pass traveler photos to share image |
| `supabase/functions/generate-share-image/index.ts` | Modify | Multi-modal image generation |

---

## Technical Details

### User Search Query

```sql
SELECT id, full_name, avatar_url, home_city, home_country
FROM profiles
WHERE full_name ILIKE '%query%' OR email ILIKE '%query%'
LIMIT 10
```

### RLS Considerations

Profiles table needs a policy allowing users to search other users:

```sql
-- Allow authenticated users to search profiles (read-only, limited fields)
CREATE POLICY "Users can search other profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);
```

### Nano Banana Multi-Modal Prompt

The AI model supports multiple images as references. We'll pass:
1. Text prompt describing the scene
2. Reference photos of each traveler with an avatar

The model will use these references to generate a cohesive group image at the destination.

### Fallback Logic

If no travelers have avatars:
- Use current behavior (generic "X friends" prompt)
- No image references passed

If some travelers have avatars:
- Pass available reference photos
- AI will generate remaining people to match group size

---

## User Experience Flow

### Adding Platform User as Traveler

```text
1. User clicks "+ Add Traveler"
2. Search sheet opens
3. Types "@john" or "John Smith"
4. Sees John's profile card with avatar + home airport
5. Taps to add → John appears in travelers list with photo
6. John's user_id and avatar_url stored
```

### Share Image Generation

```text
1. Organizer claims trip
2. System collects all traveler avatar URLs
3. Fetches organizer's profile photo
4. Calls generate-share-image with photo references
5. Nano Banana creates group photo at destination
6. Image uploaded and stored as share_image_url
```

---

## Animation Specifications

| Element | Animation | Duration |
|---------|-----------|----------|
| User search results | Staggered fade-in | 50ms delay |
| Avatar reveal | Scale spring | 200ms |
| Picker sheet | Slide up | 300ms |
| User card hover | Subtle lift | 100ms |

