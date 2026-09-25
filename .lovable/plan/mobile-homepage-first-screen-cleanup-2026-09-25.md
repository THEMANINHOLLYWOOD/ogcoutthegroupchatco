# Mobile homepage first-screen cleanup

## Product overview
Keep the existing Apple-style homepage, but make the opening phone animation, headline, and complete hackathon proof fit naturally on a phone without clipping.

## User journey and key scenarios
1. A visitor opens the homepage on a phone.
2. The navigation stays compact and fully visible.
3. The Wordle conversation appears in a shorter, balanced phone frame while continuing to animate and scroll.
4. The full “Let trips make it out the group chat.” headline appears directly below it.
5. All four headshots and “Created in 36 hours for Gemini Hackathon” remain visible and readable beneath the headline.
6. Tablet and desktop retain their current proportions.

## Implementation sequence
1. Reduce only the mobile height and spacing of the opening phone animation.
2. Preserve the existing full-height animation from the small breakpoint upward.
3. Tighten the mobile gap between the animation, headline, and proof row.
4. Keep the proof row centered and prevent its images or text from shrinking or clipping.
5. Verify at the current 393 × 852 phone size with no horizontal overflow.

## Build instructions
- Use responsive sizing rather than scaling the entire page.
- Keep all current wording, images, links, message animation, and desktop styling.
- Do not change any other homepage section.
- Check the initial screen and the completed animation state.

## Assumption
- “Fix this” means the lower proof text should no longer sit below the visible phone screen, while the opening animation remains prominent.
