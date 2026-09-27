# OpenSen — Lingua Design System

## 01. Design Philosophy

### 1.1 Product idea

OpenSen is a language acquisition system built around:

* Situations
* Sentences
* Chunks
* Patterns
* Variations
* Active recall
* Spaced repetition
* Speaking

The interface should therefore communicate **language structure**, not merely display educational content.

### 1.2 Core metaphor

The primary visual metaphor is:

**Language is a living network.**

A sentence is connected to:

* a situation
* an intention
* reusable chunks
* patterns
* variations
* practice history

The interface should make these relationships visible without becoming a complicated graph UI.

### 1.3 Design principles

#### Context before complexity

Always show the situation before asking the learner to analyze language.

Bad:

> `available`

Better:

> **Do you have a table available?**

Then expose:

> `Do you have a [THING] available?`

---

#### One learning action at a time

During practice, the UI should never compete with the learner.

One screen should have:

* one objective
* one primary action
* minimal secondary information

---

#### Calm over gamification

Avoid:

* excessive XP
* exploding animations
* childish mascots
* constant streak pressure
* noisy reward systems

Use:

* progress
* mastery
* rhythm
* confidence
* subtle feedback

OpenSen should feel closer to a **beautiful language studio** than a mobile game.

---

#### Reveal complexity progressively

A beginner sees:

> What do you recommend?

An advanced learner can expand:

> `What do you recommend + for [THING]?`

Then:

> semantic role → slot → variations → related chunks

The system should never force linguistic complexity onto beginners.

---

## 02. Brand Personality

OpenSen should feel:

**Intelligent**

* precise typography
* strong hierarchy
* structured layouts

**Warm**

* soft surfaces
* gentle accents
* friendly microcopy

**Curious**

* exploration
* connections
* expandable knowledge

**Focused**

* low visual noise
* generous whitespace
* clear actions

**Modern**

* restrained gradients
* subtle depth
* high-quality motion

### Personality spectrum

```text
Academic       ███████░░░ 70%
Friendly       ████████░░ 80%
Playful        ████░░░░░░ 40%
Technical      ███████░░░ 70%
Premium        ████████░░ 80%
Gamified       ██░░░░░░░░ 20%
```

---

# 03. Visual Language

## 3.1 Recommended visual direction

**Clean Minimal + Soft & Friendly + Editorial**

Not:

* cartoon-heavy
* neon
* cyberpunk
* glassmorphism everywhere
* childish education UI

The interface should resemble a combination of:

* modern reading application
* premium note-taking tool
* language laboratory
* editorial typography

---

# 04. Color System

The color system should be semantic rather than component-specific.

## 4.1 Core palette

### Ink

```text
Ink 950   #171717
Ink 900   #1F1F1F
Ink 800   #292929
Ink 700   #404040
Ink 600   #525252
Ink 500   #737373
Ink 400   #A3A3A3
Ink 300   #D4D4D4
Ink 200   #E5E5E5
Ink 100   #F5F5F5
Ink 50    #FAFAFA
```

Use Ink 950 for primary text.

---

## 4.2 Paper

```text
Paper 0    #FFFFFF
Paper 50   #FCFCFA
Paper 100  #F7F7F3
Paper 200  #EFEFEA
```

The default application background should be slightly warmer than pure white.

This makes OpenSen feel less clinical.

---

## 4.3 Primary — Sen Green

Primary brand color:

```text
Sen 950   #12372A
Sen 900   #174B38
Sen 800   #1C6046
Sen 700   #247A58
Sen 600   #2E956A
Sen 500   #43AE7E
Sen 400   #70C59D
Sen 300   #A5DCBE
Sen 200   #D0EFDE
Sen 100   #E9F8EF
Sen 50    #F3FBF6
```

Primary action:

```text
Sen 700
```

Hover:

```text
Sen 800
```

Subtle background:

```text
Sen 50
```

---

## 4.4 Accent — Sentence Amber

Use amber only for moments of discovery or attention.

```text
Amber 700  #B45309
Amber 600  #D97706
Amber 500  #F59E0B
Amber 100  #FEF3C7
Amber 50   #FFFBEB
```

Use for:

* new chunk
* highlighted linguistic insight
* “new” state
* discovery
* optional hint

Do not use amber as a primary CTA.

---

## 4.5 Semantic colors

### Success

```text
Success 700  #15803D
Success 100  #DCFCE7
```

### Warning

```text
Warning 700  #A16207
Warning 100  #FEF9C3
```

### Error

```text
Error 700    #B91C1C
Error 100    #FEE2E2
```

### Information

```text
Info 700     #0369A1
Info 100     #E0F2FE
```

---

# 05. Color Semantics

Color should encode **meaning**, not decoration.

| Semantic       | Color   |
| -------------- | ------- |
| Primary action | Sen     |
| Mastered       | Green   |
| Attention      | Amber   |
| Error          | Red     |
| Information    | Blue    |
| Neutral        | Ink     |
| Disabled       | Ink 400 |
| Background     | Paper   |

Important rule:

> Never communicate learning state using color alone.

Use:

* icon
* label
* typography
* shape

alongside color.

---

# 06. Typography

## 6.1 Font family

Recommended:

### UI

**Inter**

### Language content

**Inter + Noto Sans**

For multilingual content:

```text
Inter
Noto Sans
Noto Sans CJK
Noto Sans Arabic
```

depending on language.

---

## 6.2 Type scale

```text
Display XL   48 / 56 / 700
Display L    40 / 48 / 700
Display M    32 / 40 / 700
Heading XL   28 / 36 / 700
Heading L    24 / 32 / 700
Heading M    20 / 28 / 650
Heading S    18 / 24 / 650
Body L       18 / 28 / 400
Body M       16 / 24 / 400
Body S       14 / 20 / 400
Label L      14 / 20 / 600
Label M      13 / 18 / 600
Label S      12 / 16 / 600
Caption      12 / 16 / 400
```

---

# 07. Sentence Typography

This is one of OpenSen's most important design elements.

Sentences should be visually treated as **content objects**, not ordinary body text.

Example:

> **Could you help me find the station?**

Use:

* large type
* generous line height
* strong contrast
* maximum reading width

Recommended:

```text
Desktop:
32–40px
Tablet:
28–34px
Mobile:
24–30px
```

---

# 08. Chunk Visualization

Chunks are the fundamental learning primitive.

Example:

> **I'm looking for a hotel.**

Possible visualization:

```text
I'm looking for    a hotel.
───────────────    ───────
      CHUNK         OBJECT
```

But do **not** permanently underline every chunk.

Instead use interaction:

```text
Normal
"I'm looking for a hotel."
Hover / tap
"I'm looking for" ← chunk
Expanded
"I'm looking for"
Pattern: [I'm looking for] + [THING]
```

---

# 09. Pattern Visualization

Patterns should use **slots**.

Example:

```text
I'm looking for [THING].
```

Slots use a distinct visual treatment:

```text
I'm looking for  [ THING ]
```

Suggested token:

```text
background: Sen 50
border: Sen 200
text: Sen 800
radius: 8px
```

When the learner selects the slot:

```text
I'm looking for [ a hotel ].
                  └───────┘
```

The interaction should visually communicate:

> “This part can change.”

---

# 10. Spacing System

Use a 4px base grid.

```text
4   = xs
8   = sm
12  = sm+
16  = md
20  = md+
24  = lg
32  = xl
40  = 2xl
48  = 3xl
64  = 4xl
80  = 5xl
96  = 6xl
```

Default UI spacing:

```text
Component internal:
16px
Card:
24px
Section:
32–48px
Major section:
64–96px
```

OpenSen should have **more whitespace than typical productivity software**.

---

# 11. Radius

Use a restrained radius system.

```text
Radius XS   4px
Radius SM   6px
Radius MD   10px
Radius LG   14px
Radius XL   20px
Radius Full 999px
```

Recommended:

* buttons → 10px
* cards → 14px
* modal → 20px
* pills → full

Avoid excessive rounded “bubble” UI.

---

# 12. Elevation

OpenSen should rely primarily on borders and surface contrast.

### Level 0

No elevation.

### Level 1

```text
0 1px 2px rgba(0,0,0,.04)
```

### Level 2

```text
0 4px 12px rgba(0,0,0,.06)
```

### Level 3

```text
0 12px 32px rgba(0,0,0,.10)
```

Use shadows sparingly.

---

# 13. Iconography

Use:

**Lucide-style outline icons**

Properties:

* 1.75–2px stroke
* rounded caps
* simple geometry
* no unnecessary detail

Common icons:

```text
Play
Pause
Volume
Mic
BookOpen
MessageCircle
Layers
Sparkles
Repeat
Check
X
ChevronRight
Lightbulb
Brain
Target
Clock
Settings
Search
```

Avoid mixing:

* outline icons
* filled icons
* 3D icons

in the same interface.

---

# 14. Buttons

## Primary

```text
[ Start practice ]
```

Height:

```text
44px desktop
48px mobile
```

Properties:

* Sen 700 background
* white text
* 10px radius
* semibold

---

## Secondary

```text
[ Review chunks ]
```

Paper background + border.

---

## Ghost

```text
Learn more →
```

No background.

---

## Destructive

Only for destructive operations.

```text
[ Delete ]
```

Red semantic color.

---

# 15. Cards

OpenSen should have four major card types.

## Situation Card

```text
┌───────────────────────────────┐
│ ✈ Travel                      │
│                               │
│ At the airport                │
│ 12 sentences · 8 chunks      │
│                               │
│ Continue →                    │
└───────────────────────────────┘
```

---

## Sentence Card

```text
┌───────────────────────────────┐
│                               │
│ "Could you help me find       │
│  the station?"                │
│                               │
│ 🔊 Listen                     │
│                               │
│ Airport · Asking for help     │
└───────────────────────────────┘
```

---

## Chunk Card

```text
┌───────────────────────────────┐
│ CHUNK                         │
│                               │
│ I'm looking for...            │
│                               │
│ Pattern                       │
│ I'm looking for [THING].      │
│                               │
│ 7 sentences                   │
└───────────────────────────────┘
```

---

## Practice Card

Should contain only what is necessary to perform the exercise.

---

# 16. Navigation

Desktop:

```text
┌──────────────┬───────────────────────────────┐
│ OpenSen      │                               │
│              │                               │
│ Home         │                               │
│ Learn        │                               │
│ Practice     │                               │
│ Library      │                               │
│             │                               │
│ ───────────  │                               │
│ Progress     │                               │
│              │                               │
│ Settings     │                               │
└──────────────┴───────────────────────────────┘
```

Primary navigation:

1. Home
2. Learn
3. Practice
4. Library

Secondary:

5. Progress
6. Settings

---

# 17. Home Screen

The home screen should answer three questions immediately:

### What should I do?

> **12 chunks are ready to practice.**

### Why?

> Your next review is due.

### What can I explore?

> Continue learning “At the Airport”.

Example:

```text
Good morning.
Ready to practice?
12 chunks are waiting.
┌─────────────────────────────┐
│       12                    │
│       Due today             │
│                             │
│   [ Start practice ]        │
└─────────────────────────────┘
Continue learning
At the Airport
████████░░ 80%
8 / 10 sentences
[ Continue → ]
```

---

# 18. Learn Screen

Learn should be **content-first**.

Structure:

```text
Situation
↓
Context
↓
Dialogue
↓
Sentence
↓
Chunk
↓
Pattern
```

Example:

```text
AT THE AIRPORT
You are checking in for your flight.
Agent:
Good morning. May I see your passport?
You:
Sure. Here you are.
──────────────────────
May I see your passport?
🔊 Listen
```

Then:

```text
Explore sentence
```

reveals:

```text
May I see [YOUR PASSPORT]?
       └────── variable object
```

---

# 19. Practice Screen

This is the most important screen in the application.

It should be almost distraction-free.

```text
┌─────────────────────────────────────┐
│  Practice                     3 / 10│
│                                     │
│                                     │
│        At the airport               │
│                                     │
│   You want to ask for help.         │
│                                     │
│   ─────────────────────────────     │
│                                     │
│   Could you help me find the       │
│   station?                          │
│                                     │
│            🔊                        │
│                                     │
│                                     │
│        [ Reveal answer ]            │
│                                     │
└─────────────────────────────────────┘
```

Do not show:

* leaderboard
* XP
* unnecessary navigation
* advertisements
* unrelated recommendations

during practice.

---

# 20. Recall Interaction

The learner first sees:

```text
Situation:
You need help finding the station.
```

Then:

```text
What would you say?
```

The learner thinks.

Only afterward:

```text
Could you help me find the station?
```

Then:

```text
How did it feel?
[ Forgot ] [ Hard ] [ Good ]
```

This creates the correct psychological sequence:

```text
RECALL
  ↓
REVEAL
  ↓
EVALUATE
  ↓
SCHEDULE
```

---

# 21. Speaking UI

Speaking should feel like a conversation, not a microphone test.

```text
┌─────────────────────────────┐
│                             │
│  Could you help me find     │
│  the station?               │
│                             │
│             🎙              │
│                             │
│       Hold to speak         │
│                             │
└─────────────────────────────┘
```

After speaking:

```text
You said:
"Could you help me find
the station?"
                    ✓ Natural
Try this:
"Could you help me find
the station?"
```

Feedback should prioritize:

1. Meaning
2. Naturalness
3. Pronunciation

—not obsess over accent perfection.

---

# 22. Dialogue UI

Dialogue should resemble a real conversation.

```text
AI
Good morning. How can I help you?
YOU
I'd like to check in.
AI
Sure. May I see your passport?
YOU
Sure. Here you are.
```

Avoid overly large chat bubbles.

This isn't a messaging app.

The emphasis should remain on the **language**.

---

# 23. Chunk Library

Library structure:

```text
My Language
Chunks
Sentences
Situations
Patterns
Saved
```

Chunk card:

```text
I'm looking for...
Used in 14 sentences
Mastery
████████░░ 80%
Last practiced
Yesterday
```

---

# 24. Mastery Visualization

Avoid generic:

> Level 7

Prefer meaningful states:

```text
New
Familiar
Practicing
Comfortable
Automatic
```

Visual:

```text
○ New
◔ Familiar
◑ Practicing
◕ Comfortable
● Automatic
```

This communicates the actual learning journey better than arbitrary gamification.

---

# 25. Progress Dashboard

Progress should answer:

### Exposure

How much language did I encounter?

### Recall

How much can I retrieve?

### Usage

How much can I actually produce?

Example:

```text
THIS WEEK
Sentences encountered       84
Chunks practiced            46
Recall accuracy             78%
Speaking sessions             9
```

Then:

```text
Your strongest situations
Travel          █████████░
Restaurant      ███████░░░
Work            ██████░░░░
Social          █████░░░░░
```

Do not turn everything into a competitive score.

---

# 26. Empty States

Empty states should teach the product.

Bad:

> No data.

Good:

> **Your language library is empty.**
> Start with a situation you expect to encounter.

```text
[ Create situation ]
```

---

# 27. Loading States

Prefer skeletons for content.

For AI generation:

```text
Creating your dialogue...
Finding reusable chunks...
Building practice...
```

This makes the AI pipeline understandable.

---

# 28. AI UI

AI should feel like a **language assistant**, not a generic chatbot.

Instead of:

> Ask AI anything

Use contextual actions:

```text
Explain this
Give me another example
Make it more natural
Make it easier
Create variations
Practice this
```

AI actions should always be attached to language context.

---

# 29. AI Generation Card

```text
┌─────────────────────────────────┐
│ ✦ AI suggestion                 │
│                                 │
│ "Could you possibly help me     │
│  find the station?"             │
│                                 │
│ More polite than your original  │
│ sentence.                       │
│                                 │
│ [ Use ]   [ Try another ]       │
└─────────────────────────────────┘
```

AI output must be visually distinguished from verified learning content.

---

# 30. Status Badges

Use compact semantic badges.

```text
NEW
PRACTICING
MASTERED
DUE
```

Do not use 20 different colors.

---

# 31. Motion

Motion should reinforce learning.

### Sentence reveal

160–220ms

### Chunk expansion

180–240ms

### Card transition

200–280ms

### Page transition

250–350ms

Use:

```text
ease-out
```

Avoid:

* bouncing
* excessive spring animations
* confetti
* flashy XP explosions

A successful recall can have a subtle:

```text
opacity
+
scale 0.98 → 1
```

rather than a giant celebration.

---

# 32. Sound

Sound is a first-class interaction.

Three levels:

```text
Listen
Slow
Natural
```

Example:

```text
🔊 Normal
🐢 Slow
🗣 Natural
```

The UI should make replay effortless.

---

# 33. Responsive Design

## Mobile

Primary use case.

```text
Content width:
100%
Horizontal padding:
20px
Bottom navigation:
4 items
```

Practice screen:

```text
full screen
```

---

## Tablet

Use:

```text
max-width: 720px
```

for learning content.

---

## Desktop

Use a split architecture:

```text
┌──────────┬───────────────────────┬─────────────┐
│ Sidebar  │ Main learning content │ Context     │
│          │                       │             │
│          │ Sentence              │ Chunk       │
│          │ Dialogue              │ Pattern     │
│          │ Practice              │ Related     │
└──────────┴───────────────────────┴─────────────┘
```

But only show the context panel when useful.

---

# 34. Accessibility

Target:

**WCAG 2.2 AA**

Rules:

* keyboard navigation
* visible focus
* minimum 44px touch target
* semantic HTML
* screen-reader labels
* reduced-motion support
* sufficient color contrast
* no color-only state
* captions/transcripts for audio

For speaking exercises:

Always provide a non-speaking alternative.

---

# 35. Component Architecture

Recommended component hierarchy:

```text
Foundation
├── Colors
├── Typography
├── Spacing
├── Radius
├── Elevation
├── Motion
└── Icons
Primitive
├── Button
├── IconButton
├── Input
├── Select
├── Badge
├── Avatar
├── Divider
├── Tooltip
└── Progress
Language
├── Sentence
├── Chunk
├── Pattern
├── Slot
├── Translation
├── Pronunciation
├── AudioPlayer
└── LanguageLabel
Learning
├── SituationCard
├── Dialogue
├── DialogueLine
├── PracticeCard
├── RecallPrompt
├── AnswerReveal
├── ReviewRating
├── SpeakingRecorder
└── MasteryIndicator
Navigation
├── Sidebar
├── BottomNav
├── Breadcrumb
├── Tabs
└── PageHeader
AI
├── AISuggestion
├── AIAction
├── GenerationStatus
└── AIExplanation
```

---

# 36. Design Tokens

A practical token structure:

```text
color.background.primary
color.background.secondary
color.background.elevated
color.text.primary
color.text.secondary
color.text.muted
color.text.inverse
color.border.default
color.border.strong
color.brand.primary
color.brand.primaryHover
color.brand.subtle
color.semantic.success
color.semantic.warning
color.semantic.error
color.semantic.info
space.1
space.2
space.3
space.4
space.6
space.8
space.12
space.16
radius.sm
radius.md
radius.lg
radius.xl
shadow.sm
shadow.md
shadow.lg
```

This lets the design system survive a future redesign.

---

# 37. Component States

Every interactive component must define:

```text
Default
Hover
Focus
Pressed
Disabled
Loading
Error
Success
```

Example:

```text
Button
Default
Hover
Pressed
Focus
Disabled
Loading
```

Learning components additionally need:

```text
New
Seen
Due
Mastered
Selected
Correct
Incorrect
```

---

# 38. Content Design

OpenSen's copy should be:

**Short**

> Practice this chunk.

Not:

> Click the button below to begin practicing this language chunk.

**Human**

> Nice. You remembered it.

Not:

> Your response has been successfully evaluated.

**Specific**

> Try saying it without looking.

Not:

> Continue your learning journey.

---

# 39. Microcopy Vocabulary

Prefer:

```text
Practice
Recall
Listen
Speak
Try again
Reveal
Continue
Explore
Save
Learn
Review
```

Avoid:

```text
Complete lesson
Earn XP
Claim reward
Level up
Don't break your streak!
```

Gamification can exist, but it should not define the product.

---

# 40. Design Rules for Language Content

### Rule 1

**Sentence is more important than translation.**

### Rule 2

**Chunk is more important than isolated vocabulary.**

### Rule 3

**Context comes before explanation.**

### Rule 4

**Practice comes before passive review.**

### Rule 5

**AI explains; AI does not replace learning.**

### Rule 6

**The learner should always know why they are seeing something.**

---

# 41. The OpenSen Visual Hierarchy

Every learning screen should follow:

```text
1. CONTEXT
      ↓
2. INTENTION
      ↓
3. SENTENCE
      ↓
4. CHUNK
      ↓
5. PATTERN
      ↓
6. PRACTICE
```

The visual weight should follow the same hierarchy.

Therefore:

```text
Situation       small
Intent          small/medium
Sentence        HUGE
Chunk           medium
Pattern         medium
Metadata        tiny
```

This is one of the most important rules in the entire system.

---

# 42. Design Anti-Patterns

Do NOT build OpenSen like this:

### ❌ Duolingo clone

```text
XP
🔥 streak
❤️ lives
🏆 leaderboard
```

### ❌ Generic SaaS dashboard

```text
Cards
Charts
Tables
KPIs
```

### ❌ ChatGPT clone

```text
AI chat
AI chat
AI chat
```

### ❌ Flashcard app

```text
Front
Back
Next
Repeat
```

### ❌ Academic LMS

```text
Course
Module
Chapter
Quiz
Exam
Certificate
```

OpenSen's UI should instead communicate:

```text
CONTEXT
   ↓
LANGUAGE
   ↓
PATTERN
   ↓
MEMORY
   ↓
USE
```

---

# 43. Signature Interaction

OpenSen should have one interaction that becomes recognizable as its own.

### The Sentence → Pattern transition

Normal:

> **I'm looking for a hotel.**

Tap:

> **I'm looking for** a hotel.

Tap again:

> I'm looking for **[THING]**.

Then:

```text
I'm looking for [THING].
Try:
hotel
restaurant
station
pharmacy
```

This interaction visually teaches the fundamental OpenSen concept:

> **A sentence is not merely something to memorize. It is a reusable structure.**

That should become one of the product's signature interactions.

---

# 44. Design System Summary

The entire visual system can be compressed into:

```text
OPEN SEN
────────────────────────────
CALM
        ↓
CONTEXT
        ↓
SENTENCE
        ↓
CHUNK
        ↓
PATTERN
        ↓
PRACTICE
        ↓
RECALL
        ↓
FLUENCY
```

### Visual language

```text
Warm white
+
Deep ink
+
Sen green
+
Editorial typography
+
Generous whitespace
+
Subtle motion
+
Semantic color
+
Sentence-first layouts
```

### Product personality

```text
Intelligent
     +
Warm
     +
Focused
     +
Curious
     +
Premium
```

### Core rule

> **The interface should disappear when the learner is using the language.**
