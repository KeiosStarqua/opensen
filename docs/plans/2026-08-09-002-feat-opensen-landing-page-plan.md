---
title: OpenSen Landing Page - Plan
type: feat
date: 2026-08-09
artifact_contract: ce-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: ce-plan-bootstrap
linear_issues:
  - https://linear.app/keios/issue/KEI-146/web-thiet-ke-landing-page-opensen
---

# OpenSen Landing Page - Plan

## Goal Capsule

- **Objective:** Replace the default Next.js page with a responsive OpenSen marketing page that communicates the speaking-reflex outcome and hands visitors to a usable trial entry point.
- **Authority:** [KEI-146](https://linear.app/keios/issue/KEI-146/web-thiet-ke-landing-page-opensen) and `docs/product-strategy.md`.
- **Execution profile:** Web UI implementation in the existing `web/` Next.js application.
- **Stop condition:** Do not begin implementation until the owner defines the CTA destination or authorizes a minimal public onboarding route in this issue.

---

## Product Contract

### Summary

OpenSen needs a public landing page that sells speaking confidence in real situations, not sentence memorization.
The page must present chunking as the mechanism behind reusable sentence patterns.

### Problem Frame

The only current web route is the unmodified Next.js starter.
It neither represents OpenSen nor gives a visitor a way to begin using the product.

### Requirements

**Positioning and content**

- R1. The landing page must lead with the outcome “Speak without translating in your head” and explain that OpenSen turns real-life situations into reusable sentence patterns.
- R2. The page must use real conversation contexts and a static sentence-frame-plus-slot demonstration to communicate “Learn fewer patterns. Say more things.”
- R3. The page must describe the product as a short path from situation to speaking practice without presenting non-goal features as MVP capabilities.

**Usability and handoff**

- R4. The page must be readable and usable on mobile and desktop viewports.
- R5. A primary CTA and repeated closing CTA must navigate to a usable product trial entry point.
- R6. Public-page metadata must identify OpenSen rather than the default Next.js starter.

### Scope Boundaries

- The landing page will not implement dialogue generation, chunk extraction, practice, review scheduling, authentication, or account management.
- The landing page will stay in the existing `web/` Next.js package; it will not create a separate marketing application.
- The initial page will use English-first copy consistent with the current document language and `html` locale. Localization infrastructure is outside this scope.

### Blocking Question

- Q1. **What concrete destination should the CTA open?** There is no trial, onboarding, or application route in `web/`.
  - **Option A:** Provide the existing external trial URL.
  - **Option B:** Expand KEI-146 to include a minimal public `/onboarding` entry route.
  - **Option C:** Make the CTA dependency explicit and implement it after the owning application-entry issue provides an internal route.
  - **Why it blocks:** A link cannot meet R5 when its target does not exist.

### Sources

- `docs/product-strategy.md` defines positioning, canonical landing copy, the situation-to-speaking learning loop, and MVP non-goals.
- `docs/solutions/architecture-patterns/single-nextjs-landing-and-app.md` requires one App Router package and route-group separation when marketing and product surfaces diverge.
- `web/AGENTS.md` defines the Next.js, Tailwind, responsive, and verification constraints.

