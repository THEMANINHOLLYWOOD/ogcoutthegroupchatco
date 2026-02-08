

# Fix Share Trip Button Dynamic Link

## Problem
The "Share Trip" button on the TripReadyStep page generates broken links because of two issues in the URL construction:

1. **Hardcoded domain**: Uses `https://outthegroupchatco.com` instead of the current origin
2. **Wrong URL parameter**: Uses the 6-character `shareCode` instead of the UUID `tripId`

The route is defined as `/trip/:tripId` which expects the trip UUID, not the share code.

## Current Code (Broken)
```typescript
// TripReadyStep.tsx line 115
const shareUrl = `https://outthegroupchatco.com/trip/${shareCode}`;
```

This generates: `https://outthegroupchatco.com/trip/ABC123` (wrong domain, wrong ID)

## Correct Implementation
```typescript
const shareUrl = `${window.location.origin}/trip/${tripId}`;
```

This generates: `https://your-app.lovable.app/trip/uuid-here` (correct domain, correct ID)

---

## File to Modify

| File | Change |
|------|--------|
| `src/components/trip-wizard/TripReadyStep.tsx` | Fix `shareUrl` construction in `handleShare` function |

---

## Implementation Details

### TripReadyStep.tsx - Line 115

**Before:**
```typescript
const handleShare = async () => {
  const shareUrl = `https://outthegroupchatco.com/trip/${shareCode}`;
  // ...
};
```

**After:**
```typescript
const handleShare = async () => {
  const shareUrl = `${window.location.origin}/trip/${tripId}`;
  // ...
};
```

Also update the share text to include the share code for easy entry on the `/join` page:

```typescript
if (navigator.share) {
  try {
    await navigator.share({
      title: `Trip to ${destination.city}`,
      text: `Join our trip to ${destination.city}! Use code: ${shareCode}`,
      url: shareUrl,
    });
  }
}
```

---

## Data Flow

```text
User clicks "Share Trip"
       ↓
handleShare() constructs URL
       ↓
URL: ${window.location.origin}/trip/${tripId}
       ↓
Example: https://preview.lovable.app/trip/abc123-uuid-here
       ↓
Recipient clicks link
       ↓
TripView.tsx loads with tripId from URL params
       ↓
fetchTrip(tripId) queries database
       ↓
Trip displays correctly ✓
```

---

## Why This Was Broken

1. The share code (`ABC123`) is meant for manual entry on `/join`
2. The trip route `/trip/:tripId` expects the UUID
3. The hardcoded domain doesn't match the actual app URL

---

## Summary

| Issue | Fix |
|-------|-----|
| Hardcoded domain | Use `window.location.origin` for dynamic URL |
| Wrong ID in URL | Use `tripId` (UUID) instead of `shareCode` |
| Missing code in text | Include share code in the share message for `/join` fallback |

