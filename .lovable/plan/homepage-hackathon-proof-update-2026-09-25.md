# Homepage Hackathon Proof Update

## Product overview
Update the homepage proof row to show real people and clearly credit the product’s 36-hour Gemini Hackathon build.

## User journey and key scenarios
1. A visitor reaches the homepage and sees four overlapping real-person headshots.
2. The visitor reads “Created in 36 hours for Gemini Hackathon” beside the headshots.
3. On smaller screens, the headshots and message remain readable without overlap or clipping.
4. If a headshot cannot load, initials appear instead of an empty circle.

## Implementation sequence
1. Add four compact, diverse headshot assets for the proof row.
2. Replace the decorative gradient circles with accessible avatar images.
3. Replace the trip-count claim with the hackathon message.
4. Preserve the existing restrained styling and entrance animation.
5. Check desktop and mobile layouts, image loading, and text wrapping.

## Build instructions
- Use four realistic, friendly headshots with varied appearances and clean neutral backgrounds.
- Keep the existing overlapping circular arrangement and border treatment.
- Set the exact visible text to: “Created in 36 hours for Gemini Hackathon”.
- Use the existing avatar fallback if an image fails.
- Do not change any other homepage content or behavior.

## Assumptions
- The people are representative demo users, not named customers or claimed endorsers.
- “Created in 36 hours” is the only proof statement; the former trip count is removed.