# OpenSen

**OpenSen** (Open Sentence) is a situational speaking-reflex system for English: learners turn conversations they actually need into sentence patterns they can speak automatically. The **chunking method** is the mechanism — whole sentences and pre-assembled phrases with swappable slots, retrieved automatically rather than constructed word-by-word.

## Product features

| Feature | Role |
|---------|------|
| Dialog Builder | Generate memorization-ready dialogs and speeches |
| Chunk Library | High-frequency native phrases with swap patterns |
| Situation Coverage | Real-world scenarios (small talk, ordering, travel, etc.) |
| Substitution Drills | Keep the frame, swap the slot |
| Recall Practice | Produce the sentence instead of recognizing it |
| Practice Plan | Spaced repetition schedules (FSRS, per chunk) |
| Anki export | Take your chunks anywhere |

Durable product detail: [`docs/`](docs/).

## Repository layout

| Path | Role |
|------|------|
| [`docs/`](docs/) | Product documentation |
| [`mobile/`](mobile/) | Flutter mobile app |
| [`backend/`](backend/) | Hono API on Vercel |
| [`web/`](web/) | Next.js landing + web app |

---

# DOX framework

- DOX is highly performant AGENTS.md hierarchy installed here
- Agent must follow DOX instructions across any edits

## Core Contract

- AGENTS.md files are binding work contracts for their subtrees
- Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable AGENTS.md plus every parent AGENTS.md above it

## Read Before Editing

1. Read the root AGENTS.md
2. Identify every file or folder you expect to touch
3. Walk from the repository root to each target path
4. Read every AGENTS.md found along each route
5. If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there
6. Use the nearest AGENTS.md as the local contract and parent docs for repo-wide rules
7. If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX

Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Update child docs when parent changes alter local rules. Remove stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the DOX pass still must happen.

## Hierarchy

- Root AGENTS.md is the DOX rail: project-wide instructions, global preferences, durable workflow rules, and the top-level Child DOX Index
- Child AGENTS.md files own domain-specific instructions and their own Child DOX Index
- Each parent explains what its direct children cover and what stays owned by the parent
- The closer a doc is to the work, the more specific and practical it must be

## Child Doc Shape

- Create a child AGENTS.md when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards
- Work Guidance must reflect the current standards of the project or user instructions; if there are no specific standards or instructions yet, leave it empty
- Verification must reflect an existing check; if no verification framework exists yet, leave it empty and update it when one exists

Default section order:
- Purpose
- Ownership
- Local Contracts
- Work Guidance
- Verification
- Child DOX Index

## Style

- Keep docs concise, current, and operational
- Document stable contracts, not diary entries
- Put broad rules in parent docs and concrete details in child docs
- Prefer direct bullets with explicit names
- Do not duplicate rules across many files unless each scope needs a local version
- Delete stale notes instead of explaining history
- Trim obvious statements, repeated rules, misplaced detail, and warnings for risks that no longer exist

## Closeout

1. Re-check changed paths against the DOX chain
2. Update nearest owning docs and any affected parents or children
3. Refresh every affected Child DOX Index
4. Remove stale or contradictory text
5. Run existing verification when relevant
6. Report any docs intentionally left unchanged and why

## User Preferences

When the user requests a durable behavior change, record it here or in the relevant child AGENTS.md.

### Coding principles

Apply these on all product code (`backend/`, `mobile/`, `web/`). Prefer depth and clear boundaries over ceremony; do not invent layers or patterns that the problem does not need.

- **Clean Architecture** — Depend inward: domain and use-cases must not import frameworks, HTTP, DB, or UI. Push I/O and vendors to the edges; wire them at composition roots (routes, app bootstrap, DI). New features keep business rules testable without Vercel, Flutter, or OpenRouter.
- **SOLID** — Single responsibility per module; open for extension via seams, closed for casual rewrite; subtype/interface contracts that do not surprise callers; prefer focused interfaces; inject abstractions at boundaries (providers, repositories, clocks) instead of hardcoding concretes.
- **Design patterns** — When a recurring structure fits, pick from the [Refactoring Guru catalog](https://refactoring.guru/design-patterns/catalog) (creational / structural / behavioral). Use a pattern only when it reduces coupling or clarifies intent; never add Factory/Strategy/Observer “because Clean Architecture.” Name the pattern in a short comment only if the code alone is unclear.
- **Deep modules** — Follow [Modules Should Be Deep](https://softengbook.org/articles/deep-modules) (Ousterhout via Valente): a module’s **interface should be much simpler than its implementation**. Prefer few, powerful operations with clear contracts over many shallow wrappers that leak internals. Avoid shallow modules whose API is almost as complex as the body. Hide complexity behind stable, small surfaces (functions, classes, packages).

Child `AGENTS.md` files may add stack-specific seams (e.g. AI only via `backend/src/ai/`); they must not weaken these principles.

## Child DOX Index

| Path | Scope |
|------|-------|
| [`docs/AGENTS.md`](docs/AGENTS.md) | Product and project documentation |
| [`mobile/AGENTS.md`](mobile/AGENTS.md) | Flutter mobile client |
| [`backend/AGENTS.md`](backend/AGENTS.md) | Hono API (Vercel) |
| [`web/AGENTS.md`](web/AGENTS.md) | Next.js landing + web app |