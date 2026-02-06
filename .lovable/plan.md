

# Plan: Dynamic Per-Share Image Generation

## Overview

Transform the sharing experience so that each time a user clicks "Share with Friends", a fresh AI-generated image is created using:
1. **The sharer's profile picture** as the primary face reference
2. **The trip destination** as the backdrop
3. **On-demand generation** each share action triggers a new image (with loading state)

This replaces the current one-time generation at claim with a per-share dynamic flow.

---

## Current State Analysis

| Aspect | Current Behavior |
|--------|------------------|
| Image Generation | Once at trip claim (background) |
| Image Storage | `share_image_url` on trip record |
| Share Flow | Uses pre-generated image if exists |
| User Context | Uses all travelers' avatars from trip creation |
| Trigger | `claimTrip()` calls edge function |

### Problem
The current approach generates one static image at claim time. If the organizer's profile changes, or if different users want to share with their own face, the image doesn't adapt.

---

## Solution Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                    DYNAMIC SHARE FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User clicks [Share with Friends]                               │
│       │                                                         │
│       ▼                                                         │
│  [Generate Personal Share Image]  ◄── Loading spinner           │
│       │                                                         │
│       ├──▶ Edge function receives:                              │
│       │    • tripId                                             │
│       │    • userId (current user)                              │
│       │    • destinationCity/Country                            │
│       │                                                         │
│       ├──▶ Fetch user's avatar_url from profiles                │
│       │                                                         │
│       ├──▶ Generate image with Nano Banana:                     │
│       │    • User's face as reference                           │
│       │    • Destination landmark backdrop                      │
│       │                                                         │
│       ├──▶ Upload to storage: share-images/{tripId}/{userId}.png│
│       │                                                         │
│       └──▶ Return imageUrl to client                            │
│                                                                 │
│  Native Share Dialog opens with fresh image                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Update Edge Function for Per-User Generation

**File: `supabase/functions/generate-share-image/index.ts`**

Modify to accept `userId` and generate personalized images:

```typescript
interface ShareImageRequest {
  tripId: string;
  userId?: string;              // Current user requesting share
  destinationCity: string;
  destinationCountry: string;
  travelers?: TravelerData[];   // Fallback for legacy calls
}

// In handler:
let avatarUrl: string | null = null;

// If userId provided, fetch their profile
if (userId) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url, full_name")
    .eq("id", userId)
    .single();
  
  avatarUrl = profile?.avatar_url || null;
}

// Generate prompt with single user focus
const prompt = avatarUrl 
  ? `Ultra-wide cinematic travel photo at ${destinationCity}, ${destinationCountry}.
     Show a happy traveler enjoying a famous landmark, golden hour lighting.
     Use the reference photo to create a realistic depiction of this person.
     Professional Instagram-worthy travel photography, 16:9 aspect ratio.`
  : `Ultra-wide cinematic travel photo at ${destinationCity}, ${destinationCountry}.
     Show a happy traveler at a famous landmark, golden hour, vibrant colors.
     Professional travel photography, Instagram-worthy, 16:9 aspect ratio.`;

// Store per-user: share-images/{tripId}/{userId}.png
const fileName = userId 
  ? `share-images/${tripId}/${userId}.png`
  : `share-images/${tripId}.png`;
```

### Step 2: Create Generate Share Image Service Function

**File: `src/lib/tripService.ts`**

Add new function to trigger on-demand generation:

```typescript
export async function generatePersonalShareImage(
  tripId: string,
  destinationCity: string,
  destinationCountry: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const response = await supabase.functions.invoke("generate-share-image", {
      body: {
        tripId,
        userId: user?.id,
        destinationCity,
        destinationCountry,
      },
    });

    if (response.error) {
      return { success: false, error: response.error.message };
    }

    const data = response.data as { success: boolean; imageUrl?: string; error?: string };
    return data;
  } catch (err) {
    console.error("Error generating share image:", err);
    return { success: false, error: "Failed to generate image" };
  }
}
```

### Step 3: Update ShareButton Component

**File: `src/components/trip/ShareButton.tsx`**

Add loading state and trigger generation before sharing:

```typescript
interface ShareButtonProps {
  tripId: string;
  shareCode: string;
  isClaimed?: boolean;
  destinationCity: string;    // NEW
  destinationCountry: string; // NEW
}

export function ShareButton({ 
  tripId, 
  shareCode, 
  isClaimed = false,
  destinationCity,
  destinationCountry,
}: ShareButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const handleNativeShare = async () => {
    // Show generating state
    setIsGenerating(true);

    try {
      // Generate fresh personal share image
      const result = await generatePersonalShareImage(
        tripId,
        destinationCity,
        destinationCountry
      );

      if (result.success && result.imageUrl) {
        setGeneratedImageUrl(result.imageUrl);
      }

      // Proceed with share (with or without image)
      if (navigator.share) {
        await navigator.share({
          title: `Trip to ${destinationCity}!`,
          text: `Join us on this amazing adventure to ${destinationCity}! Use code: ${shareCode}`,
          url: shareUrl,
        });
      } else {
        handleCopyLink();
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        handleCopyLink();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Button with loading state
  <Button
    onClick={handleNativeShare}
    disabled={isGenerating}
    className="w-full h-11 sm:h-12 rounded-xl"
  >
    {isGenerating ? (
      <>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Creating your share image...
      </>
    ) : (
      <>
        <Share className="w-4 h-4 mr-2" />
        Share with Friends
      </>
    )}
  </Button>
}
```

### Step 4: Update ShareButton Props in Parent Components

**Files to update:**
- `src/pages/TripView.tsx`
- `src/pages/TripDashboard.tsx`

Pass destination info to ShareButton:

```typescript
<ShareButton 
  tripId={trip.id} 
  shareCode={trip.share_code} 
  isClaimed={!!trip.organizer_id}
  destinationCity={trip.destination_city}
  destinationCountry={trip.destination_country}
/>
```

### Step 5: Add Image Preview (Optional Enhancement)

Show a quick preview of the generated image before sharing:

```typescript
// After generation succeeds, show mini preview
{generatedImageUrl && (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="rounded-xl overflow-hidden mb-3"
  >
    <img 
      src={generatedImageUrl} 
      alt="Your share preview"
      className="w-full aspect-video object-cover"
    />
  </motion.div>
)}
```

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/generate-share-image/index.ts` | Modify | Accept userId, per-user storage |
| `src/lib/tripService.ts` | Modify | Add generatePersonalShareImage function |
| `src/components/trip/ShareButton.tsx` | Modify | Loading state, trigger generation on share |
| `src/pages/TripView.tsx` | Modify | Pass destination to ShareButton |
| `src/pages/TripDashboard.tsx` | Modify | Pass destination to ShareButton |

---

## Technical Details

### Storage Structure

```text
travel-media/
└── share-images/
    └── {tripId}/
        ├── {userId1}.png   ← User 1's personalized image
        ├── {userId2}.png   ← User 2's personalized image
        └── default.png     ← Fallback for non-logged-in users
```

### Edge Function Flow

```text
1. Receive { tripId, userId, destinationCity, destinationCountry }
2. If userId → fetch profiles.avatar_url
3. Build prompt with reference photo (if avatar exists)
4. Call Nano Banana with multi-modal content
5. Upload to storage with user-specific path
6. Return { success: true, imageUrl }
```

### Caching Strategy

To avoid regenerating on every share:
- Check if image already exists for user: `share-images/${tripId}/${userId}.png`
- If exists and recent (< 24 hours), return cached URL
- Otherwise, regenerate

```typescript
// Check for existing image
const { data: existingImage } = await supabase.storage
  .from("travel-media")
  .list(`share-images/${tripId}`, {
    search: `${userId}.png`
  });

if (existingImage?.length > 0) {
  // Return cached image
  const { data: urlData } = supabase.storage
    .from("travel-media")
    .getPublicUrl(`share-images/${tripId}/${userId}.png`);
  return { success: true, imageUrl: urlData.publicUrl };
}
```

---

## User Experience Flow

```text
1. User on trip dashboard/view clicks "Share with Friends"
2. Button shows "Creating your share image..." with spinner
3. Edge function generates personalized image (2-5 seconds)
4. Native share sheet opens with the trip link
5. When shared to iMessage/WhatsApp, link preview shows the AI image
6. Subsequent shares reuse cached image (instant)
```

---

## Animation Specifications

| Element | Animation | Duration |
|---------|-----------|----------|
| Button loading | Spin + text change | Continuous |
| Image preview | Scale spring | 200ms |
| Button re-enable | Fade | 150ms |

---

## Fallback Behavior

| Scenario | Behavior |
|----------|----------|
| User not logged in | Generate generic destination image |
| User has no avatar | Generate without face reference |
| Generation fails | Share anyway without custom image |
| Slow connection | 10 second timeout, then share without image |

