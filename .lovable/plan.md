

# Fix Wordle Message Format

Update the chat messages to display authentic Wordle share formats matching how they actually appear when shared from the game.

---

## Issue

The current messages don't match real Wordle shares:
- **Current**: "Wordle 847 5/6 😤 that was hard" (Mike has extra text and emoji)
- **Current**: Wordle grids are shown inline instead of as a proper grid pattern

## Authentic Wordle Format

Based on the reference image, real Wordle shares look like:

```text
Wordle 1,681 4/6

🟩⬜⬜🟨🟨
⬜🟩⬜⬜⬜
⬜🟩🟨⬜🟨
🟩🟩🟩🟩🟩
```

Key elements:
- Header: "Wordle [number] [score]/6"
- Grid: Each row represents a guess with 5 squares
- Colors: 🟩 (green/correct), 🟨 (yellow/wrong position), ⬜ (gray/wrong)

---

## Solution

### Update `chatMessages` Array

**File**: `src/components/HeroAnimation.tsx`

Replace the messages with proper multi-line Wordle grids:

| Character | Message |
|-----------|---------|
| Sarah (3/6) | "Wordle 1,681 3/6\n\n⬜🟨⬜⬜🟩\n🟩⬜🟨🟩🟩\n🟩🟩🟩🟩🟩" |
| Mike (5/6) | "Wordle 1,681 5/6\n\n⬜⬜⬜⬜⬜\n⬜🟨⬜🟨⬜\n🟨🟩⬜🟩⬜\n🟩🟩⬜🟩🟩\n🟩🟩🟩🟩🟩" |
| You (2/6) | "Wordle 1,681 2/6\n\n🟩🟩🟨⬜🟩\n🟩🟩🟩🟩🟩" |

---

### Update ChatBubble Component

**File**: `src/components/ChatBubble.tsx`

Change the message display to preserve line breaks:
- Replace `<p>` with rendering that handles `\n` characters
- Use `whitespace-pre-line` CSS or split by newlines and render with `<br/>` tags

---

### Updated Message Flow

1. **Sarah**: Shares her 3/6 with proper grid
2. **Mike**: Shares his 5/6 with proper grid (no extra text/emoji)
3. **You**: Shares your impressive 2/6 with proper grid
4. **Sarah**: "NO WAY"
5. **Mike**: "ok we need to celebrate this... Vegas?"
6. **You**: "I'm so down 🎰"
7. **Sarah**: "wait I found this app that books everything"
8. *[Trip card appears]*

---

## Summary

This fix makes the Wordle shares look authentic by:
1. Removing Mike's extra "😤 that was hard" text
2. Adding proper multi-line grid patterns to all Wordle shares
3. Using consistent Wordle number (1,681 with comma) for all messages
4. Updating ChatBubble to render line breaks correctly

