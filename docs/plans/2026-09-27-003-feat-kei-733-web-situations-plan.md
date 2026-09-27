---
title: Web Situations catalog và chi tiết (KEI-733)
type: feat
date: 2026-09-27
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
linear_issues:
  - https://linear.app/keios/issue/KEI-733/web-situations-catalog-va-chi-tiet
---

# KEI-733

Backend: situations repository + routes reading Postgres; `scripts/seed-mobile-catalog.ts` imports `mobile/assets/seed/content.json` (owner runs manually). Web: `/situations` list + `/situations/[id]` detail with build link.

Definition of Done: API list/detail/intents, web UI, typecheck/test backend, web lint/build; seed script documented via Linear hand-run issue.
