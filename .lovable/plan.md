

# Plan: Trip Details Flow - Destination, Dates, Travelers & AI Flight Search

## Overview

After the user confirms their traveler profile, they'll proceed through a multi-step flow to:
1. Select departure and destination airports (with auto-suggest)
2. Pick travel dates
3. Add fellow travelers (with option for different departure airports)
4. Have Gemini AI search for the best flights and accommodations
5. View an itemized receipt showing per-person costs

---

## User Flow

```text
[ID Scan Complete] 
     |
     | Click "Confirm & Continue"
     v
[Step 2: Trip Details]
     |
     | Where are you going? (destination airport)
     | Where are you leaving from? (auto-detected, editable)
     | When? (date range picker)
     v
[Step 3: Add Travelers]
     |
     | Who's coming with you?
     | - Add traveler (name + same airport or different)
     | - Repeat for each person
     v
[AI Search Processing]
     |
     | Gemini searches for flights & accommodations
     | Animated "Finding the best deals..." state
     v
[Trip Summary / Receipt]
     |
     | Itemized breakdown per person
     | Total trip cost
     | "Confirm & Share" or "Edit Details"
```

---

## Implementation Steps

### Step 1: Expand the Step Flow

**File: `src/pages/CreateTrip.tsx`**

Update the step type to include new steps:
```typescript
type Step = "upload" | "processing" | "review" | "trip-details" | "travelers" | "searching" | "summary";
```

After `handleConfirm` is called, transition to `"trip-details"` step instead of just showing a toast.

### Step 2: Create Trip Details Component

**File: `src/components/trip-wizard/TripDetailsStep.tsx`**

A clean, minimalistic form with:
- **Destination Input**: Autocomplete airport search using a local airport database (JSON-based, no external API needed)
- **Origin Input**: Same autocomplete, pre-filled based on user's geolocation (browser Geolocation API)
- **Date Range Picker**: Departure and return dates using existing Calendar component
- **Continue Button**

**Airport Autocomplete Approach**:
- Use a bundled JSON file with major airports (~5000 airports)
- Use Fuse.js for fuzzy search (already a pattern in similar libraries)
- Display: "JFK - New York John F. Kennedy" format
- Store IATA code for API calls

### Step 3: Create Airport Data and Search

**File: `src/data/airports.json`**

A curated list of major airports with:
```json
{
  "iata": "JFK",
  "name": "John F. Kennedy International Airport",
  "city": "New York",
  "country": "United States",
  "lat": 40.6413,
  "lng": -73.7781
}
```

**File: `src/lib/airportSearch.ts`**

Functions for:
- `searchAirports(query: string)` - Fuzzy search airports
- `getAirportByIata(code: string)` - Get airport by IATA
- `getNearestAirport(lat: number, lng: number)` - Find closest airport to coordinates
- `getUserLocationAirport()` - Use browser geolocation to suggest departure airport

### Step 4: Create Add Travelers Component

**File: `src/components/trip-wizard/AddTravelersStep.tsx`**

UI for adding fellow travelers:
- Card showing the main traveler (from ID scan) as "organizer"
- "Add Traveler" button to add more people
- For each traveler:
  - Name input
  - Toggle: "Flying from same airport" (default on)
  - If off, show origin airport selector
- Visual list of all travelers with their departure airports
- Continue button

### Step 5: Create Trip Search State Type

**File: `src/lib/tripTypes.ts`**

Define the data structures:
```typescript
interface TripSearch {
  organizer: TravelerInfo;
  destination: Airport;
  travelers: Traveler[];
  departureDate: Date;
  returnDate: Date;
}

interface Traveler {
  id: string;
  name: string;
  origin: Airport;
  isOrganizer: boolean;
}

interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
}

interface TripResult {
  flights: FlightOption[];
  accommodations: AccommodationOption[];
  perPersonCost: number;
  totalCost: number;
  breakdown: CostBreakdown[];
}
```

### Step 6: Create AI Search Edge Function

**File: `supabase/functions/search-trip/index.ts`**

Edge function that:
1. Receives trip search parameters (destination, dates, travelers with origins)
2. Uses Gemini 3 with web grounding to search for:
   - Best flight prices for each traveler's route
   - Accommodation options at the destination
3. Returns structured results with pricing

**Using Gemini's Web Grounding**:
Since Gemini has access to Google Flights data through its training, we can prompt it to provide realistic flight estimates. For actual booking, we'd integrate real APIs later, but for MVP this gives users a realistic preview.

**Tool Calling Schema**:
```typescript
const searchTripTool = {
  type: "function",
  function: {
    name: "compile_trip_results",
    parameters: {
      type: "object",
      properties: {
        flights: {
          type: "array",
          items: {
            type: "object",
            properties: {
              traveler_name: { type: "string" },
              origin: { type: "string" },
              destination: { type: "string" },
              outbound_price: { type: "number" },
              return_price: { type: "number" },
              airline: { type: "string" },
              departure_time: { type: "string" },
              arrival_time: { type: "string" }
            }
          }
        },
        accommodation: {
          type: "object",
          properties: {
            name: { type: "string" },
            price_per_night: { type: "number" },
            total_nights: { type: "number" },
            rating: { type: "number" }
          }
        },
        total_per_person: { type: "number" },
        trip_total: { type: "number" }
      }
    }
  }
};
```

### Step 7: Create Search Processing Animation

**File: `src/components/trip-wizard/SearchingStep.tsx`**

Animated loading state showing:
- "Finding the best flights..." → "Comparing prices..." → "Calculating costs..."
- Airplane animation or pulsing globe
- Takes 5-10 seconds for AI to search and respond

### Step 8: Create Trip Summary / Receipt Component

**File: `src/components/trip-wizard/TripSummaryStep.tsx`**

Beautiful itemized receipt showing:
- Destination header with image
- Dates
- **Per-traveler breakdown**:
  - Traveler name
  - Flight route (origin → destination)
  - Flight cost (round trip)
  - Share of accommodation
  - **Subtotal for that person**
- **Trip total**
- **Share Link** button (for future: generate payment link)
- **Edit** button to go back

Styled like a modern receipt/invoice with clean typography.

### Step 9: Create API Client

**File: `src/lib/tripSearch.ts`**

Client-side function to call the edge function and handle the response.

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/CreateTrip.tsx` | Modify | Add new steps, state management for trip data |
| `src/data/airports.json` | Create | Curated list of ~500 major airports |
| `src/lib/airportSearch.ts` | Create | Airport search utilities with Fuse.js |
| `src/lib/tripTypes.ts` | Create | TypeScript interfaces for trip data |
| `src/lib/tripSearch.ts` | Create | API client for trip search |
| `src/components/trip-wizard/TripDetailsStep.tsx` | Create | Destination, origin, dates form |
| `src/components/trip-wizard/AirportAutocomplete.tsx` | Create | Reusable airport search input |
| `src/components/trip-wizard/AddTravelersStep.tsx` | Create | Add fellow travelers UI |
| `src/components/trip-wizard/TravelerCard.tsx` | Create | Individual traveler display card |
| `src/components/trip-wizard/SearchingStep.tsx` | Create | AI search loading animation |
| `src/components/trip-wizard/TripSummaryStep.tsx` | Create | Itemized receipt/summary |
| `src/components/trip-wizard/CostBreakdown.tsx` | Create | Per-person cost breakdown card |
| `supabase/functions/search-trip/index.ts` | Create | Gemini AI trip search function |
| `supabase/config.toml` | Modify | Add search-trip function config |

---

## UI/UX Details

### Airport Autocomplete Behavior
- Shows placeholder: "Where to?" or "Leaving from?"
- On focus, show recent/popular airports
- On type, fuzzy search through airport database
- Results show: "JFK - New York, USA" format with IATA prominent
- Geolocation button for origin to auto-detect nearest airport

### Date Picker Behavior
- Single date range picker (departure → return)
- Minimum departure: tomorrow
- Calendar shows 2 months
- Mobile: fullscreen modal calendar

### Add Travelers UX
- Start with organizer card (from ID)
- "Add Traveler" opens inline form
- Clean card for each traveler with avatar placeholder
- Swipe to remove on mobile, X button on desktop
- Clear visual of different departure airports if applicable

### Receipt/Summary Design
- White card with subtle shadow
- Destination banner image at top
- Line items with clean dividers
- Bold totals
- Primary CTA: "Share Trip" or "Get Payment Link"

---

## Technical Notes

### Geolocation for Origin Airport
```typescript
// In AirportAutocomplete or TripDetailsStep
const detectNearestAirport = async () => {
  if (!navigator.geolocation) return null;
  
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = findNearestAirport(
          position.coords.latitude,
          position.coords.longitude
        );
        resolve(nearest);
      },
      () => resolve(null)
    );
  });
};
```

### Airport Data Source
We'll include a curated JSON of the top 500 airports globally. This keeps the bundle small (~50KB gzipped) while covering the vast majority of use cases.

### Gemini Search Prompt Strategy
The edge function will prompt Gemini with:
- Specific dates and routes
- Request for realistic price estimates
- Structured output via tool calling
- Instruction to provide airline names and approximate times

Since we can't actually book through Gemini, this serves as a planning/estimation tool. Future integration could use real flight APIs (Amadeus, Skyscanner) for actual booking.

---

## Step Counter Update

The header currently shows "Step 1 of 3". After this implementation:
- Step 1: ID Upload/Review
- Step 2: Trip Details (destination, dates)
- Step 3: Add Travelers
- Step 4: Summary/Receipt

Update the step counter to reflect current position.

