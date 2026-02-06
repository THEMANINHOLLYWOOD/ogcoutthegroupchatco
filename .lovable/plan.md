

# Plan: Apply Smart Brevity to AI-Generated Text

## Overview

Update the AI prompts in the itinerary generation and activity replacement functions to enforce "smart brevity" — concise, punchy text where every word carries weight. No filler, no fluff.

---

## Analysis: Current State vs. Target

### Current Issues

**generate-itinerary** produces verbose output:
- Overviews can be 2-3 sentences of generic excitement
- Descriptions often include unnecessary adjectives
- Tips can be wordy and redundant
- Day themes are sometimes overly descriptive

**find-alternative-activity** produces:
- "Brief 1-2 sentence description" — still too vague a constraint
- Tips that explain too much

### Smart Brevity Principles

1. **Lead with the point** — What matters most comes first
2. **One thought per sentence** — Short, declarative
3. **Cut filler words** — "really", "very", "amazing", "incredible", "unforgettable"
4. **Active voice** — Direct and punchy
5. **Specific > generic** — "Rooftop pool, 52nd floor" beats "amazing views"

---

## Implementation

### Step 1: Update generate-itinerary Prompts

**File: `supabase/functions/generate-itinerary/index.ts`**

**System prompt update:**
```
You are a travel expert. Write with smart brevity: every word must earn its place. No filler. No fluff. Specific beats generic.
```

**User prompt additions:**
```
WRITING STYLE - SMART BREVITY:
- Overview: 1-2 punchy sentences. Lead with what makes this trip unique.
- Day themes: 2-4 words max (e.g., "Downtown & Eats", "Desert Escape")
- Descriptions: One sentence. Specific details only.
- Tips: One sentence. Actionable insider knowledge only.
- Highlights: 4-6 words each. Concrete, not generic.

BAD: "You'll absolutely love exploring the amazing sights and incredible atmosphere of this unforgettable destination!"
GOOD: "Three days of poolside mornings, rooftop bars, and a desert sunset drive."

BAD: "This is a really great restaurant that serves delicious food with a wonderful atmosphere."
GOOD: "Farm-to-table Italian. Book the patio."
```

**Update tool parameter descriptions:**
```typescript
overview: {
  type: "string",
  description: "1-2 sentences. Lead with what's unique. No generic excitement."
},
highlights: {
  items: { type: "string" },
  description: "3-4 highlights, 4-6 words each. Concrete, not generic."
},
theme: { 
  type: "string", 
  description: "2-4 words. e.g., 'Downtown & Eats', 'Beach Day'" 
},
description: { 
  type: "string",
  description: "One sentence. Specific details only. No filler words."
},
tip: { 
  type: "string", 
  description: "One sentence. Actionable insider knowledge only." 
}
```

### Step 2: Update find-alternative-activity Prompts

**File: `supabase/functions/find-alternative-activity/index.ts`**

**System prompt update:**
```
You are a travel expert. Write with smart brevity: every word earns its place. One sentence descriptions. Actionable tips only.
```

**User prompt update:**
```typescript
const prompt = `Find a ${priceDirection === 'cheaper' ? 'cheaper' : 'pricier'} alternative in ${destinationCity}.

CURRENT: ${currentActivity.title} ($${currentCost}/person)
TYPE: ${currentActivity.type}
TIME: ${currentActivity.time}

${priceDirection === 'cheaper' 
  ? `TARGET: Under $${currentCost}. Free is great.`
  : `TARGET: Above $${currentCost}. Premium experience.`}

WRITING RULES:
- Description: One sentence. Specific details. No filler.
- Tip: One sentence. Actionable only.

BAD: "This is a wonderful place to enjoy delicious food with amazing views."
GOOD: "Michelin-starred tasting menu with Strip views."

JSON only:
{
  "time": "${currentActivity.time}",
  "title": "Place Name",
  "description": "One specific sentence.",
  "type": "${currentActivity.type}",
  "estimated_cost": 25,
  "tip": "One actionable tip."
}`;
```

### Step 3: Note on Group Chat

**File: `supabase/functions/group-chat/index.ts`**

**No changes needed.** The chat personas (Sarah and Mike) should remain conversational and casual. Smart brevity applies to informational content, not human chat simulation.

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/generate-itinerary/index.ts` | Modify | Add smart brevity rules to prompts and tool descriptions |
| `supabase/functions/find-alternative-activity/index.ts` | Modify | Tighten prompts for concise output |

---

## Examples: Before → After

### Overview
**Before:** "Get ready for an unforgettable adventure in Las Vegas! This exciting trip will take you through the best that Sin City has to offer, from world-class dining to incredible entertainment."

**After:** "Three days on the Strip. Pool mornings, show nights, one desert sunset."

### Day Theme
**Before:** "Exploring the Famous Las Vegas Strip and Downtown Area"

**After:** "Strip & Downtown"

### Activity Description
**Before:** "Visit the incredible Bellagio Fountains, one of the most amazing free attractions in Las Vegas. The stunning water show features over 1,200 fountains that dance to music and lights in a truly spectacular display."

**After:** "1,200 fountains synced to music. Free, runs every 15 min after 3pm."

### Tip
**Before:** "For the best experience, try to arrive about 15-20 minutes early so you can get a good spot along the railing. The shows that happen later in the evening tend to be more impressive because the lighting is better."

**After:** "Grab rail spots 10 min early. Evening shows have better lighting."

### Highlight
**Before:** "Experience the amazing nightlife scene at some of the best clubs in the world"

**After:** "World-class nightlife, no cover before 11pm"

---

## Technical Notes

- Both edge functions will be redeployed automatically
- Existing itineraries remain unchanged
- New itinerary generations and activity swaps will use smart brevity
- The structured output (JSON) format remains the same

