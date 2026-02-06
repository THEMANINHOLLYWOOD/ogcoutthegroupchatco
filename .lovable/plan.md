

# Plan: User Authentication & Profile System

## Overview

This plan implements a comprehensive user authentication system with Google OAuth, user profiles, photo galleries, and travel history tracking. The design will be minimalistic with ultra-smooth Framer Motion animations, matching the existing iMessage-inspired aesthetic.

---

## User Flow

```text
[Landing Page / Create Trip]
     |
     | Click "Sign In" 
     v
[/auth] - Sign In Page
     |
     | Email/Password OR Google OAuth
     v
[Authenticated User]
     |
     v
[/profile] - User Profile Page
     |
     +-- Profile Picture (editable)
     +-- Personal Info (phone, email)
     +-- Photo Gallery (photos of user)
     +-- Travel Gallery (photos + videos)
     +-- Travel History:
         +-- Cities visited
         +-- States visited
         +-- Countries by Continent
```

---

## Technical Architecture

### Database Tables

**profiles** - Core user profile data
- id (uuid, FK to auth.users)
- email (text)
- phone (text, nullable)
- full_name (text, nullable)
- avatar_url (text, nullable)
- created_at, updated_at

**user_photos** - Personal photo gallery
- id (uuid)
- user_id (uuid, FK to profiles)
- url (text)
- caption (text, nullable)
- created_at

**travel_media** - Travel photos & videos
- id (uuid)
- user_id (uuid, FK to profiles)
- url (text)
- media_type (enum: 'photo', 'video')
- caption (text, nullable)
- location (text, nullable)
- created_at

**visited_cities** - Cities traveled to
- id (uuid)
- user_id (uuid, FK to profiles)
- city_name (text)
- country (text)
- visited_date (date, nullable)
- created_at

**visited_states** - States/provinces traveled to
- id (uuid)
- user_id (uuid, FK to profiles)
- state_name (text)
- country (text)
- created_at

**visited_countries** - Countries with continent grouping
- id (uuid)
- user_id (uuid, FK to profiles)
- country_name (text)
- continent (text)
- created_at

### Storage Buckets

**avatars** - User profile pictures (public)
**user-photos** - Personal gallery (authenticated)
**travel-media** - Travel photos/videos (authenticated)

---

## Implementation Steps

### Step 1: Database Setup

Create migration with all tables, RLS policies, and storage buckets:
- profiles table with trigger to auto-create on signup
- All visited location tables with proper foreign keys
- Media tables for galleries
- RLS policies requiring authenticated users
- Storage buckets with upload/read policies

### Step 2: Configure Google OAuth

Use the `supabase--configure-social-auth` tool to enable managed Google OAuth via Lovable Cloud. This generates the lovable auth module automatically.

### Step 3: Create Authentication Pages

**File: `src/pages/Auth.tsx`**

A beautiful, minimalistic auth page with:
- Framer Motion fade-in animations
- Email/password form with validation (using zod)
- "Continue with Google" button (primary, above email form)
- Toggle between Sign In and Sign Up modes
- Error handling with toast notifications
- Auto-redirect on successful auth

### Step 4: Create Auth Context/Hook

**File: `src/hooks/useAuth.tsx`**

React context for auth state:
- Current user and session state
- Loading state during auth checks
- Sign in/out functions
- Profile data fetching
- Works with both email and Google OAuth

### Step 5: Create Protected Route Component

**File: `src/components/ProtectedRoute.tsx`**

HOC/wrapper component:
- Checks if user is authenticated
- Shows loading spinner during auth check
- Redirects to /auth if not logged in
- Renders children if authenticated

### Step 6: Create Profile Page

**File: `src/pages/Profile.tsx`**

Main profile page with tabs/sections:
- Header with avatar (editable) + name
- Tabbed interface:
  - About (phone, email)
  - My Photos (personal gallery)
  - Travel Gallery (photos + videos)
  - Places I've Been (cities, states, countries)

### Step 7: Create Profile Components

**Avatar Section:**
- `src/components/profile/ProfileHeader.tsx` - Large avatar with edit overlay
- `src/components/profile/AvatarUpload.tsx` - Photo upload with crop/preview

**Personal Info:**
- `src/components/profile/PersonalInfoForm.tsx` - Email, phone editor

**Photo Galleries:**
- `src/components/profile/PhotoGallery.tsx` - Masonry grid of photos
- `src/components/profile/TravelGallery.tsx` - Photos + videos with location tags
- `src/components/profile/MediaUploader.tsx` - Drag-drop upload with progress

**Travel History:**
- `src/components/profile/PlacesVisited.tsx` - Main container with sub-sections
- `src/components/profile/CityList.tsx` - Searchable list of cities
- `src/components/profile/StateList.tsx` - List of states/provinces
- `src/components/profile/ContinentSection.tsx` - Collapsible continent with countries
- `src/components/profile/AddPlaceModal.tsx` - Modal to add new location

### Step 8: Update Navigation

**File: `src/pages/Index.tsx`**

Update the "Sign In" button in the navbar:
- If not logged in: Link to /auth
- If logged in: Show avatar with dropdown (Profile, Sign Out)

### Step 9: Update App Routes

**File: `src/App.tsx`**

Add new routes:
- /auth - Authentication page
- /profile - User profile (protected)

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| (Database Migration) | Create | Tables, RLS, storage buckets |
| `src/pages/Auth.tsx` | Create | Sign in/up page with Google OAuth |
| `src/pages/Profile.tsx` | Create | User profile page |
| `src/hooks/useAuth.tsx` | Create | Auth context and hook |
| `src/components/ProtectedRoute.tsx` | Create | Auth guard component |
| `src/components/profile/ProfileHeader.tsx` | Create | Avatar + name header |
| `src/components/profile/AvatarUpload.tsx` | Create | Avatar upload dialog |
| `src/components/profile/PersonalInfoForm.tsx` | Create | Edit phone/email |
| `src/components/profile/PhotoGallery.tsx` | Create | Personal photos grid |
| `src/components/profile/TravelGallery.tsx` | Create | Travel media grid |
| `src/components/profile/MediaUploader.tsx` | Create | Upload component |
| `src/components/profile/PlacesVisited.tsx` | Create | Travel history section |
| `src/components/profile/CityList.tsx` | Create | Cities list |
| `src/components/profile/StateList.tsx` | Create | States list |
| `src/components/profile/ContinentSection.tsx` | Create | Countries by continent |
| `src/components/profile/AddPlaceModal.tsx` | Create | Add location modal |
| `src/App.tsx` | Modify | Add /auth and /profile routes |
| `src/pages/Index.tsx` | Modify | Update nav with auth state |

---

## UI/UX Details

### Auth Page Design
- Clean white background with subtle gradient
- Large "Out the Group Chat" logo at top
- Framer Motion stagger animation for form elements
- Google button: White with colored Google logo, prominent
- Separator: "or continue with email"
- Floating input labels with smooth transitions
- Spring animations on button hover/tap
- Success: confetti-like particle effect

### Profile Page Design
- Full-bleed avatar at top (like iOS contact)
- Sticky name below avatar as user scrolls
- Horizontal pill tabs for sections
- Smooth page transitions between tabs
- Masonry photo grid with hover zoom
- Add buttons as floating action buttons
- Pull-to-refresh on mobile

### Travel History UI
- Continent sections as collapsible accordions
- Country flags next to names
- Visual counter badges (e.g., "12 cities")
- Map visualization option (future)
- Autocomplete for adding new places

### Animation Patterns
- Page transitions: `opacity: 0 -> 1`, `y: 20 -> 0`
- Tab switches: Horizontal slide with crossfade
- Photo uploads: Scale up with spring
- Button hovers: Subtle scale (1.02)
- Loading states: Skeleton with shimmer

---

## Technical Notes

### Google OAuth Integration
Using Lovable Cloud's managed Google OAuth (no API keys needed):
```typescript
import { lovable } from "@/integrations/lovable/index";

const handleGoogleSignIn = async () => {
  const { error } = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
};
```

### File Upload Pattern
```typescript
// Upload to storage bucket
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/${filename}`, file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/${filename}`);
```

### Profile Auto-Creation
Database trigger creates profile on signup:
```sql
CREATE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Continent Data
For the countries-by-continent feature, we'll include a static mapping of countries to continents in `src/data/continents.ts`.

---

## Security Considerations

- All profile data protected by RLS (user can only access their own)
- Storage buckets require authentication for uploads
- Avatar bucket is public for read (profile pics need to be visible)
- Email validation with zod before submission
- Rate limiting handled by backend auth
- No sensitive data logged to console

