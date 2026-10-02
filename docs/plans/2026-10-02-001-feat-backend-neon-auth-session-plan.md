---
linear_issues:
  - https://linear.app/keios/issue/KEI-931/backend-xac-minh-phien-neon-auth-jwt-thay-cho-header-x-user-id
---

# KEI-931

Backend verifies Neon Auth session JWTs instead of trusting the client-supplied `X-User-Id` header. Web sends `Authorization: Bearer <jwt>` from the Neon Auth session.

## Approach

- `backend/src/auth/`: `TokenVerifier` seam with a Neon Auth implementation (`jose`, remote JWKS at `${NEON_AUTH_BASE_URL}/.well-known/jwks.json`, EdDSA, `iss`/`aud` = Neon Auth origin, `sub` must be a UUID). One Hono middleware on `/api/*` resolves the identity; routes read it through `requireUserId` / `optionalUserId`.
- No token: public routes run anonymously, user-scoped routes return 401. Bad or expired token: 401. Token present but `NEON_AUTH_BASE_URL` unset: 503.
- Remove `X-User-Id` from CORS and OpenAPI (`bearerAuth` security scheme). Cache preflights with `Access-Control-Max-Age`.
- Ensure the `users` row exists before a learner creates a chunk (`owner_id` FK).
- Web `lib/api/` reads the token from `authClient.getSession()`; the `localStorage` learner id is removed.

## Out of scope

- Migrating data owned by old `localStorage` learner ids.
- Mobile sign-in (mobile only calls public endpoints today).

## Definition of Done

- [ ] Backend verifier + middleware with unit tests (valid, missing, malformed, expired, wrong issuer, unconfigured)
- [ ] User-scoped routes use the verified identity; `X-User-Id` removed from backend, CORS, OpenAPI
- [ ] Chunk create ensures the learner row
- [ ] Web sends Bearer token; learner-id helper removed
- [ ] AGENTS.md, `.env.example`, docs updated
- [ ] backend `typecheck` + `test`; web `lint` + `test` + `build`
- [ ] `NEON_AUTH_BASE_URL` set on Vercel project `opensen-api`
