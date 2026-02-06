

# Plan: Pay Button + AI-Generated Share Image

## Overview

Two features for the Trip Dashboard:

1. **Pay Button**: Replace "Copy Link" with a prominent "Pay" button for each traveler (per-person payment flow), keeping just the share button for inviting friends.

2. **AI Share Image**: When a trip is claimed, generate a custom share image using Nano Banana (Gemini) showing the travelers at the destination. Use profile photos if travelers have accounts, or generate stylized avatars.

---

## Current State

- Dashboard shows `ShareButton` with "Copy Link" + native Share
- `TravelerPaymentStatus` shows payment toggles (manual)
- No AI image generation exists in the codebase
- Profiles have `avatar_url` field
- Travel companions stored in `travel_companions` table (no user linking yet)

---

## Implementation

### Part 1: Pay Button in Dashboard

**Current Layout:**
```text
[Travelers Section]
  - John (Organizer) → Toggle paid
  - Sarah → Toggle paid
  - Mike → Toggle paid

[Share Section]
  - Trip Code: ABC123
  - [Copy Link] [Share]
```

**New Layout:**
```text
[Travelers Section]
  - John (Organizer) [$1,080] → [Pay] or ✓ Paid
  - Sarah [$1,080] → [Pay] or ✓ Paid
  - Mike [$1,080] → [Pay] or ✓ Paid

[Share Section]
  - Trip Code: ABC123
  - [Share with Friends 📤]
```

**Changes:**
- Replace toggle checkmark with "Pay" button (prominent, primary style)
- When tapped, simulates payment for MVP (marks as paid)
- Remove "Copy Link" button, keep only Share button
- Show trip code + single share action

### Part 2: AI-Generated Share Image

**When**: Trip is claimed (during `claimTrip` or immediately after)

**What**: Generate a stylized image of travelers at the destination using Nano Banana

**Process:**
```text
[User Claims Trip]
      |
      v
[Generate Share Image]
      |
      | POST to Nano Banana via Edge Function
      | Prompt: "3 friends at Eiffel Tower, Paris, travel photo style"
      v
[Upload to Storage]
      |
      | Store in trip_images bucket
      v
[Save URL to Trip]
      |
      | trips.share_image_url = storage URL
      v
[Use in Share/OG Tags]
```

**Image Prompt Template:**
```
{travelerCount} friends enjoying {destination_city}, {destination_country}. 
Travel photography style, candid moment, golden hour lighting.
```

**Future Enhancement**: If travelers have linked accounts with avatar_url, use image editing to composite their faces. For MVP, generate a generic stylized travel image.

---

## Database Changes

Add column for share image:
```sql
ALTER TABLE trips ADD COLUMN share_image_url text;
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/TripDashboard.tsx` | Modify | Update layout, add Pay buttons |
| `src/components/trip/TravelerPaymentStatus.tsx` | Modify | Change toggle to Pay button |
| `src/components/trip/ShareButton.tsx` | Modify | Simplify to just Share action |
| `supabase/functions/generate-share-image/index.ts` | Create | Call Nano Banana API |
| `src/lib/tripService.ts` | Modify | Add generateShareImage call |
| Database migration | Create | Add share_image_url column |

---

## Technical Details

### Updated TravelerPaymentStatus

```typescript
// Each traveler row shows:
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    {/* Avatar or initials */}
    <div className="w-10 h-10 rounded-full bg-primary/10">
      {avatarUrl ? (
        <img src={avatarUrl} className="w-full h-full rounded-full object-cover" />
      ) : (
        <span className="text-sm font-semibold">{initials}</span>
      )}
    </div>
    <div>
      <span className="font-medium">{name}</span>
      <span className="text-sm text-muted-foreground">${amount}</span>
    </div>
  </div>
  
  {isPaid ? (
    <div className="flex items-center gap-2 text-primary">
      <Check className="w-4 h-4" />
      <span className="text-sm font-medium">Paid</span>
    </div>
  ) : (
    <Button size="sm" className="rounded-full">
      Pay ${amount}
    </Button>
  )}
</div>
```

### Simplified ShareButton (Claimed State)

```typescript
<div className="space-y-3">
  {/* Trip Code */}
  <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Trip Code:</span>
      <span className="font-mono text-lg font-bold">{shareCode}</span>
    </div>
    <Button variant="ghost" size="sm" onClick={handleCopyCode}>
      <Copy className="w-4 h-4" />
    </Button>
  </div>

  {/* Single Share Button */}
  <Button onClick={handleNativeShare} className="w-full h-12 rounded-xl">
    <Share className="w-4 h-4 mr-2" />
    Share with Friends
  </Button>
</div>
```

### Edge Function: generate-share-image

```typescript
// supabase/functions/generate-share-image/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { tripId, destinationCity, destinationCountry, travelerCount } = await req.json();

  // Call Nano Banana (Gemini image generation)
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{
        role: "user",
        content: `Generate a travel photo: ${travelerCount} friends enjoying ${destinationCity}, ${destinationCountry}. Candid travel moment, golden hour, vibrant colors.`
      }],
      modalities: ["image", "text"]
    }),
  });

  const data = await response.json();
  const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

  if (!imageBase64) {
    return new Response(JSON.stringify({ success: false, error: "No image generated" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Upload to Supabase Storage
  // ...decode base64, upload to trip_images bucket...
  // Update trips.share_image_url

  return new Response(JSON.stringify({ success: true, imageUrl: storageUrl }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
```

### Integration with claimTrip

```typescript
// In tripService.ts - after claiming trip
export async function claimTrip(tripId: string): Promise<{ success: boolean; error?: string }> {
  // ... existing claim logic ...

  // Trigger share image generation in background
  supabase.functions.invoke("generate-share-image", {
    body: {
      tripId,
      destinationCity: trip.destination_city,
      destinationCountry: trip.destination_country,
      travelerCount: trip.travelers.length,
    },
  });

  return { success: true };
}
```

---

## UI/UX Details

### Pay Button States

| State | Appearance |
|-------|------------|
| Unpaid | `[Pay $1,080]` - Primary button, prominent |
| Processing | `[Paying...]` - Disabled, loading spinner |
| Paid | `✓ Paid` - Green text + checkmark |

### Animation Specifications

| Element | Animation | Duration |
|---------|-----------|----------|
| Pay → Paid transition | Scale pop + confetti burst | 400ms |
| Button tap | Scale down to 0.95 | 100ms |
| Share image load | Fade in | 300ms |

### Share Image Placement

The generated image can be used for:
1. **OG Meta Tags**: When link is shared, show the AI image
2. **Dashboard Preview**: Small thumbnail in share section
3. **Native Share**: Attach image when using Web Share API

---

## Future Enhancements

1. **Stripe Integration**: Replace simulated pay with real checkout
2. **Face Compositing**: Use travelers' actual profile photos in the generated image
3. **Multiple Image Options**: Generate 3 options, let organizer pick
4. **Regenerate Button**: Allow organizer to regenerate share image

---

## Summary

**Part 1 - Pay Button:**
- Add prominent "Pay $X" button per traveler
- Simplify share section to just Share action
- Keep trip code display with copy button

**Part 2 - AI Share Image:**
- New edge function calling Nano Banana
- Generate travel-style image of destination
- Store in Supabase Storage
- Use for OG tags and native sharing

