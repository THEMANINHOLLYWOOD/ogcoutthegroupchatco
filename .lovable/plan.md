# Mobile hackathon proof cleanup

## Overview
Keep the homepage’s existing Apple-style design while making the hackathon proof readable on phones.

## User journey
1. A visitor opens the homepage on a phone.
2. The four real-person headshots appear together beneath the main message.
3. “Created in 36 hours for Gemini Hackathon” appears fully beneath the headshots without clipping or overlap.
4. Tablet and desktop layouts retain the existing horizontal arrangement.

## Implementation sequence
1. Adjust only the hackathon proof block on the homepage.
2. Stack and center its headshots and text on small screens.
3. Preserve the horizontal, left-aligned layout on larger screens.
4. Verify the result at the current 393 × 852 phone size and check for horizontal overflow.

## Build instructions
- Update the proof wrapper with mobile-first column alignment and a compact gap.
- Center the proof text on mobile and restore left alignment from the small breakpoint upward.
- Keep all four images at a stable size and prevent shrinking.
- Do not change the proof wording, images, or desktop visual design.
