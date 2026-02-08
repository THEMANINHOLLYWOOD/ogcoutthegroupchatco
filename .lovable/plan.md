
# Fix: Ensure Itinerary is Static and Never Regenerates

## Problem
When shared trip links are opened, the itinerary sometimes appears to "reload" or "rebuild" instead of showing the already-generated static content.

## Root Cause
Two issues identified:

1. **Race Condition**: If multiple users open a shared link simultaneously while `itinerary_status = "pending"`, each viewer triggers a separate `generateItinerary` call
2. **Missing Guard in Edge Function**: The `generate-itinerary` function doesn't check if itinerary is already being generated or is complete before starting

## Solution

### 1. Add Guard to Edge Function
Check current status before generating. Skip if already `"generating"` or `"complete"`.

```text
Edge Function Logic:
1. Fetch current trip status
2. If status is "complete" → return existing itinerary
3. If status is "generating" → return "in progress" message
4. If status is "pending" → proceed with generation
```

### 2. Update TripView.tsx
Only trigger generation for `"pending"` status (current behavior is correct, but add extra safety).

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/generate-itinerary/index.ts` | Add status check before generating |
| `src/pages/TripView.tsx` | Improve logging, no logic change needed |

---

## Edge Function Changes

```typescript
// Before generating, check current status
const { data: currentTrip } = await supabase
  .from("trips")
  .select("itinerary_status, itinerary")
  .eq("id", tripId)
  .single();

// Skip if already complete
if (currentTrip?.itinerary_status === "complete" && currentTrip?.itinerary) {
  console.log("Itinerary already complete, skipping generation");
  return new Response(JSON.stringify({ 
    success: true, 
    itinerary: currentTrip.itinerary,
    skipped: true 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Skip if already generating (another request is handling it)
if (currentTrip?.itinerary_status === "generating") {
  console.log("Itinerary generation already in progress");
  return new Response(JSON.stringify({ 
    success: true, 
    inProgress: true 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

---

## Data Flow After Fix

```text
Trip Created → status = "pending", itinerary = null
       ↓
First viewer opens link
       ↓
Check status → "pending" → Trigger generation
       ↓
Status updates to "generating"
       ↓
Second viewer opens link (simultaneously)
       ↓
Check status → "generating" → Skip, wait for realtime update
       ↓
AI generates itinerary
       ↓
Status updates to "complete", itinerary saved
       ↓
Both viewers receive update via realtime subscription
       ↓
All future viewers see "complete" → Display stored itinerary
```

---

## Summary

| Change | Purpose |
|--------|---------|
| Guard in edge function | Prevent duplicate generation |
| Status check before AI call | Skip if already complete |
| "generating" detection | Prevent race condition |

This ensures the itinerary is generated exactly once and all viewers see the same static content.
