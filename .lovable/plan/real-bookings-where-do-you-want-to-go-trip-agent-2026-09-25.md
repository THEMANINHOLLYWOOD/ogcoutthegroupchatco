# Real Bookings + "Where do you want to go?" Trip Agent

## Overview
Switch every AI feature to the strongest available model, and use real data in place of AI guesses: real flights and bookings through Duffel, and real events through Ticketmaster. Add a small chat bar under "Let's make it out the group chat". There, people talk to an agent that plans trips, looks up real prices, holds bookings and, after the user approves and pays, buys the tickets.

## User journeys
1. **Ask**: On the home page, the user types "Miami for 4 people in March". The agent replies with real flights, prices per person and events that weekend.
2. **Refine**: "Cheaper flights" or "only Saturday events". The agent searches again and updates the cards in the chat.
3. **Build the trip**: "Make it a trip". The agent creates a trip with a share link, just like the step-by-step flow.
4. **Buy**: "Book the 8am flight". The agent shows an approval card with total, names and fare rules. The user taps Approve and pays with Stripe. Only then does the agent buy the ticket, and it shows the booking reference.
5. **Come back later**: A chat list keeps every conversation, and each chat has its own link. The user can ask "what's the plan for Lima?" about any saved trip.

## Screens
```text
Home: hero animation -> "Let's make it out the group chat" -> [ Where do you want to go?  -> ]
Tap/submit -> /chat/:id (full screen on mobile, calm slide-up)
  - top: back, chat title, chats list button
  - messages: flight cards, event cards, trip card, approval card
  - bottom: same minimal text bar, always focused
/chat -> list of saved chats (sign-in required to save)
```

## Steps
1. **Model upgrade**: Move all text AI features (group chat, ID scan, trip search, itinerary, alternatives, destination) to `openai/gpt-6-astra`. Share images move to `openai/gpt-image-2.5-sunburst`.
2. **Accounts and keys**: Connect Stripe payments. Request `DUFFEL_API_KEY` (start with a test key) and `TICKETMASTER_API_KEY`.
3. **Real flights**: Rebuild the trip search on Duffel offer requests. It returns real offers for each traveler's home airport, so flight costs are real, not AI guesses.
4. **Real events**: Pull Ticketmaster events for the destination and dates into the itinerary and the chat.
5. **Storage**: Save chats, messages, bookings and payment records, each visible only to its owner.
6. **Agent backend**: One chat function streams replies. Its tools: search flights, search events, list my trips, get a trip, create a trip, and prepare a booking (the purchase always needs approval).
7. **Checkout and purchase**: Approving opens Stripe Checkout for the exact amount. After payment clears, the backend creates the Duffel order with the travelers' passport details and saves the booking reference. If the order fails, the payment is refunded automatically.
8. **Chat interface**: Minimal home text bar, chat page, chat list, and cards for flights, events, trips and approvals. Soft fade/slide motion, mobile-first.
9. **Testing**: Run the full flow with Duffel test mode and a Stripe test card. Switch both to live keys only when you say so.

## Guardrails
- Nothing is bought without a tap on Approve and a successful payment.
- Prices are checked again right before purchase. If the price changes, the user is asked again.
- Passport names must match. Missing traveler details are asked for in the chat.

## Technical details
- Tables: `agent_threads`, `agent_messages` (UIMessage JSON; database-generated UUIDs), `bookings` (duffel_offer_id, order_id, status, amount, stripe_session_id). Every table gets GRANTs and RLS on `auth.uid()`.
- Edge functions: `trip-agent` (AI SDK `streamText` on Responses API, tools with Zod, `stopWhen: stepCountIs(50)`), `duffel-search`, `events-search`, `booking-checkout`, `payments-webhook` (Stripe to Duffel order, refund on failure).
- Routes: `/chat`, `/chat/:threadId`. The chat UI uses AI Elements (`useChat`, `MessageResponse`, `PromptInput`, collapsed `Tool` cards).
- Duffel order payments use the Duffel balance at first. Stripe collects the money from the user.
- Build prompt: "Implement the approved plan step by step, starting with the model upgrade and secrets."
