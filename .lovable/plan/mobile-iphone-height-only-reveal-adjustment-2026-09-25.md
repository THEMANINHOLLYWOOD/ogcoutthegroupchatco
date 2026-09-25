# Mobile iPhone height-only reveal adjustment

## Product overview
Keep the opening phone at its current realistic iPhone width. Only its height changes: it begins taller for the conversation, then smoothly shortens to the current compact phone before the homepage content appears.

## User journey and key scenarios
1. A mobile visitor sees a centered, iPhone-width conversation below the navigation.
2. The phone is tall enough to make the chat engaging, but does not stretch edge-to-edge or fill the entire screen height.
3. When the Las Vegas card finishes, the phone stays the same width and smoothly shortens in place.
4. The headline, team proof, description, and actions reveal below it.
5. Tablet and desktop remain unchanged.
6. Reduced-motion visitors see the compact completed layout immediately.

## Implementation sequence
1. Remove width animation from the phone wrapper and keep its mobile width fixed at the current compact size.
2. Set a restrained, iPhone-like opening chat height rather than using the remaining viewport height.
3. Animate only the chat height from the taller opening state to 250px.
4. Remove the full-viewport minimum height from the phone stage so the phone returns naturally to its existing position.
5. Keep the existing completion timing and content reveal.
6. Verify the opening and completed states at 393 × 852 with no horizontal clipping or width shift.

## Build instructions
- “Keep the mobile phone width fixed at 18rem during the entire animation.”
- “Begin with a taller, realistic phone rather than a full-screen phone.”
- “At completion, animate only the phone’s length to the current compact height.”
- “Do not change desktop, chat copy, timing, links, or revealed homepage content.”
