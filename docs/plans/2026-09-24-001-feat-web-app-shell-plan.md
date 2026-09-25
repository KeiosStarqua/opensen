---
title: Web App Shell (Today, Library, Situations, Plan) - Plan
type: feat
date: 2026-09-24
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
linear_issues:
  - https://linear.app/keios/issue/KEI-728/web-khung-app-today-library-situations-plan
---

# Web App Shell (Today, Library, Situations, Plan) - Plan

## Goal Capsule

- **Objective:** Add a persistent web application shell under the `(app)` route group with four primary destinations (Today, Library, Situations, Plan), placeholder detail routes outside the tab chrome, and a Settings entry that is not a tab—without real data or API wiring.
- **Authority:** [KEI-728](https://linear.app/keios/issue/KEI-728/web-khung-app-today-library-situations-plan) acceptance criteria; navigation contract in `docs/mobile-ui-design.md` (section Navigation) and path parity with `mobile/lib/core/routing/app_routes.dart`.
- **Execution profile:** Next.js App Router layout and route scaffolding in `web/` only. Verify with `npm run lint` and `npm run build` from `web/`.
- **Stop conditions:** Stop if adding the shell layout would wrap `/` (marketing) or force `/onboarding` into tab chrome; stop if implementation starts calling backend APIs or depends on [KEI-729](https://linear.app/keios/issue/KEI-729) API client work.
- **Tail ownership:** `ce-work` marks this plan’s Definition of Done, opens PR for implementation, sets KEI-728 to In Review, and leaves merge to the owner.

---

## Product Contract

### Summary

The web client needs the same navigational skeleton as mobile: four daily-loop tabs plus root-level detail routes for practice sessions, chunks, situations, dialogues, drills, settings, and export. Each surface shows a named placeholder until feature issues attach real UI.

### Problem Frame

`web/app/` today has marketing at `/` and trial entry at `/onboarding` only. There is no shared app chrome, no tab routes, and no stub paths for downstream web features under epic [KEI-727](https://linear.app/keios/issue/KEI-727).

### Requirements

**Shell and primary tabs**

- R1. Under `web/app/(app)/`, expose stable routes `/today`, `/library`, `/situations`, and `/plan`, each rendering inside a persistent shell with labels **Today**, **Library**, **Situations**, **Plan**.
- R2. Primary navigation remains visible on all four tab routes; switching tabs updates the URL and the active nav state; revisiting a tab returns to the same route (standard Next.js layout persistence per segment—no custom state required for v1 placeholders).
- R3. Responsive chrome: narrow viewports use a bottom navigation bar; `md` and wider use a sidebar (or equivalent fixed vertical nav). All four destinations remain reachable in both layouts.

**Routes outside the tab bar**

- R4. Register root-level `(app)` routes (no tab chrome): `/settings`, `/export`, `/practice/session`, `/chunks/new`, `/chunks/[id]`, `/situations/[id]`, `/situations/[id]/build`, `/dialogues/[id]`, `/drills/[patternId]`. Each shows a minimal placeholder naming the surface (e.g. “Settings”, “Chunk detail”) and optional back link—not feature UI.
- R5. The shell exposes a link to **Settings** (gear or text); Settings is not a fifth tab. Practice, Settings, and Export are not tabs (per mobile navigation contract).

**Marketing and onboarding isolation**

- R6. `/` stays the marketing landing in `(marketing)`; it must not inherit app shell layout.
- R7. `/onboarding` stays as implemented today (standalone header, no tab bar) until a dedicated onboarding issue changes it.

**Quality**

- R8. `npm run lint` and `npm run build` succeed from `web/`.

### Acceptance Examples

- AE1. From `/today`, the user can navigate to Library, Situations, and Plan via shell controls; the URL and active nav item match.
- AE2. Opening `/situations/example-id` or `/practice/session` shows a placeholder without the four-tab bar.
- AE3. `/` still renders the marketing landing with no app sidebar/bottom nav.
- AE4. `/onboarding` renders without tab chrome.
- AE5. At a narrow and a wide viewport width, all four tab destinations are reachable from the shell.

### Scope Boundaries

- No API calls, auth, data fetching, or integration with [KEI-729](https://linear.app/keios/issue/KEI-729) web API client.
- No changes to onboarding form behavior, practice session logic, or landing copy beyond links that may point at new stub routes.
- No mobile (`mobile/`) or backend (`backend/`) code.

#### Deferred to Follow-Up Work

- KEI-729 and sibling web issues under KEI-727 own API wiring and feature UI on these routes.

---

## Planning Contract

### Product Contract Preservation

No upstream unified plan exists for KEI-728. This plan derives requirements from the Linear issue and aligns paths with the mobile routing source of truth.

### Key Technical Decisions

- **KTD1. Nested route group `(app)/(shell)/` for tab routes.** A layout at `web/app/(app)/(shell)/layout.tsx` owns the shell chrome. Sibling folders under `(app)/` (e.g. `settings/`, `chunks/`, `onboarding/`) do not nest under `(shell)/`, so they render without the tab bar. This extends the pattern documented in `docs/solutions/architecture-patterns/nextjs-marketing-landing-route-groups.md` without wrapping `/onboarding`.
- **KTD2. Centralize path constants in `web/lib/app-routes.ts`.** Mirror `AppRoutes` in `mobile/lib/core/routing/app_routes.dart` (static paths and small helpers for dynamic segments) so shell links and future features share one contract.
- **KTD3. Client shell nav component.** Use a `"use client"` nav component with `usePathname()` for active styling. Keep tab pages as Server Components where possible (simple placeholders).
- **KTD4. Placeholder page pattern.** Shared minimal layout: surface title, one-line “placeholder” copy, optional `Link` back to `/today` or `router.back()` for detail stubs—consistent typography with existing onboarding/landing (slate/emerald palette, Tailwind utilities already in `globals.css`).
- **KTD5. Dynamic segments as documented.** Use `[id]` and `[patternId]` folder names matching the issue list; declare static paths like `chunks/new` as a separate segment before `chunks/[id]` to avoid route shadowing (same rule as mobile router ordering).

### Assumptions

- Default post-shell entry is `/today` only when a future issue adds redirect; this issue does not require redirecting `/onboarding` to `/today`.
- No automated UI test runner exists in `web/package.json` yet; verification is lint, build, and manual responsive smoke unless a follow-up adds Playwright.
- Auth is out of scope; shell is public scaffolding like current onboarding.

### High-Level Technical Design

```mermaid
flowchart TB
  root[app/layout.tsx]
  m[(marketing)/page.tsx → /]
  o[(app)/onboarding → /onboarding]
  sh[(app)/(shell)/layout.tsx]
  sh --> t[/today]
  sh --> l[/library]
  sh --> s[/situations]
  sh --> p[/plan]
  d1[(app)/settings]
  d2[(app)/chunks/...]
  d3[(app)/situations/id/...]
  root --> m
  root --> o
  root --> sh
  root --> d1
  root --> d2
  root --> d3
```

### Sequencing

1. Add `app-routes.ts` and folder skeleton (shell + detail routes).
2. Implement `AppShell` layout and responsive nav.
3. Add tab and detail placeholder pages.
4. Wire Settings link in shell header; smoke responsive nav.
5. Run lint and production build.

### Risks & Dependencies

- **Layout leakage:** A misplaced `layout.tsx` under `(app)/` wrapping all children would incorrectly shell-wrap `/onboarding`—mitigate with `(shell)` group only.
- **Route conflicts:** `chunks/new` must not be captured by `chunks/[id]`—use distinct static folder `chunks/new/page.tsx`.
- **Dependency:** Feature issues may assume KEI-729 for data; this shell must remain empty of fetch logic.

### Sources & Research

- `web/app/(marketing)/page.tsx`, `web/app/(app)/onboarding/page.tsx`, `web/app/layout.tsx` — current split surfaces.
- `docs/solutions/architecture-patterns/nextjs-marketing-landing-route-groups.md` — route group conventions.
- `docs/mobile-ui-design.md` — Navigation (4 tabs; Practice/Settings/Export not tabs).
- `mobile/lib/core/routing/app_routes.dart` — canonical paths.
- `web/AGENTS.md` — App Router, route groups, verification commands.

---

## Output Structure

```text
web/
├── lib/
│   └── app-routes.ts
├── components/
│   └── app-shell.tsx          # client: nav + chrome
├── app/
│   ├── (marketing)/page.tsx   # unchanged role
│   └── (app)/
│       ├── onboarding/page.tsx
│       ├── (shell)/
│       │   ├── layout.tsx
│       │   ├── today/page.tsx
│       │   ├── library/page.tsx
│       │   ├── situations/page.tsx
│       │   └── plan/page.tsx
│       ├── settings/page.tsx
│       ├── export/page.tsx
│       ├── practice/session/page.tsx
│       ├── chunks/new/page.tsx
│       ├── chunks/[id]/page.tsx
│       ├── situations/[id]/page.tsx
│       ├── situations/[id]/build/page.tsx
│       ├── dialogues/[id]/page.tsx
│       └── drills/[patternId]/page.tsx
```

---

## Implementation Units

### U1. Route contract and filesystem skeleton

- **Goal:** Create all routes and path constants without UI polish.
- **Requirements:** R1, R4, R6, R7.
- **Dependencies:** None.
- **Files:** `web/lib/app-routes.ts`, new directories under `web/app/(app)/` per Output Structure.
- **Approach:** Copy path strings from `AppRoutes`; add `page.tsx` stubs exporting metadata title + heading only.
- **Patterns to follow:** `web/lib/site.ts` for const export style; route group naming from existing `(marketing)` / `(app)`.
- **Test scenarios:**
  - Each listed URL resolves in `next build` route output (no build errors).
  - `/onboarding` and `/` remain outside `(shell)` tree in the filesystem.
- **Verification:** `npm run build` from `web/` completes.

### U2. Persistent shell layout and responsive navigation

- **Goal:** Render fixed nav for the four tab routes only.
- **Requirements:** R1, R2, R3, R5.
- **Dependencies:** U1.
- **Files:** `web/app/(app)/(shell)/layout.tsx`, `web/components/app-shell.tsx`.
- **Approach:** `(shell)/layout.tsx` wraps children with `AppShell`. Nav uses `Link` hrefs from `app-routes.ts`. Bottom bar below `md`, sidebar from `md:` breakpoint. Highlight active item via `usePathname()` prefix match on tab paths.
- **Patterns to follow:** Tailwind layout patterns from `landing-page.tsx` / onboarding header spacing; keep shell visually distinct from marketing (subtle border/background, not full marketing hero).
- **Test scenarios:**
  - Covers AE1: clicking each nav item changes pathname and active styles.
  - Covers AE5: at 375px and 1280px widths, all four links visible and clickable (manual or browser devtools).
  - Settings control present in shell header area, not in the four-item tab list.
- **Verification:** Manual smoke + `npm run lint`.

### U3. Tab placeholder pages

- **Goal:** Named empty states for the four primary destinations.
- **Requirements:** R1, R2.
- **Dependencies:** U2.
- **Files:** `web/app/(app)/(shell)/today/page.tsx`, `library/page.tsx`, `situations/page.tsx`, `plan/page.tsx`.
- **Approach:** Server components with `metadata.title` and visible H1 matching tab label; one sentence that UI will ship in a later issue.
- **Test scenarios:**
  - Direct navigation to each `/today` … `/plan` shows shell + correct title.
  - Browser back/forward between tabs preserves expected URLs (no full-page errors).
- **Verification:** Manual smoke.

### U4. Detail and utility routes outside shell

- **Goal:** Stub pages for non-tab flows with no tab chrome.
- **Requirements:** R4, R5.
- **Dependencies:** U1.
- **Files:** All non-`(shell)` `(app)` routes listed in Output Structure except `onboarding`.
- **Approach:** Minimal placeholder; optional link to `/settings` or `/today` for manual testing. Do not import shell layout.
- **Test scenarios:**
  - Covers AE2: `/practice/session`, `/chunks/new`, `/situations/test/build` render without bottom/side tab nav.
  - Dynamic params render placeholder including param value in dev-only subtitle (optional, for QA clarity).
- **Verification:** Manual smoke + `npm run build`.

### U5. Settings entry and marketing isolation check

- **Goal:** Confirm Settings link and that marketing/onboarding stay unshelled.
- **Requirements:** R5, R6, R7.
- **Dependencies:** U2, U4.
- **Files:** `web/components/app-shell.tsx`, sanity check only on `(marketing)/page.tsx` and `(app)/onboarding/page.tsx`.
- **Approach:** Settings `Link` to `/settings` in shell header; no edits to onboarding form logic.
- **Test scenarios:**
  - Covers AE3, AE4: `/` and `/onboarding` have no `AppShell` nav.
  - From `/today`, Settings link opens `/settings` without tab bar.
- **Verification:** Manual smoke.

### U6. Verification gates

- **Goal:** Satisfy CI-ready checks for the web package.
- **Requirements:** R8.
- **Dependencies:** U1–U5.
- **Files:** n/a (commands only).
- **Approach:** Run `npm run lint` and `npm run build` from `web/`; fix any ESLint or type errors introduced by new routes/components.
- **Test scenarios:**
  - Lint exits 0.
  - Build exits 0 and lists new routes.
- **Verification:** Command output captured in PR description or Linear comment.

---

## Verification Contract

| Gate | Applies to | Done signal |
|------|------------|-------------|
| ESLint | U1–U6 | `npm run lint` in `web/` exits 0 |
| Production build | U1–U6 | `npm run build` in `web/` exits 0 |
| Responsive nav smoke | U2, U3, U5 | Four tabs reachable at mobile and desktop widths |
| Scope audit | U1–U6 | No `fetch` to backend, no KEI-729 client imports, no mobile/backend diffs |
| Route isolation | U4, U5 | Detail URLs and `/` `/onboarding` render without tab chrome |

---

## Definition of Done

- [ ] U1: Path constants and full route tree exist under `(app)/(shell)` and sibling detail routes.
- [ ] U2: Responsive shell nav (bottom on small screens, sidebar on `md+`) with four tabs and Settings link.
- [ ] U3: Tab pages show named placeholders inside the shell.
- [ ] U4: All listed detail routes render placeholders outside the shell.
- [ ] U5: `/` and `/onboarding` unchanged in behavior (no shell); Settings reachable from shell.
- [ ] U6: `npm run lint` and `npm run build` pass from `web/`.
- [ ] Acceptance criteria on KEI-728 are demonstrably met (navigation, isolation, responsive, lint/build).
