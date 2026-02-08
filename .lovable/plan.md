
# Fix Corrupted Share Link URLs

## Problem Identified
When sharing via `navigator.share()`, some platforms (iMessage, WhatsApp, etc.) concatenate the `text` and `url` properties into a single clickable element. When recipients tap the "link", the entire text becomes part of the URL path.

**What you're seeing:**
```text
URL received: /trip/0e4c087b-9c0a-40ad-9310-065960ac584c Join our trip to Lima! Use code: 7KNWN9
Expected:     /trip/0e4c087b-9c0a-40ad-9310-065960ac584c
```

**Database error:**
```text
invalid input syntax for type uuid: "0e4c087b-9c0a-40ad-9310-065960ac584c Join our trip to Lima! Use code: 7KNWN9"
```

---

## Root Cause
The `tripId` from `useParams()` contains extra text appended by the share platform. This corrupted string is passed directly to Supabase, which fails to parse it as a UUID.

---

## Solution
Add a UUID sanitization utility that extracts the valid UUID from a potentially corrupted string, and apply it in all trip-related pages.

### Changes

| File | Change |
|------|--------|
| `src/lib/utils.ts` | Add `extractUUID()` helper function |
| `src/pages/TripView.tsx` | Sanitize `tripId` before using |
| `src/pages/TripDashboard.tsx` | Sanitize `tripId` before using |
| `src/pages/ClaimTrip.tsx` | Sanitize `tripId` before using |

---

## Implementation

### 1. New Utility Function

Add to `src/lib/utils.ts`:

```typescript
/**
 * Extracts a valid UUID from a potentially corrupted string.
 * Handles cases where share platforms append extra text to URLs.
 * 
 * Example: "0e4c087b-9c0a-40ad-9310-065960ac584c Join our trip" 
 *       → "0e4c087b-9c0a-40ad-9310-065960ac584c"
 */
export function extractUUID(input: string | undefined): string | null {
  if (!input) return null;
  
  // UUID v4 regex pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = input.match(uuidPattern);
  
  return match ? match[0] : null;
}
```

### 2. Apply Sanitization in TripView.tsx

```typescript
import { extractUUID } from "@/lib/utils";

export default function TripView() {
  const { tripId: rawTripId } = useParams<{ tripId: string }>();
  const tripId = extractUUID(rawTripId);
  
  // ... rest of component
  
  // If tripId is invalid after sanitization, show error
  if (!tripId) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-xl font-semibold">Invalid Trip Link</h1>
        <p className="text-muted-foreground mb-6 text-center">
          This link appears to be corrupted. Please request a new link.
        </p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </Link>
      </div>
    );
  }
}
```

### 3. Same Pattern for TripDashboard.tsx and ClaimTrip.tsx

Apply the same sanitization to these pages.

---

## Data Flow After Fix

```text
User taps corrupted share link
       ↓
URL: /trip/UUID%20Join%20our%20trip...
       ↓
React Router extracts: "UUID Join our trip..."
       ↓
extractUUID() parses: "UUID" ← Valid UUID only
       ↓
Supabase query uses: "UUID"
       ↓
Trip loads correctly ✓
```

---

## Why This Happens

Different platforms handle `navigator.share()` differently:

| Platform | Behavior |
|----------|----------|
| iOS Messages | Concatenates text + URL into single tappable link |
| WhatsApp | Keeps text and URL separate |
| Twitter | Keeps text and URL separate |
| Email | Varies by email client |

The Web Share API doesn't guarantee how platforms will format the shared content. Our app needs to be resilient to this variance.

---

## Summary

| Issue | Fix |
|-------|-----|
| Corrupted UUID from URL | Extract valid UUID with regex |
| Database query fails | Sanitize before querying |
| Poor error message | Show "Invalid Trip Link" for corrupted URLs |
