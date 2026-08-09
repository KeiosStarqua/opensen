---
title: Marketing landing page with Next.js route groups in web/
date: 2026-08-09
category: architecture-patterns
module: web
problem_type: architecture_pattern
component: tooling
severity: medium
applies_when:
  - "Replacing the default Next.js starter with a product marketing landing page in web/"
  - "Splitting public marketing and trial/onboarding flows using App Router route groups"
  - "Aligning landing copy, CTAs, and demo sections to docs/product-strategy.md"
tags:
  - nextjs
  - marketing
  - landing-page
  - route-groups
  - app-router
  - onboarding
  - opensen-web
resolution_type: code_fix
---

# Marketing landing page with Next.js route groups in web/

## Context

[KEI-146](https://linear.app/keios/issue/KEI-146/web-thiet-ke-landing-page-opensen) required replacing the default Next.js starter at `/` with an OpenSen marketing landing page that communicates the speaking-reflex outcome and hands visitors to a usable trial entry point. The plan ([`docs/plans/2026-08-09-002-feat-opensen-landing-page-plan.md`](../../plans/2026-08-09-002-feat-opensen-landing-page-plan.md)) blocked on **Q1: CTA destination** — no trial, onboarding, or application route existed in `web/`.

The team resolved Q1 with **Option B**: expand scope to include a minimal public `/onboarding` route as the trial entry. [PR #9](https://github.com/KeiosStarqua/opensen/pull/9) shipped both surfaces in the existing `web/` package, following the architecture decision in [`single-nextjs-landing-and-app.md`](./single-nextjs-landing-and-app.md) (one Next.js app, route-group separation).

**Before:** The pre-KEI-146 root page under `web/app/` was the unmodified Next.js starter (removed by PR #9) — no OpenSen positioning, no CTA target, no product handoff.

**After:** Marketing home at `/` via the marketing route group; trial entry at `/onboarding` via the app route group; shared components and centralized site config.

## Guidance

### 1. Route groups separate marketing from product surfaces

Use App Router **route groups** — parenthesized folders that organize routes without affecting URLs — to keep marketing and app UI in sibling trees under `web/app/`.

| Surface | URL | Role |
|---------|-----|------|
| Marketing home | `/` | Thin page shell; renders `<LandingPage />` |
| Trial entry | `/onboarding` | Minimal trial entry with goal picker + situation form |

Route files live under `web/app/` in the marketing and app route groups (see layout tree in Examples below).

The marketing page stays a one-line server component:

```tsx
import { LandingPage } from "@/components/landing-page";

export default function HomePage() {
  return <LandingPage />;
}
```

The onboarding route owns its own metadata and layout chrome (back link, step indicator) while reusing shared config from `web/lib/site.ts`.

`web/AGENTS.md` documents this convention: prefer route groups `(marketing)` and `(app)` when splitting surfaces; keep marketing and authenticated app routes separated as features land.

### 2. Centralize site config and hero copy in `web/lib/site.ts`

Put brand constants, CTA target, and product-strategy-aligned copy in one module so landing, onboarding, and future routes stay consistent.

```ts
export const siteConfig = {
  name: "OpenSen",
  tagline: "Open Sentence",
  description:
    "OpenSen turns real-life situations into reusable sentence patterns you can remember, adapt, and speak automatically.",
  trialHref: "/onboarding",
} as const;

export const heroCopy = {
  headline: "Speak without translating in your head.",
  subheadline: siteConfig.description,
  coreMessage: "Learn fewer patterns. Say more things.",
} as const;
```

Key decisions:

- **`trialHref: "/onboarding"`** — single source of truth for every CTA; change the destination once, not in four button instances.
- **`heroCopy`** mirrors canonical strings from `docs/product-strategy.md` (headline, subheadline, core message).
- **`onboardingGoals`** shared between onboarding form and any future surfaces that list goal options.

Root layout metadata also reflects product positioning (requirement R6):

```ts
export const metadata: Metadata = {
  title: {
    default: "OpenSen — Speak without translating in your head",
    template: "%s · OpenSen",
  },
  description:
    "OpenSen turns real-life situations into reusable sentence patterns you can remember, adapt, and speak automatically.",
};
```

### 3. Decompose landing into focused components

Avoid a monolithic page file. Split by responsibility:

| Component | File | Responsibility |
|-----------|------|----------------|
| `LandingPage` | `web/components/landing-page.tsx` | Section layout, static content arrays, composition |
| `ChunkDemo` | `web/components/chunk-demo.tsx` | Static frame+slot demonstration |
| `CtaButton` | `web/components/cta-button.tsx` | Reusable primary/secondary CTA links |
| `OnboardingForm` | `web/components/onboarding-form.tsx` | Client-side goal picker + situation input (`"use client"`) |

`LandingPage` imports config and child components, defines section data as local constants (`situations`, `learningSteps`, `mvpPath`), and wires CTAs through `siteConfig.trialHref`.

Prefer Server Components by default (`LandingPage`, `ChunkDemo`, `CtaButton`); add `"use client"` only where interaction is required (`OnboardingForm`).

### 4. Product-strategy-aligned copy, not ad-hoc marketing text

Lead with the speaking outcome, use the mnemonic, and avoid presenting non-goal features as MVP:

- Hero pulls from `heroCopy` (matches `docs/product-strategy.md` landing copy section).
- "How it works" section titles the loop **Situation → Sentence → Slot → Speak** and explains chunking as mechanism.
- MVP path section explicitly excludes deck setup, grammar courses, and chat companions.
- Footer repeats the mnemonic for reinforcement.

Repeated CTAs (header, hero, closing banner) all point to `siteConfig.trialHref` — satisfying plan requirement R5 without hardcoding paths.

### 5. Static chunk demo teaches the product without backend dependency

`ChunkDemo` is a pure server component: no API calls, no client state. It shows one sentence frame with a highlighted slot and a list of swap examples. This satisfies plan requirement R2 (static sentence-frame-plus-slot demo for "Learn fewer patterns. Say more things.") without waiting on dialogue generation APIs.

### 6. Minimal onboarding as CTA target (Option B)

When no trial route exists, ship a **thin public onboarding page** rather than linking to a dead URL or external placeholder.

The `/onboarding` page provides:

- Clear step framing ("Step 1 of 2")
- Goal selection from `onboardingGoals`
- Situation text input
- Client-side submit that shows a queued confirmation (no backend generation yet)

Scope stays minimal: no auth, no dialogue generation, no practice scheduling — matching plan scope boundaries. The landing page can ship with a real handoff immediately.

## Why This Matters

- **Unblocks R5 without a separate marketing app or premature auth.** Option B gives every CTA a working destination inside the same deployable, consistent with the single-Next.js architecture decision.
- **Copy drift is expensive.** Centralizing `heroCopy` and `siteConfig` ties the live page to `docs/product-strategy.md`; marketing iterations update one file instead of hunting string literals across components.
- **Route groups scale cleanly.** As authenticated app routes land in the app route group, marketing stays isolated in the marketing route group without URL collisions or a second `create-next-app` tree.
- **Static demo de-risks the hero.** Visitors understand chunking before any API exists; the landing page does not block on backend dialogue generation.
- **Component boundaries match Server/Client split.** Most of the page is server-rendered; only the onboarding form pays the client bundle cost.

## When to Apply

- Adding or refreshing a **public marketing landing page** in the existing `web/` Next.js package
- A plan blocks on **CTA destination** and no trial/onboarding route exists yet — prefer Option B (minimal public entry) over dead links or scope-deferral unless an external trial URL is already live
- Marketing and product UI must coexist in one monorepo deploy (see `single-nextjs-landing-and-app.md`)
- Copy must stay aligned with `docs/product-strategy.md` canonical landing strings
- You need to demonstrate chunking on the landing page before AI generation APIs are wired

**Do not apply** when:

- A separate marketing stack or deploy is already chosen for measured operational reasons
- The CTA should point to an existing external trial (plan Option A)
- Full onboarding (auth, generation, practice) is ready — then link CTAs to that route and keep `/onboarding` or replace it intentionally

## Examples

### Before: default Next.js starter

The pre-PR state was the stock `create-next-app` homepage — no OpenSen branding, no product narrative, no trial handoff. It failed plan requirements R1–R3 and R5–R6.

### After: route-group layout

```
web/app/
├── layout.tsx
├── marketing-route-group/
│   └── page.tsx            # folder name: (marketing) → URL /
└── app-route-group/
    └── onboarding/
        └── page.tsx        # folder name: (app) → URL /onboarding
```

In the repo, replace `marketing-route-group` and `app-route-group` with parenthesized App Router route group folder names.

### CTA wiring through site config

All primary CTAs reference `siteConfig.trialHref` in `web/components/landing-page.tsx`. To retarget CTAs (e.g., when a full app dashboard ships), change `trialHref` in `web/lib/site.ts` once.

### Verification

From `web/AGENTS.md`:

- `npm run lint`
- `npm run build`

PR #9 verification included responsive layout (mobile + desktop), working CTA navigation to `/onboarding`, and OpenSen metadata in root layout.

## Related

- [`single-nextjs-landing-and-app.md`](./single-nextjs-landing-and-app.md) — why one Next.js package with route groups
- [`docs/plans/2026-08-09-002-feat-opensen-landing-page-plan.md`](../../plans/2026-08-09-002-feat-opensen-landing-page-plan.md) — requirements R1–R6, Q1 Option B
- [`web/AGENTS.md`](../../../web/AGENTS.md) — route group convention, Server Component default
- [KEI-146](https://linear.app/keios/issue/KEI-146/web-thiet-ke-landing-page-opensen) · [PR #9](https://github.com/KeiosStarqua/opensen/pull/9)
