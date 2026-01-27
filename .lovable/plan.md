

# Wordle Group Chat Animation

Update the hero animation to show a fun, relatable "Wordle" group chat where friends share their daily scores, then naturally pivot to planning a trip together.

---

## Chat Narrative

The new conversation flow:

1. **Sarah**: "Wordle 847 3/6 🟩🟩⬛🟩🟩" 
2. **Mike**: "Wordle 847 5/6 😤 that was hard"
3. **You**: "Wordle 847 2/6 😎🟩🟩🟩🟩🟩"
4. **Sarah**: "NO WAY"
5. **Mike**: "ok we need to celebrate this... Vegas?"
6. **You**: "I'm so down 🎰"
7. **Sarah**: "wait I found this app that books everything"
8. *[Typing indicator...]*
9. *[Trip Preview Card appears]*

---

## Animation Enhancements

### Auto-Scrolling
- Track scroll position with `useRef` on the messages container
- After each new message appears, smoothly scroll to bottom using `scrollIntoView({ behavior: 'smooth' })`
- Use `motion.div` with `layout` prop for smooth content reflow

### Message Timing
- Stagger messages with realistic typing delays (800ms-1500ms between messages)
- Faster responses for short messages like "NO WAY"
- Slightly longer pauses before topic changes (Vegas pivot)

### Visual Updates
- Change group chat name from "Miami Trip Squad" → "Wordle 🟩"
- Update participant names: Sarah, Mike, You
- Change emoji icon from 🏖️ → 🟩 (Wordle green square)

---

## Technical Details

### Files to Modify

**`src/components/HeroAnimation.tsx`**

1. Update `chatMessages` array with new Wordle-themed conversation
2. Add `scrollRef` to track the messages container
3. Create `useEffect` that scrolls to bottom when `currentStep` changes
4. Adjust timing intervals for more natural conversation pacing
5. Update chat header to "Wordle 🟩" with participants "Sarah, Mike, You"

### Scroll Implementation

```text
┌─────────────────────────┐
│  Messages Container     │  ← useRef attached here
│  ┌───────────────────┐  │
│  │ Message 1         │  │
│  │ Message 2         │  │
│  │ Message 3         │  │  ← scrollIntoView triggered
│  │ ...               │  │     after each new message
│  │ [New Message] ←───┼──┼── Scroll target
│  └───────────────────┘  │
└─────────────────────────┘
```

### Animation Timeline

| Time (ms) | Event |
|-----------|-------|
| 0 | Phone animates in |
| 800 | Sarah's Wordle score appears |
| 1800 | Mike's frustrated score |
| 3000 | Your winning score |
| 3600 | Sarah's reaction (quick) |
| 4600 | Mike's Vegas idea |
| 5600 | Your response |
| 6800 | Sarah mentions the app |
| 8000 | Typing indicator |
| 10000 | Trip card slides in |

---

## Summary

This update makes the animation more relatable and fun by starting with the universally-loved Wordle ritual, then showing how a simple game share in a group chat naturally leads to travel planning. The auto-scroll ensures users see the full conversation unfold smoothly.

