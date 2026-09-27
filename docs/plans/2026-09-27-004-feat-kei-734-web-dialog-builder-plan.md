---
title: Web Dialog Builder và màn hội thoại (KEI-734)
type: feat
date: 2026-09-27
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
linear_issues:
  - https://linear.app/keios/issue/KEI-734/web-dialog-builder-va-man-hoi-thoai
---

# KEI-734

Backend: `dialogues-repository` for GET list/detail; wire `dialogues` routes when persistence enabled; enroll chunks on generate via `X-User-Id`. Web: `/situations/[id]/build` form + generate; `/dialogues/[id]` detail with chunk links; practice CTA via focus queue.

## Definition of Done

- [ ] Build from situation, generate + view saved dialogue
- [ ] GET dialogues API + enroll on generate
- [ ] backend typecheck/test; web lint/build/test
