

# Passport-Style Profile Redesign

## Overview
Replace the current tabbed profile page with a single, scrollable passport document. The passport is a card-based layout with the user's headshot, personal details, travel stamps for visited places, a friends section showing mini-passports, and a "Book a trip to..." CTA that suggests a destination neither the user nor a selected friend has visited.

---

## Visual Concept

The profile becomes a single vertical scroll that looks and feels like a physical passport:

1. **Passport Cover** -- Deep navy/dark card with gold accent text, "OTGC PASSPORT" embossed at top, user's name centered
2. **ID Page** -- Headshot photo (not circular avatar -- rectangular passport-style with rounded corners), full name, email, phone, home city/country, member since date
3. **Stamps Pages** -- A grid of minimalist stamp badges for every visited city/country, each with an iconic symbol and faded ink aesthetic
4. **Friends Page** -- Horizontal scroll of friend mini-passports (tappable to view their passport), plus search to add friends
5. **Trip Suggestion CTA** -- Under friends, a card that picks a random cool destination neither user has been to, with a "Book a trip to [City]" button

---

## Step-by-Step Implementation

### Step 1: Create Passport Layout Component
**New file: `src/components/profile/PassportLayout.tsx`**
- Full-width card with navy/dark gradient background and subtle gold border
- Rounded corners (rounded-3xl), slight shadow for depth
- Contains all passport "pages" as sections within a single scroll

### Step 2: Create Headshot Upload (replaces ProfileHeader)
**New file: `src/components/profile/HeadshotUpload.tsx`**
- Rectangular photo frame (3:4 aspect ratio, like a real passport photo)
- Rounded-lg corners (not circular)
- Camera overlay on hover/tap to change photo
- Reuses existing crop dialog from ProfileHeader but with square/portrait aspect
- Label reads "Headshot" not "Profile Picture"

### Step 3: Create Passport ID Page
**New file: `src/components/profile/PassportIDPage.tsx`**
- Left side: headshot image
- Right side: name, nationality (home_country), home city, email, phone
- Typography: monospaced or serif for passport feel, but still clean
- Editable fields inline (tap to edit, with save)
- "Member since" date from profile.created_at

### Step 4: Create Travel Stamps Grid
**New file: `src/components/profile/TravelStamps.tsx`**
- Fetches visited_cities, visited_states, visited_countries
- Each stamp is a small badge with:
  - Country flag emoji
  - City/country name in small caps
  - A subtle rotated angle (random -8 to 8 degrees) for organic stamp feel
  - Muted ink colors (reds, blues, greens -- randomized per stamp)
- Stamps laid out in a wrapping flex grid
- "Add Stamp" button opens existing place-add dialog
- Uses iconic city representations via flag emojis and name text (no external icon library needed -- keeps it minimal)

### Step 5: Create Friends Passport Row
**New file: `src/components/profile/FriendsPassportRow.tsx`**
- Horizontal ScrollArea of friend mini-cards
- Each mini-card shows: avatar, name, country flag, tap to expand
- Tapping a friend opens a sheet/drawer showing their "passport" (read-only view of their stamps + info)
- Search bar at top to find and add new friends (reuses existing search logic from FriendsList)
- Requires fetching friend's visited places -- needs new RLS policy for viewing friend's visited data

### Step 6: Create Trip Suggestion Card
**New file: `src/components/profile/TripSuggestionCard.tsx`**
- Picks a random destination from a curated list of "cool" cities
- Filters out places both the current user AND a random friend have already visited
- Displays: city name, country flag, a one-liner tagline
- CTA button: "Book a trip to [City]" links to `/create-trip`
- Refreshes suggestion on tap of a shuffle icon

### Step 7: Update Database Access for Friend Passports
**Migration needed:**
- Add RLS policy on `visited_cities`, `visited_states`, `visited_countries` to allow viewing data of accepted friends
- Policy: user can SELECT where `user_id` is in their accepted friendships

### Step 8: Rewrite Profile Page
**Edit: `src/pages/Profile.tsx`**
- Remove tab structure entirely
- Single scroll layout:
  1. Header bar (back, notifications, sign out -- keep existing)
  2. PassportLayout wrapping:
     - PassportIDPage (headshot + info)
     - TravelStamps
     - FriendsPassportRow
     - TripSuggestionCard

### Step 9: Create Friend Passport Viewer
**New file: `src/components/profile/FriendPassportDrawer.tsx`**
- Vaul drawer that slides up
- Shows friend's headshot, name, home location
- Their travel stamps (read-only)
- "Book a trip to [suggestion]" button at bottom

---

## Database Changes

New RLS policies on `visited_cities`, `visited_states`, `visited_countries`:

```sql
-- Allow users to view visited places of accepted friends
CREATE POLICY "Users can view friends visited cities"
ON visited_cities FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
    AND (
      (requester_id = auth.uid() AND addressee_id = visited_cities.user_id)
      OR (addressee_id = auth.uid() AND requester_id = visited_cities.user_id)
    )
  )
);
```

Same pattern for `visited_states` and `visited_countries`.

---

## Files Changed / Created

| Action | File |
|--------|------|
| Create | `src/components/profile/PassportLayout.tsx` |
| Create | `src/components/profile/HeadshotUpload.tsx` |
| Create | `src/components/profile/PassportIDPage.tsx` |
| Create | `src/components/profile/TravelStamps.tsx` |
| Create | `src/components/profile/FriendsPassportRow.tsx` |
| Create | `src/components/profile/TripSuggestionCard.tsx` |
| Create | `src/components/profile/FriendPassportDrawer.tsx` |
| Edit | `src/pages/Profile.tsx` |
| Migration | RLS policies for friend-visible travel data |

---

## Technical Details

- **Stamp rotation**: Each stamp gets a deterministic random rotation based on its ID hash, so it stays consistent across renders
- **Curated destinations list**: Hardcoded array of 30-40 aspirational cities (Tokyo, Marrakech, Reykjavik, Cartagena, etc.) with taglines, used for the trip suggestion feature
- **Friend passport data**: New service function `getFriendVisitedPlaces(friendId)` that fetches cities/countries -- only works if friendship is accepted (enforced by RLS)
- **Animations**: All sections use framer-motion staggered reveals. Stamps "press in" with a scale animation. The passport card has a subtle parallax tilt on scroll
- **Mobile-first**: Passport card is full-width with 16px margins. ID page stacks vertically (photo on top, info below). Stamps wrap naturally. Friends scroll horizontally

