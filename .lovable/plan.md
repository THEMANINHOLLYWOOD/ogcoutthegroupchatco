

# Plan: Streamlined Trip Creation with Upfront Airport Selection

## Overview

Redesign the Create Trip entry point to show **Destination** and **Departing From** airport fields immediately when the page loads. This creates a more minimalistic, Apple-inspired experience where users can start planning right away without uploading an ID first.

---

## Current Flow (Multi-Step)

```text
1. Upload ID/Passport
2. Processing & extraction
3. Review traveler info
4. Enter destination + origin + dates
5. Add travelers
6. Search & summary
```

Users must complete 3 steps before even seeing the airport fields.

---

## New Flow (Streamlined)

```text
1. Enter destination + origin (shown immediately)
2. Select dates
3. Add travelers (ID scan optional per traveler)
4. Search & summary
```

The trip details are front and center when the page loads.

---

## Design Specifications

### New Create Trip Landing View

| Element | Specification |
|---------|--------------|
| Headline | "Where to next?" (centered, `text-3xl` mobile / `text-4xl` desktop) |
| Subheadline | "Plan your trip in seconds" (muted, `text-lg`) |
| Destination field | Full-width airport autocomplete, placeholder "Search destination..." |
| Origin field | Full-width with geolocation button, auto-detects on load |
| Date picker | Range picker for departure/return |
| Continue button | Primary, full-width, disabled until all fields filled |
| Visual route | Appears once both airports selected (origin → destination with plane icon) |

### Visual Layout (Mobile-First)

```text
┌─────────────────────────────────────┐
│  ←  Back                  Step 1/3  │
├─────────────────────────────────────┤
│                                     │
│         Where to next?              │
│     Plan your trip in seconds       │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  🔍 Search destination...     │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌─────────────────────────┐ ┌──┐   │
│  │  Detecting location...  │ │📍│   │
│  └─────────────────────────┘ └──┘   │
│                                     │
│       ┌─────────────────────┐       │
│  SFO  │───── ✈️ ─────│  CDG       │
│  S.F. │               │ Paris      │
│       └─────────────────────┘       │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  📅 Select travel dates       │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │         Continue →            │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Update CreateTrip Page Structure

**File: `src/pages/CreateTrip.tsx`**

- Change initial step from `"upload"` to `"trip-details"`
- Update step numbers to reflect 3 steps instead of 4
- Remove mandatory ID scan requirement at start
- Add optional "Add your travel docs" at travelers step instead

### Step 2: Modify TripDetailsStep Component

**File: `src/components/trip-wizard/TripDetailsStep.tsx`**

- Update headline to be more inviting: "Where to next?"
- Make `organizerName` prop optional (won't have it at start)
- Keep the existing airport autocomplete fields
- Keep the visual route display
- Keep the date range picker

### Step 3: Simplify Step Progression

Update the step tracking:

| Step | Number | Description |
|------|--------|-------------|
| trip-details | 1 | Destination, origin, dates |
| travelers | 2 | Add travelers (ID scan optional here) |
| searching | 2 | Loading state |
| summary | 3 | Final review |

### Step 4: Move ID Scanning to Travelers Step

**File: `src/components/trip-wizard/AddTravelersStep.tsx`**

- Add organizer info input at top of travelers step
- Make ID scanning optional (can enter manually)
- Keep the "scan ID" option as a convenience feature

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/CreateTrip.tsx` | Start at trip-details step, adjust step numbering, make ID scan optional |
| `src/components/trip-wizard/TripDetailsStep.tsx` | Update headline, make organizerName optional |

---

## User Experience Flow

```text
User opens /create-trip
    ↓
Sees destination + origin fields immediately
    ↓
Starts typing destination → autocomplete dropdown
    ↓
Selects destination airport
    ↓
Origin auto-detected (or tap geolocation / search)
    ↓
Visual route appears: SFO ✈️ CDG
    ↓
Selects travel dates
    ↓
Taps "Continue"
    ↓
Add Travelers step (can scan ID here if needed)
    ↓
Search & Summary
```

---

## What Stays the Same

- AirportAutocomplete component (unchanged)
- Airport search logic (unchanged)
- Geolocation detection (unchanged)
- Visual route animation (unchanged)
- Date range picker (unchanged)
- SearchingStep and TripSummaryStep (unchanged)

---

## Technical Notes

- The `organizerName` will default to "Traveler" until they add their info at the travelers step
- ID scanning becomes optional - users can add travelers manually
- The existing `TravelerInfo` type can be captured at the Add Travelers step instead

