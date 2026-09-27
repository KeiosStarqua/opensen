---
title: Web Recall Practice (KEI-736) — Plan
type: feat
date: 2026-09-27
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
linear_issues:
  - https://linear.app/keios/issue/KEI-736/web-recall-practice-phien-luyen-va-cham-djiem
---

# Web Recall Practice (KEI-736)

## Goal Capsule

Ship `/practice/session` as a full-screen client flow: load `GET /api/practice/due`, prompt → answer → grade (Forgot/Hard/Good/Easy) → `POST /api/practice/reviews`. No FSRS in web.

## Implementation Units

- U1: `web/lib/practice/` types, answer matcher, item builder (simplified modes without pattern API).
- U2: `PracticeSession` client component + page wiring.
- U3: Empty/error states (404 chunk, network, empty due → Situations).
- U4: `npm run test`, lint, build.

## Definition of Done

- [x] End-to-end due → grade → next item
- [x] Reviews POST via `lib/api`
- [x] Empty queue exit to Situations; summary returns Today
- [x] lint/build/test pass
