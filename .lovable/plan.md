

# Out the Group Chat
### *"Pick a trip off the shelf. Let the plans make it out the group chat."*

A sleek, iMessage-inspired travel booking platform where trip organizers curate complete getaways and share a single payment link with friends.

---

## Design System

**iMessage-Inspired Branding**
- Chat bubble UI elements throughout (rounded corners, sender/receiver styling)
- Signature color palette: iOS blue (#007AFF) and green (#34C759) as accents on clean white/black backgrounds
- San Francisco-style typography with comfortable spacing
- Subtle blur effects and soft shadows for depth
- Smooth spring animations on all interactions

---

## Core Features

### 1. Landing Page
- Hero with animated chat bubble visualization showing "trip planning made real"
- Clear value proposition: "Stop planning in the group chat. Start booking."
- "Create a Trip" and "Join a Trip" CTAs
- Preview of how the shared trip link looks

### 2. Trip Builder (For Organizers)
- **Flight Search**: Search and select flights using travel APIs (Amadeus)
- **Accommodation Search**: Browse and book hotels/stays
- **Itinerary Timeline**: Visual day-by-day view styled as a chat thread
- **Add Items**: Activities, restaurants, experiences with costs
- **Cost Summary**: Running total with per-person split calculation

### 3. Trip Preview & Sharing
- Shareable link generation (e.g., outthegroupchat.app/trip/abc123)
- Beautiful trip preview card (like an iMessage link preview)
- Trip details page showing full itinerary and cost breakdown
- "I'm In" button for friends to claim their spot

### 4. Payment Flow
- Stripe integration for one-time payments
- Simple checkout: friend pays their calculated share
- Payment confirmation styled as "delivered" message indicator
- Organizer dashboard showing who's paid and who hasn't

### 5. User Accounts (Optional)
- Sign up/login for trip organizers to save and manage trips
- Guest checkout for friends joining trips (no account required)
- Account holders get: trip history, saved payment methods, organizer tools

### 6. Trip Dashboard
- For organizers: see all created trips, payment status, attendee management
- For participants: view joined trips and payment receipts

---

## Technical Requirements

- **Backend**: Supabase for authentication, trip storage, and user data
- **Payments**: Stripe for secure payment collection
- **Travel APIs**: Amadeus for flights, hotel booking API for accommodations
- **Real-time**: Live updates when friends join or pay

---

## Animations & Interactions

- Message bubble "pop-in" animation when content loads
- Smooth page transitions with subtle slide/fade
- Typing indicator animation during loading states
- Delivered/read receipt animations for confirmations
- Gentle bounce effects on button interactions

