

# Strip Navy/Gold Theme -- Use Standard Design System

## Problem
Every passport component uses custom `--passport-navy`, `--passport-gold`, `--passport-gold-muted`, `--passport-navy-light` tokens via inline `style={{}}` props. This creates a visual disconnect from the rest of the app (iMessage-inspired, clean white/dark).

## Solution
Replace all passport-specific color tokens with the existing design system variables (`background`, `foreground`, `muted`, `border`, `primary`, etc.) and remove the passport CSS tokens from `index.css`. Use Tailwind classes instead of inline styles wherever possible.

---

## Changes

### 1. Remove passport tokens from `src/index.css`
Delete the `--passport-navy`, `--passport-navy-light`, `--passport-gold`, `--passport-gold-muted`, `--passport-paper`, `--passport-ink-*` custom properties from both `:root` and `.dark`.

### 2. Restyle `PassportLayout.tsx`
- Background: `bg-card` (white/dark card) instead of navy
- Border: `border-border` instead of gold
- Header text: `text-muted-foreground` for "OTGC Passport", `text-foreground` for user name
- Divider: `bg-border`

### 3. Restyle `PassportIDPage.tsx`
- Section label: `text-muted-foreground`
- Info labels: `text-muted-foreground`
- Info values: `text-foreground`
- Divider: `border-border`

### 4. Restyle `HeadshotUpload.tsx`
- Placeholder background: `bg-muted`
- Initials color: `text-muted-foreground`

### 5. Restyle `TravelStamps.tsx`
- Section label and empty state: `text-muted-foreground`
- Add button: standard ghost with `text-muted-foreground`
- Loading skeleton: `bg-muted`
- Keep the colorful stamp borders (red, blue, green, purple, orange) as-is -- these are the "ink" stamps and should stay vibrant

### 6. Restyle `FriendsPassportRow.tsx`
- Section label: `text-muted-foreground`
- Search input: `bg-secondary` / `text-foreground`
- Search results: `bg-secondary`
- Friend name/labels: `text-foreground` / `text-muted-foreground`
- Friend card border: `border-border`
- Friend card bg: `bg-muted`

### 7. Restyle `TripSuggestionCard.tsx`
- Section label: `text-muted-foreground`
- Card background: `bg-secondary`
- City name: `text-foreground`
- Tagline: `text-muted-foreground`
- Shuffle icon: `text-muted-foreground`
- CTA button: standard `bg-primary text-primary-foreground`

### 8. Restyle `FriendPassportDrawer.tsx`
- Drawer background: `bg-background`
- Title: `text-muted-foreground`
- Labels: `text-muted-foreground`
- Values: `text-foreground`
- Photo placeholder bg: `bg-muted`

---

## Mobile Optimization
- Ensure `PassportLayout` uses `mx-4` margin (16px sides) and no horizontal overflow
- Stamps grid uses `gap-2` and smaller stamp size on narrow screens
- Friends row stays horizontally scrollable with proper padding

## Files Modified

| File | Action |
|------|--------|
| `src/index.css` | Remove passport tokens |
| `src/components/profile/PassportLayout.tsx` | Replace inline styles with Tailwind classes |
| `src/components/profile/PassportIDPage.tsx` | Replace inline styles with Tailwind classes |
| `src/components/profile/HeadshotUpload.tsx` | Replace inline styles with Tailwind classes |
| `src/components/profile/TravelStamps.tsx` | Replace inline styles with Tailwind classes |
| `src/components/profile/FriendsPassportRow.tsx` | Replace inline styles with Tailwind classes |
| `src/components/profile/TripSuggestionCard.tsx` | Replace inline styles with Tailwind classes |
| `src/components/profile/FriendPassportDrawer.tsx` | Replace inline styles with Tailwind classes |

No database changes needed.
