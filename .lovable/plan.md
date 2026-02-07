

# Upgrade to Nano Banana Pro (Gemini 3 Pro Image)

## Overview
Switch the image generation model from `google/gemini-2.5-flash-image` (Nano Banana) to `google/gemini-3-pro-image-preview` (Nano Banana Pro) for higher quality AI-generated travel photos.

---

## Current State
- Using: `google/gemini-2.5-flash-image`
- Good quality but basic image generation
- Faster response times

## Target State
- Using: `google/gemini-3-pro-image-preview`
- Higher quality, better face matching from reference photos
- Slightly slower but produces better results

---

## Change Required

**File:** `supabase/functions/generate-share-image/index.ts`

**Single Line Change (line 178):**
```typescript
// Before
model: "google/gemini-2.5-flash-image",

// After
model: "google/gemini-3-pro-image-preview",
```

---

## Trade-offs

| Aspect | Impact |
|--------|--------|
| Image Quality | Better - more realistic faces and scenes |
| Face Matching | Improved - better at recreating reference photos |
| Speed | Slower - may take a few more seconds |
| Cost | Higher - uses more credits per generation |

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/generate-share-image/index.ts` | Update model ID on line 178 |

