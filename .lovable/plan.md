
# Enhanced Trip Creation Flow + Collaborative Reactions

## Overview

This plan addresses four key improvements:
1. Add an ID/passport upload step as the **first step** of trip creation (now 4 steps total)
2. For signed-in users with saved travel documents, show a "Use saved info" button
3. Ensure itinerary is stored and consistent across all viewers (already working)
4. Ensure reactions display correctly with counts on day buttons (already implemented)

---

## Current State Analysis

### What's Already Working
- **Itinerary Storage**: The `generate-itinerary` edge function saves itinerary to the `trips.itinerary` column - all viewers see the same data
- **Reactions Database**: The `activity_reactions` table exists with proper RLS policies
- **Day Button Counts**: `ItineraryView.tsx` already has `getDayReactionCount()` function showing counts on day buttons
- **Traveler Documents**: Database table `traveler_documents` exists with save/retrieve functions

### What Needs Changes
- Add a new "Your Info" step as step 1 (ID upload or use saved info)
- Update step numbering from 3 to 4 steps
- Verify reactions work for all signed-in users viewing shared links

---

## Part 1: New ID Upload Step (Step 1 of 4)

### New Component: `YourInfoStep.tsx`

A minimalistic Apple-style step that:
1. Checks if user is signed in
2. If signed in and has saved document → shows "Use your saved info" button
3. Shows ID upload options (camera/file upload)
4. Shows "Skip for now" option

```text
┌──────────────────────────────────────────────────┐
│  Your Travel Info                                │
│  Let's set you up for seamless booking           │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  ✨ Use saved passport info              │    │
│  │     John Michael Doe • Exp: 2028-05-15   │    │
│  └──────────────────────────────────────────┘    │
│                    or                            │
│  ┌──────────────────────────────────────────┐    │
│  │  📷  Scan ID or Passport                 │    │
│  │     Quick AI-powered extraction          │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  📤  Upload ID photo                     │    │
│  │     From your photo library              │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ─────────────────────────────────────────────   │
│                                                  │
│  [Skip for now →]                                │
└──────────────────────────────────────────────────┘
```

### Step Flow Logic

```text
User opens /create-trip
       ↓
Step 1: YourInfoStep
       ↓
┌─────────────────────────────────────────────┐
│ User has saved document?                     │
│   YES → Show "Use saved info" button         │
│   NO  → Show ID upload options               │
│                                             │
│ User can also:                               │
│   - Skip entirely                            │
│   - Scan new ID (replaces saved)             │
└─────────────────────────────────────────────┘
       ↓
Step 2: TripDetailsStep (destination, dates)
       ↓
Step 3: AddTravelersStep
       ↓
Step 4: Ready (searching → results)
```

---

## Part 2: Update CreateTrip.tsx

### New Step Type and Numbers

```typescript
type Step = "your-info" | "trip-details" | "travelers" | "searching" | "ready";

const stepNumbers: Record<Step, number> = {
  "your-info": 1,
  "trip-details": 2,
  travelers: 3,
  searching: 3,
  ready: 4,
};

const totalSteps = 4;
```

### Initial Step

```typescript
const [step, setStep] = useState<Step>("your-info");
```

### Handler for YourInfoStep

```typescript
const handleYourInfoContinue = useCallback((document: SavedDocument | null) => {
  if (document) {
    setSavedDocument(document);
  }
  setStep("trip-details");
}, []);
```

---

## Part 3: ID Scan Integration

### Use Existing Components

The project already has ID scanning components:
- `IDUploadCard.tsx` - Upload buttons
- `IDProcessing.tsx` - Processing spinner
- `TravelerForm.tsx` - Edit extracted data
- `TravelerReview.tsx` - Review extracted data
- `idExtraction.ts` - AI extraction logic
- `travelerService.ts` - Save to database

### Save Document After Extraction

When user scans ID:
1. Call `extract-id` edge function
2. Show extraction results for review
3. If user confirms, call `saveUserDocument()` to persist
4. Continue to trip details

---

## Part 4: Database Verification

### Existing Tables (No Changes Needed)

| Table | Purpose | Status |
|-------|---------|--------|
| `trips.itinerary` | Stores generated itinerary | ✓ Working |
| `traveler_documents` | Stores user's own travel document | ✓ Exists |
| `activity_reactions` | Stores thumbs up/down | ✓ Working |

### RLS Policies (Already Correct)

| Table | Policy | Status |
|-------|--------|--------|
| `activity_reactions` | Anyone can view | ✓ |
| `activity_reactions` | Signed-in users can add their own | ✓ |
| `traveler_documents` | Users can manage their own | ✓ |

---

## Part 5: Reactions Verification

### Current Implementation Status

The reactions system is already fully implemented:

1. **ItineraryView.tsx** - Has `getDayReactionCount()` helper showing counts on day buttons
2. **TripView.tsx** - Passes `reactions`, `onReact`, and `canReact` props to `ItineraryView`
3. **TripReadyStep.tsx** - Same reaction props for creator view
4. **ReactionBubbles.tsx** - Shows 👍/👎 buttons with counts
5. **reactionService.ts** - Handles add/remove/fetch with realtime subscriptions

### What Works

```text
✓ Any signed-in user can react (not just the creator)
✓ Reactions update in real-time via Supabase subscriptions
✓ Day buttons show total reaction counts
✓ User can only have one reaction per activity (toggle)
✓ Visual feedback when user has reacted
```

### Edge Case: Not Signed In

Users who aren't signed in see reactions but buttons are disabled. The toast "Sign in required" appears if they try to react.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/trip-wizard/YourInfoStep.tsx` | **CREATE** - New ID upload step |
| `src/pages/CreateTrip.tsx` | Update steps, add your-info step |

---

## New Component: YourInfoStep.tsx

```typescript
interface YourInfoStepProps {
  userId?: string;
  savedDocument: SavedDocument | null;
  onContinue: (document: SavedDocument | null) => void;
  onBack: () => void;
}

// States:
// 1. "idle" - show options
// 2. "scanning" - show camera/file picker
// 3. "processing" - extracting data
// 4. "review" - show extracted data for confirmation
// 5. "saving" - saving to database
```

### UI Elements

1. **Header**: "Your Travel Info" with subtitle
2. **Saved Info Card**: If user has saved document, show preview with "Use This" button
3. **Scan Options**: Camera and upload buttons (using existing IDUploadCard)
4. **Skip Link**: "Skip for now" at bottom

---

## Updated CreateTrip Flow

```text
/create-trip loads
       ↓
Fetch savedDocument for user (if signed in)
       ↓
Show Step 1: YourInfoStep
       ↓
User chooses:
├─ "Use saved info" → Continue with saved doc
├─ "Scan ID" → Extract → Review → Save → Continue
├─ "Skip" → Continue without doc
       ↓
Step 2: TripDetailsStep
       ↓
Step 3: AddTravelersStep
       ↓
Step 4: SearchingStep → TripReadyStep
```

---

## Summary

| Change | Impact |
|--------|--------|
| Add YourInfoStep | 4-step wizard with ID upload first |
| Use saved info button | Signed-in users can skip ID scan |
| Verify itinerary storage | Already working - no changes |
| Verify reactions | Already working - any signed-in user can react |
| Day button counts | Already implemented - shows total reactions |
