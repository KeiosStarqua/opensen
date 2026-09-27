---
title: Web Onboarding → dialogue → practice (KEI-730)
type: feat
date: 2026-09-27
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
linear_issues:
  - https://linear.app/keios/issue/KEI-730/web-onboarding-dan-vao-hoi-thoai-va-luyen-tap
---

# KEI-730 — minimal plan (session-generated)

Wire onboarding form to `POST /api/dialogues/generate`, show dialogue + chunks, practice CTA via session focus queue when persistence returns `chunkIds`, client onboarding-complete flag.

Definition of Done

- [x] Generate flow via `lib/api`, error handling, practice CTA (persistence chunkIds)
- [x] `npm run test`, lint, build pass
- [ ] Landing/`/today` skip onboarding redirect (defer partial — flag stored; full redirect in KEI-731)
