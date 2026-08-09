---
title: Manage Environment Secrets with Doppler and Vercel Integration
date: 2026-08-09
category: architecture-patterns
module: development_workflow
problem_type: architecture_pattern
component: development_workflow
severity: medium
applies_when:
  - "Managing environment variables across local development and Vercel deployments"
  - "Integrating Doppler as single source of truth for secrets with Next.js or Hono apps"
tags:
  - doppler
  - vercel
  - secrets
  - environment-variables
  - local-dev
  - ci-cd
resolution_type: environment_setup
---

# Manage Environment Secrets with Doppler and Vercel Integration

## Context

Managing environment variables manually across local development, preview environments, and production deployments often leads to secret drift, missing keys in deployments, and unsafe local `.env` file handling.

To keep secrets synchronized, secure, and audited across team members and cloud environments, **Doppler** serves as the central secret store (Single Source of Truth), while **Vercel** receives automatic copies for build and runtime environments.

## Guidance

Use **Doppler** as the single source of truth for secrets, mapped to **Vercel Environment Variables** via Doppler's official Vercel Integration.

### Core Architecture

```text
                 ┌──────────────┐
                 │   Doppler    │
                 │              │
                 │ dev stg prd  │
                 └──────┬───────┘
                        │
            ┌───────────┴────────────┐
            │                        │
        Local Dev                 Vercel
            │                        │
      doppler run            Doppler Integration
            │                        │
         Bun/Node          Dev / Preview / Prod
```

1. **Do not run Doppler CLI inside Vercel**. Vercel receives synced environment variables directly from Doppler via official webhook/API integration.
2. **Environment Mapping**:
   - `Doppler dev` → `Vercel Development`
   - `Doppler stg` → `Vercel Preview`
   - `Doppler prd` → `Vercel Production`
3. **Local Development**: Use `doppler run -- <command>` to inject secrets directly into process memory without persisting static `.env` files to disk.
4. **Runtime Access**: Standard `process.env.VARIABLE_NAME` in Next.js or Hono code without requiring Doppler SDK wrappers at runtime.

## Why This Matters

- **Single Source of Truth**: Prevents config drift where half the secrets live in Vercel and half in local `.env` files.
- **No Token Overhead in Cloud**: Eliminates the need to inject `DOPPLER_TOKEN` or run `doppler run` wrappers during Vercel builds or runtime functions.
- **Zero Local `.env` Files**: Secret values are injected on-the-fly in local processes, removing the risk of accidentally committing secrets to git.
- **Automatic Sync**: Key additions or updates in Doppler propagate instantly to Vercel's environment settings.

## When to Apply

- Setting up environment secrets for new or existing projects hosted on Vercel (`web/`, `backend/`).
- Onboarding team members to local development without sharing `.env` files over chat or email.
- Managing multi-environment configurations (`dev`, `stg`, `prd` / `Development`, `Preview`, `Production`).

## Examples

### 1. Initial Integration Setup

In Doppler Dashboard:
1. Navigate to your project → **Integrations** → **Vercel** → **Authorize Vercel**.
2. Select the target Vercel project.
3. Map Doppler configs to Vercel environments:
   - `dev` → `Development`
   - `stg` → `Preview`
   - `prd` → `Production`

### 2. Local Development Workflow

First time setup:
```bash
doppler login
doppler setup
```

Run local dev server with injected secrets (no `.env` file needed):
```bash
# Node / npm
doppler run -- npm run dev

# Bun
doppler run -- bun dev

# Vite
doppler run -- vite build
```

### 3. Application Code Access

Application code accesses environment variables using standard runtime APIs:

```typescript
// Standard process.env access in Next.js or Node/Hono runtime
const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
const openAiKey = process.env.OPENAI_API_KEY;
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
```

### 4. Vercel Deployment & Secrets Lifecycle

When git commits are pushed:
```text
git push → Vercel detects commit → Vercel build (using synced Doppler env vars)
```

> **Important Note on Vercel Redeployment**: When secrets are updated in Doppler and synced to Vercel, active or existing deployments do not automatically re-read new environment variables. You must trigger a redeploy on Vercel for the new secret values to take effect in running serverless functions.

## Related

- [`docs/solutions/tooling-decisions/hono-vercel-over-nestjs.md`](../tooling-decisions/hono-vercel-over-nestjs.md) — API host choice (Hono on Vercel)
- [`docs/solutions/architecture-patterns/single-nextjs-landing-and-app.md`](single-nextjs-landing-and-app.md) — Web host choice (One Next.js app)
- [Doppler Vercel Integration Documentation](https://docs.doppler.com/docs/vercel)
- [Doppler Branch Configs](https://docs.doppler.com/docs/branch-configs)
- [Vercel Managing Environment Variables](https://vercel.com/docs/environment-variables/managing-environment-variables)
