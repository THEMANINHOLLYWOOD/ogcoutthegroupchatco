

# Plan: Add Different Departure Location for All Travelers

## Current State

| Add Method | Different Airport Option | Status |
|------------|--------------------------|--------|
| Manual entry | Toggle + airport picker | Works |
| Platform user search | None - uses organizer's airport | Missing |

The manual traveler form already has the toggle "Flying from SFO?" with an airport autocomplete. Platform users need the same capability.

---

## Solution Approach

Add a confirmation step after selecting a platform user that allows specifying their departure airport before adding them to the trip.

---

## Implementation

### Step 1: Create PlatformUserConfirm Component

**New file: `src/components/trip-wizard/PlatformUserConfirm.tsx`**

A modal/sheet that appears after selecting a platform user:

```text
┌─────────────────────────────────────┐
│  Add [User Name]                    │
├─────────────────────────────────────┤
│                                     │
│     [Avatar]                        │
│     Sarah Johnson                   │
│     San Francisco, CA               │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Flying from SFO?               [✓] │
│                                     │
│  (if toggled off)                   │
│  ┌───────────────────────────────┐  │
│  │  Search departure airport...  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │     Add to Trip               │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

Features:
- Shows selected user's avatar and name
- Same airport toggle (default: on)
- Airport autocomplete when toggle is off
- "Add to Trip" button

### Step 2: Update UserSearchPicker

**File: `src/components/trip-wizard/UserSearchPicker.tsx`**

- Instead of calling `onSelectUser(user)` directly, pass both the user and the confirm state
- Or keep the picker simple and handle confirmation in the parent

### Step 3: Update AddTravelersStep

**File: `src/components/trip-wizard/AddTravelersStep.tsx`**

- Add state for pending platform user: `pendingUser: PlatformUser | null`
- When `UserSearchPicker` selects a user, set `pendingUser` instead of adding immediately
- Show `PlatformUserConfirm` modal when `pendingUser` is set
- On confirm, add the traveler with the specified origin

---

## Updated Flow

```text
User taps "Add Traveler"
    ↓
UserSearchPicker opens
    ↓
User searches and selects "Sarah"
    ↓
PlatformUserConfirm sheet appears
    ↓
User sees: "Flying from SFO?" [toggle]
    ↓
Option A: Keep toggle on → Add with SFO
Option B: Toggle off → Select different airport → Add
    ↓
Traveler added with correct origin
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/trip-wizard/PlatformUserConfirm.tsx` | Create - confirmation sheet with airport option |
| `src/components/trip-wizard/AddTravelersStep.tsx` | Modify - add pending user state and confirmation flow |

---

## Technical Details

### PlatformUserConfirm Props

```typescript
interface PlatformUserConfirmProps {
  user: PlatformUser;
  defaultOrigin: Airport;
  open: boolean;
  onConfirm: (user: PlatformUser, origin: Airport) => void;
  onCancel: () => void;
}
```

### AddTravelersStep Changes

```typescript
// Add state
const [pendingUser, setPendingUser] = useState<PlatformUser | null>(null);

// Update addPlatformUser to receive origin
const addPlatformUser = useCallback((user: PlatformUser, origin: Airport) => {
  const newTraveler: Traveler = {
    id: crypto.randomUUID(),
    name: user.full_name || "Unknown User",
    origin, // Use the specified origin instead of defaultOrigin
    isOrganizer: false,
    user_id: user.id,
    avatar_url: user.avatar_url || undefined,
  };
  setTravelers((prev) => [...prev, newTraveler]);
  setPendingUser(null);
}, []);

// UserSearchPicker now sets pendingUser instead of adding directly
onSelectUser={(user) => setPendingUser(user)}
```

---

## Design Consistency

The confirmation sheet will match the existing design language:
- Same sheet component from UserSearchPicker
- Same airport autocomplete from ManualTravelerForm
- Same toggle styling
- Same button styling

