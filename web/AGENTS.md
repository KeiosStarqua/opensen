# web/

## Purpose

Next.js **web client** for OpenSen: marketing/landing and the authenticated web application in one App Router project.

## Ownership

- App Router UI under `app/`
- Static assets under `public/`
- Next.js / Vercel web deploy config for this package
- Product behavior lives in [`docs/`](../docs/); this tree owns web UI implementation
- API calls go to [`backend/`](../backend/) — do not reimplement server business logic here

## Local Contracts

- Framework: [Next.js App Router](https://nextjs.org/docs/app) (TypeScript, Tailwind CSS, ESLint)
- Package name: `opensen-web` (see `package.json`)
- Run from this directory: `npm install`, `npm run dev`, `npm run build`, `npm run lint`
- Import alias: `@/*`
- Landing and app share this project; prefer route groups (e.g. `(marketing)`, `(app)`) when splitting surfaces

<!-- BEGIN:nextjs-agent-rules -->
## Next.js guidance

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Work Guidance

- Prefer Server Components by default; add `"use client"` only when needed
- Keep marketing and authenticated app routes separated via route groups as features land

## Verification

- `npm run lint` from `web/`
- `npm run build` from `web/`

## Child DOX Index

_(none)_
