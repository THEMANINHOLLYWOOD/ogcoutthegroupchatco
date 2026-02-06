
# Plan: 6-Digit Trip Code System with Join Flow

## Overview

Every trip will receive a unique 6-digit alphanumeric code (e.g., "X7K2M9") in addition to the UUID. Users can join trips by entering this code through a beautiful, minimalistic OTP-style input. The join flow will use ultra-smooth animations and lead users directly to the trip page where they can view details and eventually book their spot.

---

## User Flow

```text
[Home Page]
      |
      | Click "Join a Trip"
      v
[Join Trip Modal/Page]
      |
      | Enter 6-digit code (OTP-style input)
      |   - Each digit animates as typed
      |   - Auto-validates when complete
      v
[Lookup Trip by Code]
      |
      | Found? → Navigate to /trip/:tripId
      | Not found? → Shake animation + error message
      v
[Trip View Page]
      |
      | User sees full itinerary
      | Can view their cost share
      | "Join This Trip" button
```

---

## Implementation Steps

### Step 1: Database Migration

Add a unique 6-digit code column to the trips table:

```sql
ALTER TABLE trips ADD COLUMN share_code TEXT UNIQUE;
CREATE UNIQUE INDEX trips_share_code_idx ON trips(share_code);
```

The code will be generated on trip creation using uppercase alphanumeric characters (excluding confusing ones like 0/O, 1/I/L).

### Step 2: Update Trip Service

Modify `saveTrip` to generate and store a unique 6-digit code:

- Use characters: `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (26 chars - no 0,O,1,I,L)
- Generate code and check for collisions
- Return the code along with tripId

Add new function `fetchTripByCode(code)` to look up trips by share code.

### Step 3: Create Join Trip Page

Create a new page `/join` with a minimalistic, Apple-inspired design:

- Clean centered layout
- Large "Join a Trip" heading
- 6 individual OTP-style input slots
- Each slot animates on focus/input
- Auto-submits when all 6 digits entered
- Loading spinner while validating
- Success animation before redirect
- Shake animation on invalid code

### Step 4: Update Index Page

Make the "Join a Trip" button functional:
- Navigate to `/join` on click
- Alternatively, open a modal with the code input

### Step 5: Update Trip View & Share

- Display the 6-digit code prominently on the trip page
- ShareButton shows both the link AND the code
- Easy copy for the code separately

### Step 6: Update Types

Add `share_code` to SavedTrip interface.

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| (Database Migration) | Create | Add share_code column with unique index |
| `src/pages/JoinTrip.tsx` | Create | Join trip page with OTP input |
| `src/lib/tripService.ts` | Modify | Add code generation + lookup by code |
| `src/lib/tripTypes.ts` | Modify | Add share_code to SavedTrip |
| `src/pages/Index.tsx` | Modify | Link Join button to /join |
| `src/components/trip/ShareButton.tsx` | Modify | Show share code alongside link |
| `src/pages/TripView.tsx` | Modify | Display share code in header |
| `src/App.tsx` | Modify | Add /join route |

---

## Technical Details

### Code Generation Algorithm

```typescript
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateShareCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}
```

Characters excluded: `0` (zero), `O` (oh), `1` (one), `I` (eye), `L` (el) - to avoid confusion when reading/sharing codes verbally.

### Join Page Animations

**Input Slot Focus**:
```typescript
<motion.div
  animate={{ 
    scale: isActive ? 1.05 : 1,
    borderColor: isActive ? 'var(--primary)' : 'var(--border)'
  }}
  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
/>
```

**Character Entry Pop**:
```typescript
<motion.span
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ type: 'spring', stiffness: 600 }}
>
  {char}
</motion.span>
```

**Invalid Code Shake**:
```typescript
<motion.div
  animate={{ x: [0, -10, 10, -10, 10, 0] }}
  transition={{ duration: 0.4 }}
/>
```

**Success Animation**:
```typescript
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: 'spring', stiffness: 400 }}
>
  <Check className="w-16 h-16 text-primary" />
</motion.div>
```

### Lookup Function

```typescript
export async function fetchTripByCode(code: string): Promise<{ 
  success: boolean; 
  tripId?: string; 
  error?: string 
}> {
  const { data, error } = await supabase
    .from('trips')
    .select('id')
    .eq('share_code', code.toUpperCase())
    .single();
    
  if (error || !data) {
    return { success: false, error: 'Trip not found' };
  }
  
  return { success: true, tripId: data.id };
}
```

---

## UI/UX Details

### Join Trip Page Layout

- Full-screen centered layout
- Subtle gradient or blur background
- "Join a Trip" as large heading
- Subtext: "Enter the 6-digit code from your friend"
- 6 large square input slots (48x48px each)
- Spacing between slots for clarity
- Keyboard auto-opens on mobile
- Back button to return home

### Input Behavior

- Auto-uppercase input
- Auto-advance to next slot on entry
- Backspace moves to previous slot
- Paste support for full 6-digit code
- Validates on complete (no submit button needed)

### Visual States

1. **Empty**: Light border, subtle background
2. **Focused**: Primary color ring, slight scale up
3. **Filled**: Character pops in with spring animation
4. **Loading**: All slots fade slightly, spinner appears
5. **Error**: Red border, shake animation, error message
6. **Success**: Green checkmark, redirects after brief delay

### Share Code Display

On TripView page, add above the share link:
```
Trip Code: X7K2M9
```
With a tap-to-copy action and subtle copy confirmation.

---

## Database Schema Update

```sql
-- Add share_code column
ALTER TABLE trips ADD COLUMN share_code TEXT;

-- Generate codes for existing trips
UPDATE trips SET share_code = 
  substring(md5(random()::text) from 1 for 6)
WHERE share_code IS NULL;

-- Make column unique and not null for future inserts
ALTER TABLE trips ALTER COLUMN share_code SET NOT NULL;
CREATE UNIQUE INDEX trips_share_code_unique_idx ON trips(share_code);
```

---

## Validation & Input Security

- Sanitize input to only allow alphanumeric characters
- Convert to uppercase before lookup
- Rate limit lookups to prevent brute force (6^26 = ~300M combinations)
- Input maxLength enforced
- No sensitive data exposed if code is wrong
