# Remove the chat bar + make "Create a Trip" use real web-searched prices and events

## Overview
Take out the "Where do you want to go?" bar and the chat pages. Then improve Create a Trip so its flight prices, hotel prices and itinerary come from live web searches instead of AI estimates. Perplexity (already in your workspace) does the searching. Astra turns those results into the trip card and itinerary.

## User journey
1. The user opens Create a Trip and walks through the same steps: their info, destination and dates, travelers.
2. On the searching screen they see calm progress messages: "Checking live flight prices…", "Finding hotels…", "Looking up events…".
3. The results card shows, for each traveler:
   - the real airline, flight times and fare
   - the real hotel or rental, its nightly rate and rating
   - a small "Source" link to the site where each price was found
4. The itinerary lists real events on those dates, each with its time, venue, address, ticket price and a link. Stops also have opening hours and costs.
5. If a price can't be confirmed, it's labeled "Estimated" so the user is never misled.

## Steps
1. **Remove the chat bar and chat pages**
   - Take the bar off the home page.
   - Remove the chat pages, their links and the trip agent.
   - Delete the unused chat and booking storage.
2. **Connect Perplexity** to the project, which gives live web search with sources.
3. **Real flight and hotel prices**: Change the trip search to run live searches.
   - Flights: one search per origin and date pair, for real fares, airlines and times, e.g. Google Flights or Kayak listings.
   - Stays: one search for hotels or Airbnbs that fit the group on those dates.
   - Astra combines the results into the existing cost breakdown and keeps the source links.
4. **Real-time itinerary**: Before building the itinerary, run two searches:
   - concerts, sports, festivals and shows in the city on the trip dates
   - top places to eat and visit, with hours and prices
   Astra builds the day-by-day plan only from what was found. The "saved once, never regenerated" rule stays as it is.
5. **Show sources and live details**: Add small "Source" links and an "Estimated" tag to the results card. Activity cards get time, venue, price and a "Tickets" link. The layout keeps its minimal style.
6. **Test**: Plan a real trip (for example LAX to Miami next month) and check that the prices and events match their source links.

## Technical details
- Perplexity is called directly from backend functions with the linked `PERPLEXITY_API_KEY`. The model is `sonar-pro`, filtered to recent results, and the answer includes `citations`.
- `search-trip`: runs the Perplexity searches in parallel, then calls Astra with a tool that adds `source_url` and `is_estimate` to each flight and to the accommodation. It saves into the existing `flights` and `accommodation` data; no table changes are needed.
- `generate-itinerary`: Perplexity events and places searches feed the Astra prompt. Each activity gains optional `start_time`, `venue`, `address`, `price`, `ticket_url` and `source_url` fields. `tripTypes.ts` gets the matching optional fields.
- UI files: `CostBreakdown`, `TripReadyStep`, `ActivityBubble`/`DashboardActivityCard` add the links. `SearchingStep` changes its progress text.
- Removed: `AgentBar`, `Chat` page, `ToolCards`, `agentService`, `/chat` routes, the `trip-agent` function, and the `agent_threads`, `agent_messages` and `bookings` tables, plus the unused `ai`, `@ai-sdk/react` and `react-markdown` packages.
- Limits: web search finds prices as currently listed on the web. They are live quotes, not guaranteed fares, which is why each price has a source link.
