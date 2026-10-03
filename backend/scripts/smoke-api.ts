#!/usr/bin/env tsx
/**
 * Live API smoke test: signs in through Neon Auth, then exercises the public
 * and signed-in routes of a deployed OpenSen API.
 *
 *   OPENSEN_TEST_EMAIL=… OPENSEN_TEST_PASSWORD=… npm run smoke:api
 *
 * Options:
 *   --base-url <url>  API host (env OPENSEN_API_URL, default production)
 *   --sign-up         create the account when sign-in is rejected
 *   --write           also run mutating checks (saves one sentence; no delete route exists)
 *
 * Auth URL: NEON_AUTH_BASE_URL from the shell, backend/.env.local, backend/.env,
 * or web/.env.local. Sign-in sends Origin OPENSEN_WEB_ORIGIN (default the production
 * web app), which Neon Auth requires. Credentials come from the environment only, never argv.
 * Tokens and passwords are never printed. Exit code is 1 when any check fails.
 */
import { config } from 'dotenv'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

const DEFAULT_API_URL = 'https://api.opensen.taquangkhoi.com'
// Neon Auth rejects requests without a trusted Origin (403 "Missing or null Origin").
const DEFAULT_WEB_ORIGIN = 'https://opensen.taquangkhoi.com'

type Fetch = (path: string, init?: RequestInit) => Promise<Response>
type Check = { name: string; run: () => Promise<string | void> }

function loadEnv(): void {
  const backend = process.cwd()
  config({
    path: [
      join(backend, '.env.local'),
      join(backend, '.env'),
      join(backend, '..', 'web', '.env.local'),
    ],
    quiet: true,
  })
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}

const isJwt = (token: string) => token.split('.').length === 3

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message
    if (typeof message === 'string') return message
  }
  return fallback
}

/** Sign in (or up) with email + password and return the JWT the API accepts. */
async function authenticate(
  authBase: string,
  email: string,
  password: string,
  allowSignUp: boolean,
): Promise<string> {
  const base = authBase.replace(/\/+$/, '')
  const origin = process.env.OPENSEN_WEB_ORIGIN?.trim() || DEFAULT_WEB_ORIGIN
  const post = (path: string, payload: Record<string, string>) =>
    fetch(`${base}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: origin,
      },
      body: JSON.stringify(payload),
    })

  let response = await post('sign-in/email', { email, password })
  if (!response.ok && allowSignUp) {
    console.log('sign-in rejected, trying sign-up (--sign-up)')
    response = await post('sign-up/email', {
      email,
      password,
      name: email.split('@')[0] ?? 'smoke',
    })
  }

  const body = await readJson(response)
  if (!response.ok) {
    throw new Error(
      `Auth ${response.status}: ${errorMessage(body, 'could not sign in')}`,
    )
  }

  // Neon Auth sets a session cookie; /get-session answers with the API JWT in
  // the `set-auth-jwt` header (the same exchange the web SDK performs).
  const cookie = response.headers
    .getSetCookie()
    .map((entry) => entry.split(';')[0])
    .join('; ')
  if (!cookie) throw new Error('Sign-in succeeded but set no session cookie')

  const session = await fetch(`${base}/get-session`, {
    headers: { Cookie: cookie, Accept: 'application/json', Origin: origin },
  })
  const jwt = session.headers.get('set-auth-jwt')
  if (!session.ok || !jwt || !isJwt(jwt)) {
    throw new Error(`Could not obtain a JWT from /get-session (${session.status})`)
  }
  return jwt
}

function expectStatus(response: Response, ...allowed: number[]): void {
  if (!allowed.includes(response.status)) {
    throw new Error(`expected ${allowed.join('/')}, got ${response.status}`)
  }
}

async function expectItems(response: Response): Promise<unknown[]> {
  expectStatus(response, 200)
  const body = (await readJson(response)) as { items?: unknown } | null
  if (!body || !Array.isArray(body.items)) throw new Error('response has no items[]')
  return body.items
}

function buildChecks(api: Fetch, authed: Fetch, write: boolean): Check[] {
  const checks: Check[] = [
    {
      name: 'GET /health',
      run: async () => {
        const response = await api('/health')
        expectStatus(response, 200)
        const body = (await readJson(response)) as { ok?: boolean } | null
        if (!body?.ok) throw new Error('ok is not true')
      },
    },
    {
      name: 'GET /health/db',
      run: async () => expectStatus(await api('/health/db'), 200),
    },
    {
      name: 'GET /openapi.json',
      run: async () => expectStatus(await api('/openapi.json'), 200),
    },
    {
      name: 'GET /api/situations',
      run: async () => {
        const items = await expectItems(await api('/api/situations'))
        if (items.length === 0) throw new Error('no situations (catalog not seeded?)')
        const first = items[0] as { id?: string }
        if (!first.id) throw new Error('situation has no id')
        const detail = await api(`/api/situations/${first.id}`)
        expectStatus(detail, 200)
        return `${items.length} situations`
      },
    },
    {
      name: 'GET /api/chunks (anonymous)',
      run: async () => `${(await expectItems(await api('/api/chunks'))).length} chunks`,
    },
    {
      name: 'GET /api/practice/due without token -> 401',
      run: async () => expectStatus(await api('/api/practice/due'), 401),
    },
    {
      name: 'GET /api/practice/due with garbage token -> 401',
      run: async () =>
        expectStatus(
          await api('/api/practice/due', {
            headers: { Authorization: 'Bearer not-a-real-token' },
          }),
          401,
        ),
    },
    {
      name: 'GET /api/onboarding',
      run: async () => expectStatus(await authed('/api/onboarding'), 200),
    },
    {
      name: 'GET /api/chunks (signed in)',
      run: async () => `${(await expectItems(await authed('/api/chunks'))).length} chunks`,
    },
    {
      name: 'GET /api/practice/due',
      run: async () => expectStatus(await authed('/api/practice/due'), 200),
    },
    {
      name: 'GET /api/practice/plan',
      run: async () => expectStatus(await authed('/api/practice/plan'), 200),
    },
    {
      name: 'GET /api/saved-sentences',
      run: async () =>
        `${(await expectItems(await authed('/api/saved-sentences'))).length} saved`,
    },
    {
      name: 'GET /api/export/anki',
      run: async () => {
        const response = await authed('/api/export/anki')
        expectStatus(response, 200)
        // Empty scope returns JSON { empty: true }; otherwise an .apkg binary.
        await response.arrayBuffer()
      },
    },
  ]

  if (write) {
    checks.push({
      name: 'POST /api/saved-sentences (+ read back)',
      run: async () => {
        const text = `Smoke test sentence ${new Date().toISOString()}`
        const created = await authed('/api/saved-sentences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })
        expectStatus(created, 201)
        const saved = (await readJson(created)) as { id?: string; text?: string } | null
        if (!saved?.id || saved.text !== text) throw new Error('saved sentence mismatch')
        const detail = await authed(`/api/saved-sentences/${saved.id}`)
        expectStatus(detail, 200)
      },
    })
  }

  return checks
}

async function main(): Promise<void> {
  loadEnv()
  const { values } = parseArgs({
    options: {
      'base-url': { type: 'string' },
      'sign-up': { type: 'boolean', default: false },
      write: { type: 'boolean', default: false },
    },
  })

  const apiBase = (values['base-url'] ?? process.env.OPENSEN_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, '')
  const email = requireEnv('OPENSEN_TEST_EMAIL')
  const password = requireEnv('OPENSEN_TEST_PASSWORD')
  const authBase = requireEnv('NEON_AUTH_BASE_URL')

  console.log(`API:  ${apiBase}`)
  console.log(`Auth: ${authBase}`)
  console.log(`User: ${email}\n`)

  const token = await authenticate(authBase, email, password, values['sign-up'])
  console.log('signed in, JWT acquired\n')

  const api: Fetch = (path, init) => fetch(`${apiBase}${path}`, init)
  const authed: Fetch = (path, init) =>
    fetch(`${apiBase}${path}`, {
      ...init,
      headers: { ...init?.headers, Authorization: `Bearer ${token}` },
    })

  let failed = 0
  for (const check of buildChecks(api, authed, values.write)) {
    const started = Date.now()
    try {
      const detail = await check.run()
      console.log(`PASS  ${check.name}${detail ? ` (${detail})` : ''}  ${Date.now() - started}ms`)
    } catch (error) {
      failed += 1
      const message = error instanceof Error ? error.message : String(error)
      console.log(`FAIL  ${check.name}: ${message}`)
    }
  }

  console.log(failed === 0 ? '\nAll checks passed.' : `\n${failed} check(s) failed.`)
  process.exitCode = failed === 0 ? 0 : 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
