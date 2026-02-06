

# Plan: Save Traveler & Friends ID/Passport Information

## Overview

This feature enables users to save their own ID/passport information to their profile and also save friends' information for quick access when planning group trips. When a user uploads an ID during trip creation, they'll have the option to save it. They can also manage a "Travel Companions" list in their profile to quickly add friends to future trips.

---

## User Flow

```text
[Create Trip - ID Upload]
      |
      | User uploads ID/passport
      | AI extracts traveler info
      v
[Review Screen]
      |
      | "Save to My Profile" toggle (for own info)
      | OR "Save as Travel Companion" (for friends)
      v
[Confirm & Continue]
      |
      | Saves to database if toggled on
      v
-----------------------------------------
[Add Travelers Step]
      |
      | "Add Traveler" button shows:
      |   1. Saved companions list
      |   2. Manual entry option
      |   3. Scan new ID option
      v
[Select saved companion]
      |
      | Auto-fills name + origin
      | Pre-populated passport info for booking
      v
-----------------------------------------
[Profile Page - New "Companions" Tab]
      |
      | View saved travel companions
      | Add/edit/delete companions
      | Scan new companion ID
```

---

## Implementation Steps

### Step 1: Database Schema

Create two new tables:

**traveler_documents** - Stores the user's own travel document info:
- `id` (uuid, primary key)
- `user_id` (uuid, FK to profiles)
- `document_type` (text) - passport, drivers_license, national_id
- `full_legal_name` (text)
- `first_name` (text)
- `middle_name` (text, nullable)
- `last_name` (text)
- `date_of_birth` (date)
- `gender` (text) - M, F, X
- `nationality` (text, nullable)
- `document_number` (text, encrypted-at-rest by Supabase)
- `expiration_date` (date)
- `issue_date` (date, nullable)
- `place_of_birth` (text, nullable)
- `issuing_country` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**travel_companions** - Stores friends/family info:
- `id` (uuid, primary key)
- `user_id` (uuid, FK to profiles) - owner of this companion entry
- `nickname` (text) - friendly name like "Mom", "Best Friend Jake"
- `document_type` (text)
- `full_legal_name` (text)
- `first_name` (text)
- `middle_name` (text, nullable)
- `last_name` (text)
- `date_of_birth` (date, nullable)
- `gender` (text, nullable)
- `nationality` (text, nullable)
- `document_number` (text, nullable) - optional for privacy
- `expiration_date` (date, nullable)
- `home_airport_iata` (text, nullable) - default airport
- `home_airport_name` (text, nullable)
- `home_airport_city` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**RLS Policies:**
- Users can only SELECT, INSERT, UPDATE, DELETE their own documents/companions
- No public access

### Step 2: Create Traveler Service

Create a new service file to manage saved travelers:

**File: `src/lib/travelerService.ts`**

Functions:
- `saveUserDocument(userId, travelerInfo)` - Save/update user's own passport info
- `getUserDocument(userId)` - Fetch user's saved document
- `saveCompanion(userId, companionData)` - Add a travel companion
- `getCompanions(userId)` - List all companions
- `updateCompanion(companionId, data)` - Edit companion
- `deleteCompanion(companionId)` - Remove companion

### Step 3: Update TravelerReview Component

Modify the review screen to include a save option:

**File: `src/components/id-scan/TravelerReview.tsx`**

Changes:
- Add "Save to My Profile" switch toggle (only for authenticated users)
- Add "Save as Travel Companion" option with nickname input
- Call save function on confirm if toggled on
- Show subtle success indicator when saved

### Step 4: Create Companion Picker Component

A new component to select from saved companions:

**File: `src/components/trip-wizard/CompanionPicker.tsx`**

Features:
- Sheet/modal that slides up
- List of saved companions with avatars
- Search/filter functionality
- "Scan New ID" option
- "Enter Manually" option
- Selection triggers callback with companion data

### Step 5: Update AddTravelersStep

Enhance the add travelers flow:

**File: `src/components/trip-wizard/AddTravelersStep.tsx`**

Changes:
- "Add Traveler" button opens CompanionPicker instead of inline form
- Show saved companions as quick-add cards
- Selecting a companion auto-fills their info and default airport
- Manual entry still available as fallback

### Step 6: Create Profile Companions Tab

Add a new tab to the profile page:

**File: `src/components/profile/TravelCompanions.tsx`**

Features:
- Grid of companion cards with avatars
- Each card shows name, home airport, document expiry status
- Add new companion button (opens ID scan flow)
- Edit/delete actions
- Empty state with friendly illustration

### Step 7: Update Profile Page

Add the new tab:

**File: `src/pages/Profile.tsx`**

Changes:
- Add "Companions" tab to the TabsList
- Import and render TravelCompanions component

### Step 8: Create Companion ID Scan Modal

A reusable modal for scanning companion IDs:

**File: `src/components/profile/AddCompanionModal.tsx`**

Features:
- Dialog/Sheet with ID upload flow
- Uses existing IDUploadCard, IDProcessing components
- After extraction, shows form with nickname field
- Saves to travel_companions on confirm

### Step 9: Update useAuth Hook (Optional Enhancement)

Extend the Profile interface to include the user's own document:

**File: `src/hooks/useAuth.tsx`**

Changes:
- Optionally fetch and include traveler document in profile context
- Add `travelerDocument` to Profile interface

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| (Database Migration) | Create | traveler_documents and travel_companions tables |
| `src/lib/travelerService.ts` | Create | CRUD functions for saved travelers |
| `src/lib/tripTypes.ts` | Modify | Add SavedCompanion interface |
| `src/components/id-scan/TravelerReview.tsx` | Modify | Add save toggle and logic |
| `src/components/trip-wizard/CompanionPicker.tsx` | Create | Companion selection sheet |
| `src/components/trip-wizard/AddTravelersStep.tsx` | Modify | Integrate companion picker |
| `src/components/profile/TravelCompanions.tsx` | Create | Companions management tab |
| `src/components/profile/AddCompanionModal.tsx` | Create | ID scan modal for companions |
| `src/pages/Profile.tsx` | Modify | Add Companions tab |

---

## Technical Details

### SavedCompanion Interface

```typescript
export interface SavedCompanion {
  id: string;
  user_id: string;
  nickname: string;
  full_legal_name: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  document_number?: string;
  expiration_date?: string;
  home_airport_iata?: string;
  home_airport_name?: string;
  home_airport_city?: string;
  created_at: string;
  updated_at: string;
}
```

### CompanionPicker Animations

Staggered entry for companion cards:
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.05, type: "spring" }}
/>
```

Sheet slide-up:
```typescript
<Sheet>
  <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
    ...
  </SheetContent>
</Sheet>
```

### Save Toggle UI

Minimalistic switch with label:
```typescript
<div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
  <div>
    <span className="font-medium">Save to My Profile</span>
    <p className="text-xs text-muted-foreground">
      Auto-fill on future trips
    </p>
  </div>
  <Switch checked={saveToProfile} onCheckedChange={setSaveToProfile} />
</div>
```

### Companion Card Design

Compact card with essential info:
```typescript
<motion.div className="bg-card border border-border rounded-2xl p-4">
  <div className="flex items-center gap-3">
    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
      <User className="w-6 h-6 text-primary" />
    </div>
    <div className="flex-1">
      <span className="font-medium">{companion.nickname}</span>
      <div className="text-sm text-muted-foreground">
        {companion.home_airport_iata || "No home airport"}
      </div>
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground" />
  </div>
</motion.div>
```

---

## UI/UX Details

### TravelerReview Save Section

- Positioned below the form, before action buttons
- Clean toggle with descriptive text
- For authenticated users only (hide for guests)
- Subtle animation when toggled

### CompanionPicker Sheet

- Bottom sheet on mobile (80% height)
- Dialog on desktop
- Search bar at top
- Saved companions as vertical list
- "Add New" section at bottom with options:
  - Scan ID/Passport
  - Enter Manually

### Profile Companions Tab

- 2-column grid on mobile, 3-column on desktop
- Each card shows:
  - Avatar placeholder with initials
  - Nickname (primary)
  - Full name (secondary)
  - Home airport code
  - Document expiry warning if < 6 months
- Empty state:
  - Illustration of people
  - "Add your first travel companion"
  - "Scan their ID to auto-fill trip details"

### Quick Add Flow

In AddTravelersStep, when user has saved companions:
- Show horizontal scroll of companion avatars
- Tap to instantly add to trip
- Long-press to view details

---

## Security Considerations

- All document info is protected by RLS
- Users can only access their own data
- Document numbers are optional for companions
- Sensitive fields are never logged
- Consider encrypting document_number column
- Expiration dates can be used for booking reminders

---

## Data Flow

```text
[User uploads ID]
      |
      v
[AI extracts TravelerInfo]
      |
      v
[User reviews & toggles "Save"]
      |
      | If authenticated + save toggled:
      v
[travelerService.saveUserDocument()]
      |
      | Or for companions:
      v
[travelerService.saveCompanion()]
      |
      v
[Data stored in database]
      |
-----------------------------------------
[Future trip creation]
      |
      v
[CompanionPicker fetches saved companions]
      |
      v
[User selects companion]
      |
      v
[Auto-populates traveler with saved info]
```

