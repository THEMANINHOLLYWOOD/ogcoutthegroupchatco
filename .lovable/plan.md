
# Plan: ID/Passport Scanning with Gemini 3 Vision

## Overview

When users click "Create a Trip", they'll be taken to a beautiful, minimalistic onboarding flow that uses **Gemini 3's image analysis** to extract all necessary traveler information from a photo of their ID or passport. This data is essential for booking flights and becomes the foundation of their traveler profile.

---

## User Journey

```text
[Landing Page] 
     |
     | Click "Create a Trip"
     v
[/create-trip] - ID Upload Screen
     |
     | Upload/Take Photo of ID or Passport
     v
[Gemini 3 Vision Processing]
     |
     | Extract all traveler information
     v
[Review & Confirm Screen]
     |
     | User confirms/edits extracted data
     v
[Next Step: Trip Details] (future)
```

---

## What Information Will Be Extracted

From an ID or Passport, Gemini 3 will extract:

| Field | Purpose |
|-------|---------|
| Full Legal Name | Flight booking (must match exactly) |
| First Name | Personalization |
| Last Name | Flight booking |
| Middle Name | Flight booking (if applicable) |
| Date of Birth | Age verification, flight booking |
| Document Number | Passport/ID number for international travel |
| Document Type | Passport vs Driver's License vs ID |
| Expiration Date | Ensure document is valid for travel |
| Nationality/Country | International travel requirements |
| Gender | Flight booking |
| Issue Date | Document verification |
| Place of Birth | Some international bookings require this |

---

## Implementation Steps

### Step 1: Create the Route Structure

**File: `src/App.tsx`**

Add new route for `/create-trip`

### Step 2: Create the ID Upload Page

**File: `src/pages/CreateTrip.tsx`**

A minimalistic, iMessage-inspired page with:
- Clean white background with subtle glass effects
- Step indicator (Step 1 of X)
- Hero text: "Let's get you trip-ready"
- Subtext explaining why we need their ID
- Two upload options styled as iOS-like cards:
  - Camera icon - "Take a Photo" (mobile-friendly)
  - Upload icon - "Upload from Device"
- Privacy reassurance text
- File input (hidden, triggered by buttons)
- Drag-and-drop zone for desktop

### Step 3: Create the Edge Function for ID Processing

**File: `supabase/functions/extract-id/index.ts`**

Edge function that:
1. Receives base64-encoded image
2. Sends to Gemini 3 with vision capabilities using `google/gemini-2.5-flash` (has multimodal/image support)
3. Uses structured output (tool calling) to ensure consistent JSON response
4. Returns extracted traveler information
5. Handles errors gracefully (blurry image, wrong document type, etc.)

### Step 4: Create Processing State Components

**File: `src/components/IDProcessing.tsx`**

Animated processing state showing:
- Pulsing document icon
- "Scanning your ID..." text
- Subtle progress animation
- Status updates as extraction happens

### Step 5: Create Review/Confirm Screen

**File: `src/components/TravelerReview.tsx`**

After extraction, show:
- All extracted fields in editable form
- Any fields that couldn't be extracted highlighted
- Photo thumbnail of their document
- "Confirm" button to proceed
- "Retake Photo" option if quality was poor

### Step 6: Update config.toml

**File: `supabase/config.toml`**

Add the new edge function configuration.

---

## Technical Details

### Edge Function: `extract-id`

```typescript
// Key implementation details:

// 1. Use google/gemini-2.5-flash for image analysis (multimodal)
// 2. Send image as base64 in the message content
// 3. Use tool calling for structured output

const tools = [{
  type: "function",
  function: {
    name: "extract_traveler_info",
    description: "Extract traveler information from ID or passport image",
    parameters: {
      type: "object",
      properties: {
        document_type: { type: "string", enum: ["passport", "drivers_license", "national_id", "unknown"] },
        full_legal_name: { type: "string" },
        first_name: { type: "string" },
        middle_name: { type: "string" },
        last_name: { type: "string" },
        date_of_birth: { type: "string", description: "YYYY-MM-DD format" },
        gender: { type: "string", enum: ["M", "F", "X", "unknown"] },
        nationality: { type: "string" },
        document_number: { type: "string" },
        expiration_date: { type: "string", description: "YYYY-MM-DD format" },
        issue_date: { type: "string" },
        place_of_birth: { type: "string" },
        issuing_country: { type: "string" },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
        issues: { 
          type: "array", 
          items: { type: "string" },
          description: "Any issues detected (blurry, glare, partial, etc.)"
        }
      },
      required: ["document_type", "confidence"]
    }
  }
}];
```

### Image Handling

- Accept JPEG, PNG, HEIC formats
- Compress large images client-side before sending (max 4MB)
- Convert to base64 for API transmission
- Store image temporarily in memory (not persisted for privacy)

### UI Component Structure

```text
src/
  pages/
    CreateTrip.tsx           # Main page with upload UI
  components/
    id-scan/
      IDUploadCard.tsx       # Upload option cards
      IDProcessing.tsx       # Processing animation
      TravelerReview.tsx     # Review extracted data
      TravelerForm.tsx       # Editable form fields
  lib/
    idExtraction.ts          # API client for edge function
```

### Styling Approach

Following the existing iMessage-inspired design:
- Rounded corners (1.25rem / rounded-2xl)
- Subtle shadows (`shadow-soft`)
- Glass morphism for overlays
- iOS blue primary color
- Smooth spring animations with Framer Motion
- Clean typography with SF Pro-like font stack

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/App.tsx` | Modify | Add `/create-trip` route |
| `src/pages/CreateTrip.tsx` | Create | Main ID upload page |
| `src/components/id-scan/IDUploadCard.tsx` | Create | Upload option buttons |
| `src/components/id-scan/IDProcessing.tsx` | Create | Processing animation |
| `src/components/id-scan/TravelerReview.tsx` | Create | Review/edit extracted data |
| `src/components/id-scan/TravelerForm.tsx` | Create | Editable traveler fields |
| `src/lib/idExtraction.ts` | Create | Edge function client |
| `supabase/functions/extract-id/index.ts` | Create | Gemini 3 image extraction |
| `supabase/config.toml` | Modify | Add extract-id function config |

---

## Privacy & Security Considerations

- Images are processed in-memory only
- No ID images stored in database
- Only extracted text data is retained
- Clear messaging to users about data handling
- HTTPS encryption for all transmissions
- Consider adding option to manually enter info instead

---

## Future Steps (Not in This Plan)

After ID extraction is complete, the user journey continues:
1. Trip destination selection
2. Date picker
3. Add fellow travelers
4. Flight search
5. Accommodation search
6. Payment split setup

This plan focuses only on the ID extraction step as the foundation.
