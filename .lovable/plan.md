
# Upgrade extract-id to Gemini 3

## Current State
5 of 6 edge functions already use Gemini 3 models. Only `extract-id` needs updating.

## Change

| File | From | To |
|------|------|----|
| `supabase/functions/extract-id/index.ts` | `google/gemini-2.5-flash` | `google/gemini-3-flash-preview` |

## Code Change

```typescript
// Line 133 in extract-id/index.ts
// Before:
model: "google/gemini-2.5-flash",

// After:
model: "google/gemini-3-flash-preview",
```

## Why Gemini 3 Flash (not Pro)?

- **ID extraction is vision-based text extraction**—speed matters more than deep reasoning
- Gemini 3 Flash Preview is optimized for fast, accurate multimodal tasks
- Pro is overkill for OCR-style structured extraction
- Keeps cost lower for frequent document scans

## Summary

| Function | Model |
|----------|-------|
| `extract-id` | `google/gemini-3-flash-preview` |
| `search-trip` | `google/gemini-3-flash-preview` |
| `group-chat` | `google/gemini-3-flash-preview` |
| `generate-itinerary` | `google/gemini-3-flash-preview` |
| `find-alternative-activity` | `google/gemini-3-flash-preview` |
| `generate-share-image` | `google/gemini-3-pro-image-preview` |

One-line change, then deploy.
