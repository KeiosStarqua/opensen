# docs/

## Purpose

Owns durable **product and project documentation** for OpenSen: positioning, learning model, feature contracts, data architecture, and doc index. Not runtime code or app implementation guides unless they belong in product scope.

## Ownership

- Positioning, scope boundaries, metrics, and roadmap live in [`product-strategy.md`](product-strategy.md)
- Learning model and feature descriptions live in [`product.md`](product.md) and [`features.md`](features.md)
- Data model and content-graph architecture contracts live in [`database-architecture.md`](database-architecture.md)
- Documented solutions to past problems (architecture decisions, tooling, patterns) live in [`solutions/`](solutions/), organized by category with YAML frontmatter
- Repository entry [`README.md`](../README.md) stays short and links here for depth
- Root [`AGENTS.md`](../AGENTS.md) holds repo-wide DOX rules and the top-level Child DOX Index

## Local Contracts

- English for product-facing docs unless a localized doc is explicitly requested
- Keep docs operational: stable contracts and current feature names, not implementation diaries
- New product capabilities get a section in `features.md` and a line in `README.md` contents table when they become durable scope
- `product-strategy.md` is the tie-breaker on scope: if another doc describes something listed there as a non-goal, fix the other doc
- Describe chunking as the mechanism; user-facing copy leads with the speaking outcome, not the method
- Schema changes that affect slots, practice attempts, or scheduling state must stay consistent with the strategy commitments recorded at the top of `database-architecture.md`

## Work Guidance

## Verification

## Child DOX Index

| Path | Scope |
|------|-------|
| [`README.md`](README.md) | Doc index and repo layout pointer |
| [`product-strategy.md`](product-strategy.md) | Positioning, core loop, MVP scope, non-goals, metrics, roadmap |
| [`product.md`](product.md) | Learning model and chunking rationale |
| [`features.md`](features.md) | Feature catalog and relationships |
| [`mobile-ui-design.md`](mobile-ui-design.md) | Mobile UI/UX design contract: navigation, design tokens, screen specs, Flutter blueprint |
| [`database-architecture.md`](database-architecture.md) | Content graph + learning engine data model |
| [`solutions/`](solutions/) | Documented solutions to past problems (architecture patterns, tooling decisions) |
