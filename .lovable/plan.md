
# Plan: Fix "Build Your Itinerary" Feature

## Problem Diagnosis

The itinerary generation is failing with the exact same pattern as the previous `search-trip` issue:

| Evidence | Finding |
|----------|---------|
| Console error | `FunctionsFetchError: Failed to send a request to the Edge Function` |
| Network request | POST to `/functions/v1/generate-itinerary` fails with "Failed to fetch" |
| Edge function logs | **No logs found** - function is not running on Supabase |
| Code exists | `supabase/functions/generate-itinerary/index.ts` is present (213 lines) |
| Config exists | `supabase/config.toml` includes `[functions.generate-itinerary]` |

The function code is valid and complete - it just needs to be redeployed.

---

## Current Flow (Broken)

```text
1. Trip created → itinerary_status = "pending"
2. TripView loads → sees status is "pending"
3. Calls generateItinerary() in tripService.ts
4. supabase.functions.invoke("generate-itinerary", {...})
5. ❌ FAILS: Edge function not deployed/active
6. User sees skeleton loading forever (no itinerary)
```

---

## Solution

### Step 1: Redeploy Edge Function

The `generate-itinerary` function needs to be redeployed to Supabase:

| Action | Details |
|--------|---------|
| Function | `generate-itinerary` |
| Location | `supabase/functions/generate-itinerary/index.ts` |
| Change | None - code is correct, just needs deployment |

### Step 2: Verify Deployment

After deployment, the function should:
1. Respond to POST requests
2. Show logs in Supabase dashboard
3. Call Lovable AI Gateway to generate itinerary
4. Update the trip record with the generated itinerary

---

## Expected Result After Fix

```text
1. Trip created → itinerary_status = "pending"
2. TripView loads → sees status is "pending"
3. Calls generateItinerary()
4. Edge function receives request
5. Updates status to "generating"
6. Calls Lovable AI Gateway (Gemini 3 Flash)
7. AI returns structured itinerary data
8. Saves itinerary to trips table
9. Updates status to "complete"
10. Realtime subscription notifies client
11. User sees full day-by-day itinerary
```

---

## Files Affected

| File | Action |
|------|--------|
| `supabase/functions/generate-itinerary/index.ts` | Redeploy only (no code changes) |

---

## What the Edge Function Does

Once active, the `generate-itinerary` function:

1. Receives trip details (destination, dates, travelers, accommodation)
2. Builds a detailed prompt for the AI
3. Calls `ai.gateway.lovable.dev` with Gemini 3 Flash
4. Uses function calling to get structured output:
   - Overview (1-2 sentences)
   - Highlights (3-4 items)
   - Days array with activities (time, title, description, type, cost, tips)
5. Saves the itinerary JSON to the `trips.itinerary` column
6. Updates `itinerary_status` to "complete"

---

## Timeline

This is a deployment-only fix - no code modifications required. The trip at `/trip/73532747-1d02-444b-a0d6-8ac78e9752a7` should display its itinerary once the function is redeployed.
