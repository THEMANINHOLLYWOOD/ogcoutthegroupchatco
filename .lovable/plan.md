# Mobile full-screen phone reveal

## Product overview
Turn the mobile homepage opening into a two-stage story. The iPhone conversation first fills the available screen below the navigation. When the final Las Vegas trip card appears, the phone smoothly shrinks and slides into its current mobile position, then the headline, team proof, description, and trip buttons reveal below it. Tablet and desktop remain unchanged.

## User journey and key scenarios
1. A visitor opens the homepage on a phone.
2. Only the large iPhone conversation is emphasized in the first viewport; the fixed navigation remains usable.
3. The existing Wordle-to-Las-Vegas conversation plays without changing its messages or timing.
4. When the final trip card appears at about 10 seconds, the phone eases upward and scales down to its current mobile size.
5. The headline and hackathon proof reveal first, followed by the description and action buttons with a short stagger.
6. The revealed content remains in the normal page flow, so the visitor can scroll through the rest of the homepage normally.
7. If reduced motion is enabled, the page skips the long staged movement and shows the compact phone and text without animation.

## Implementation sequence
1. Add a completion signal to the phone animation when the final Las Vegas card is added.
2. Track the mobile opening phase on the homepage without changing the existing desktop layout.
3. Give the opening phone a mobile-only full-viewport presentation sized to fit below the navigation without horizontal clipping.
4. On completion, animate the same phone into its existing compact placement using one calm spring transition rather than swapping elements.
5. Keep the mobile headline, team photos, hackathon message, description, and buttons hidden during the conversation.
6. Reveal that content in a subtle upward fade after the phone settles, preserving the current wording and destinations.
7. Keep tablet and desktop rendering, ordering, spacing, and timing unchanged.
8. Verify at 393 × 852 that the opening phone fills the screen, the transition does not jump, all revealed content fits, and there is no horizontal overflow.

## Technical details
- Extend `HeroAnimation` with an optional completion callback fired once when its final card is shown.
- Use Framer Motion variants and responsive classes in the homepage rather than duplicating the phone or creating a second mobile page.
- Size the opening stage from the dynamic viewport height so mobile browser chrome does not cause clipping.
- Respect `prefers-reduced-motion` and prevent repeated completion callbacks during rerenders.

## Build instructions
- “On mobile only, present the existing iPhone conversation as the full first-screen experience below the fixed navigation.”
- “When the final Las Vegas trip card appears, smoothly scale and slide that same iPhone into its current compact mobile placement.”
- “After the phone settles, reveal the existing headline and hackathon proof, then the description and Create a Trip / Join a Trip buttons with restrained staggered fades.”
- “Do not alter the chat copy, Las Vegas image, link behavior, navigation, later homepage sections, tablet layout, or desktop layout.”
- “Provide a reduced-motion fallback that immediately shows the compact completed layout.”

## Assumptions
- “Full screen” means the available mobile viewport below the fixed navigation, with small safe margins around the iPhone.
- The transition begins when the final trip card is added, currently around 10 seconds after page load.
- “Current placement” means the compact centered phone position used on mobile now.
