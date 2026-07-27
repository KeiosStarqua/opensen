# ai/

## Purpose

Owns the **AI provider layer** and **dialogue generation pipeline** for the OpenSen backend. Route handlers stay provider-agnostic; this tree selects and calls models.

## Ownership

- Provider interface and factory (`types.ts`, `create-provider.ts`)
- Concrete providers under `providers/` (OpenRouter first; add OpenAI/Anthropic/Gemini as siblings)
- Multi-step generate pipeline under `pipeline/` (normalize → dialogue → chunks)
- Product contracts for what to generate live in [`docs/product-strategy.md`](../../docs/product-strategy.md)

## Local Contracts

- `AI_PROVIDER` selects the implementation; default `openrouter`
- `AI_MODEL` is the model id for that provider (OpenRouter: e.g. `openai/gpt-4o-mini`)
- Every model call that produces domain data must return JSON validated with Zod on the backend
- Do not put provider-specific HTTP details in route handlers — only `createAiProvider(env)` + pipeline functions
- New providers: implement `AiProvider` in `providers/<name>.ts`, extend `AiProviderId` + env schema + `createAiProvider` switch

## Work Guidance

- Prefer short multi-step calls over one mega-prompt
- Keep prompts language-agnostic via request `nativeLanguage` / `targetLanguage` (Chinese crash MVP uses `vi` → `zh`)

## Verification

- `npm run typecheck` from `backend/`

## Child DOX Index

No nested AGENTS.md yet.
