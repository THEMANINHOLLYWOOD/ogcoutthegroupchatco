
# AI-Generated Trip Image and Edit Mode

## Overview
Enhance the Trip Ready page with two key features:
1. Generate a custom AI image using Nano Banana that places all travelers' profile photos at the destination location, displayed prominently below the countdown timer
2. Add a minimalistic edit button on the timer that opens a modal to edit trip details, then re-runs the search and resets the 24-hour timer

## Visual Layout

```text
┌─────────────────────────────────────┐
│ ← Back                              │
├─────────────────────────────────────┤
│                                     │
│    ┌─────────────────────────┐      │
│    │  ⏱️ 23:45:32    [✏️]   │      │
│    │  Time remaining...       │      │
│    └─────────────────────────┘      │
│                                     │
│    ┌─────────────────────────┐      │
│    │   [AI-Generated Image]  │      │
│    │  Travelers at Destination│      │
│    │   (loading skeleton →   │      │
│    │    final image)         │      │
│    └─────────────────────────┘      │
│                                     │
│    [Destination Card]               │
│    [Payment Status]                 │
│    [Cost Summary]                   │
│    [Itinerary]                      │
│    [Share Button]                   │
│                                     │
└─────────────────────────────────────┘
```

---

## Feature 1: AI-Generated Group Image

### How It Works
1. When the trip is created, immediately trigger image generation in background
2. Pass all travelers' avatar URLs to the edge function
3. Use Nano Banana (Gemini 2.5 Flash Image) to create a composite image placing all travelers at the destination
4. Display a skeleton loader while generating, then fade in the final image
5. Cache the image at `share-images/{tripId}/group.png`

### Updated Prompt Strategy
The prompt will reference multiple face photos to generate a group shot:
- If multiple avatars: "Show these friends together enjoying [destination landmark]"
- Include all traveler profile photos as reference images

### UI Component
- New `TripGroupImage` component below the countdown
- Shows skeleton with shimmer effect while loading
- Displays generated image with rounded corners and shadow
- Fallback to destination-only image if no avatars available

---

## Feature 2: Edit Trip Details

### How It Works
1. Add a subtle pencil (edit) icon button on the timer component
2. Clicking opens a modal/sheet with the trip edit form
3. Form pre-filled with current: destination, origin, dates
4. On save:
   - Show searching state
   - Re-run `searchTrip()` with new parameters
   - Update trip in database with new costs
   - Re-trigger itinerary generation
   - Reset the 24-hour countdown timer
   - Close modal and refresh the page data

### Edit Modal Contents
```text
┌─────────────────────────────────────┐
│ Edit Trip Details              [X]  │
├─────────────────────────────────────┤
│                                     │
│  Destination                        │
│  [Airport Autocomplete]             │
│                                     │
│  Departing From                     │
│  [Airport Autocomplete]             │
│                                     │
│  Travel Dates                       │
│  [Date Range Picker]                │
│                                     │
│  ┌─────────────────────────────┐    │
│  │     Update Trip             │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Timer Reset Flow
1. User edits details and clicks "Update Trip"
2. System calls `searchTrip()` with new parameters
3. On success:
   - Update database with new flight/accommodation costs
   - Calculate new 24-hour expiration
   - Re-generate itinerary for new destination/dates
   - Regenerate AI group image for new destination
4. UI updates automatically via realtime subscription

---

## Technical Implementation

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/trip/TripGroupImage.tsx` | New component to display AI-generated group image |
| `src/components/trip/EditTripModal.tsx` | Modal for editing trip details |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/trip-wizard/TripReadyStep.tsx` | Add edit button, group image, handle edit flow |
| `src/components/trip/CountdownTimer.tsx` | Add optional edit button prop |
| `supabase/functions/generate-share-image/index.ts` | Update to handle multiple traveler avatars |
| `src/lib/tripService.ts` | Add `updateTrip()` function |
| `src/pages/CreateTrip.tsx` | Handle edit completion and state refresh |

---

## Detailed Component Specifications

### TripGroupImage Component

```typescript
interface TripGroupImageProps {
  tripId: string;
  destinationCity: string;
  destinationCountry: string;
  travelers: Traveler[];
  onImageReady?: (imageUrl: string) => void;
}
```

**Behavior:**
- On mount, check for existing cached image
- If not cached, trigger generation via edge function
- Show skeleton with subtle pulse animation while loading
- Fade in the image when ready
- 16:9 aspect ratio with rounded corners

### EditTripModal Component

```typescript
interface EditTripModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDestination: Airport;
  currentOrigin: Airport;
  currentDepartureDate: Date;
  currentReturnDate: Date;
  travelers: Traveler[];
  tripId: string;
  onUpdateComplete: (newData: {
    tripResult: TripResult;
    destination: Airport;
    origin: Airport;
    departureDate: Date;
    returnDate: Date;
    expiresAt: string;
  }) => void;
}
```

**Behavior:**
- Sheet/Dialog with form fields
- Pre-populated with current values
- "Update Trip" button triggers search
- Shows loading state during search
- Calls callback with new data on success
- Toast on error

### CountdownTimer Updates

```typescript
interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
  onEdit?: () => void;  // NEW: Optional edit handler
}
```

**UI Change:**
- If `onEdit` provided, show a small pencil icon button
- Positioned in top-right of timer component
- Subtle hover effect

---

## Edge Function Updates

### generate-share-image Updates

**New Input Format:**
```typescript
{
  tripId: string;
  destinationCity: string;
  destinationCountry: string;
  travelers: Array<{
    name: string;
    avatar_url?: string;
  }>;
  type?: 'group' | 'personal';  // NEW: Support group images
}
```

**Prompt for Multiple Travelers:**
```
Create a stunning travel photo at ${destinationCity}, ${destinationCountry}.
Show ${count} friends together enjoying a famous landmark.
Use the reference photos to create realistic depictions of these people.
Golden hour lighting, vibrant colors, Instagram-worthy.
Professional travel photography style, 16:9 aspect ratio.
The friends should look happy and excited together.
```

**Storage Path:**
- Group images: `share-images/{tripId}/group.png`
- Personal images: `share-images/{tripId}/{userId}.png`

---

## Data Flow

### On Trip Creation
```text
1. Trip saved → tripId generated
2. Trigger generateItinerary() (existing)
3. Trigger generateGroupImage() (NEW)
   └─ Pass all traveler avatar_urls
   └─ Generate composite image
   └─ Store at share-images/{tripId}/group.png
4. TripGroupImage component polls/subscribes for image
5. Image appears with fade animation
```

### On Trip Edit
```text
1. User clicks edit icon on timer
2. EditTripModal opens (pre-filled)
3. User changes details, clicks "Update Trip"
4. Modal shows loading state
5. searchTrip() called with new params
6. On success:
   └─ Update trip in database
   └─ Reset expiration to +24 hours
   └─ Regenerate itinerary
   └─ Regenerate group image for new destination
   └─ Close modal
   └─ UI updates via callback/realtime
7. User sees updated costs and new countdown
```

---

## User Experience Details

### Image Generation States
1. **Loading**: Skeleton with subtle shimmer animation
2. **Ready**: Image fades in smoothly
3. **Error**: Hide the section gracefully (no error shown to user)

### Edit Button Styling
- Small, subtle pencil icon
- Ghost button variant
- Positioned near timer without cluttering
- Hover shows tooltip "Edit trip details"

### Edit Flow Feedback
- Modal shows loading spinner during search
- Success: Toast "Trip updated!" + modal closes
- Failure: Toast with error, modal stays open
