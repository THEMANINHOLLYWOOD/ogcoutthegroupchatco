

# Redesign Travel Stamps -- Authentic Passport Style

## Current State
Each stamp is a uniform 68x68px dashed-border square with a flag emoji and tiny city name. They all look identical in shape, which feels generic.

## New Design
Inspired by the reference image, each stamp will have a **varied shape** (circle, rectangle, rounded-rectangle, oval) determined by a hash of its ID. Stamps will feature:

- The **city or country name** in bold uppercase as the focal point
- A small **country name** subtitle for city stamps
- A small **airplane icon** (Lucide `Plane`) inside some shapes as decoration
- **Solid borders** (not dashed) with the existing ink color palette
- A subtle **worn/faded opacity** (0.75-0.9) for authenticity
- **Deterministic random rotation** (-6 to 6 degrees) as before
- Varied **sizing** per shape type so the grid feels organic

## Stamp Shape Variants (4 types, picked by hash)

1. **Circle** -- round border, city name centered, ~72px diameter
2. **Rectangle** -- horizontal rectangle with double-line border effect, ~100x64px
3. **Rounded Rectangle** -- softer corners, single border, ~90x60px
4. **Oval** -- elliptical shape, ~88x56px

## Layout
- Flex-wrap grid with `gap-3` for breathing room
- `items-center justify-center` so stamps cluster naturally
- Mobile-optimized: stamps resize slightly on narrow screens via responsive widths

## Technical Details

### File modified: `src/components/profile/TravelStamps.tsx`

**Changes:**
- Add a `STAMP_SHAPES` array with 4 shape types, each defining CSS classes for dimensions, border-radius, and optional inner ring
- Hash determines shape, color, and rotation per stamp
- Replace flag emoji with Lucide `Plane` icon for select shapes (based on hash)
- City name rendered in uppercase bold, country as small subtitle
- Use `border` (solid) instead of `border-dashed`
- Slightly larger stamps overall for readability on mobile

**No other files need to change** -- data fetching, props, and parent integration stay the same.
