# OpenSen Documentation

OpenSen (Open Sentence) turns conversations a learner actually needs into sentence patterns they can speak automatically. Under the hood it uses the **chunking method**: whole sentences and pre-assembled phrases with swappable slots, retrieved automatically rather than constructed word-by-word.

## Contents

| Document | Description |
|----------|-------------|
| [Product strategy](product-strategy.md) | Positioning, core loop, MVP scope, non-goals, metrics, roadmap |
| [Product overview](product.md) | Learning model and target outcomes |
| [Features](features.md) | Product capabilities and how they fit together |
| [Mobile UI/UX design](mobile-ui-design.md) | Mobile design contract: UX architecture, design system, screen specs, Flutter blueprint |
| [Database architecture](database-architecture.md) | Content graph + learning engine schema (MVP tables) |

## Repository layout

| Path | Role |
|------|------|
| [`mobile/`](../mobile/) | Flutter mobile app (primary client; offline-first v1) |
| [`backend/`](../backend/) | Hono API on Vercel |
| [`docs/`](.) | Product and project documentation |
