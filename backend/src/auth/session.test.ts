import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import { authenticate, optionalUserId, requireUserId } from './session.js'
import { InvalidTokenError, type TokenVerifier } from './token-verifier.js'

const USER_ID = '11111111-1111-4111-8111-111111111111'

function buildApp(verifier: TokenVerifier | null) {
  const app = new Hono()
  app.use(authenticate(verifier))
  app.get('/me', (c) => c.json({ userId: requireUserId(c) }))
  app.get('/maybe', (c) => c.json({ userId: optionalUserId(c) }))
  return app
}

const validVerifier: TokenVerifier = async (token) => {
  if (token !== 'good') throw new InvalidTokenError()
  return { userId: USER_ID }
}

describe('authenticate', () => {
  it('resolves the learner from a valid bearer token', async () => {
    const response = await buildApp(validVerifier).request('/me', {
      headers: { authorization: 'Bearer good' },
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ userId: USER_ID })
  })

  it('treats a request without a token as anonymous', async () => {
    const app = buildApp(validVerifier)
    expect((await app.request('/me')).status).toBe(401)
    const maybe = await app.request('/maybe')
    expect(await maybe.json()).toEqual({ userId: null })
  })

  it('rejects an invalid token even on optional routes', async () => {
    const response = await buildApp(validVerifier).request('/maybe', {
      headers: { authorization: 'Bearer bad' },
    })
    expect(response.status).toBe(401)
  })

  it('rejects a non-bearer authorization header', async () => {
    const response = await buildApp(validVerifier).request('/me', {
      headers: { authorization: 'Basic dXNlcjpwYXNz' },
    })
    expect(response.status).toBe(401)
  })

  it('ignores the legacy X-User-Id header', async () => {
    const response = await buildApp(validVerifier).request('/me', {
      headers: { 'x-user-id': USER_ID },
    })
    expect(response.status).toBe(401)
  })

  it('returns 503 when a token arrives but auth is not configured', async () => {
    const response = await buildApp(null).request('/me', {
      headers: { authorization: 'Bearer good' },
    })
    expect(response.status).toBe(503)
  })

  it('keeps anonymous requests working when auth is not configured', async () => {
    const response = await buildApp(null).request('/maybe')
    expect(response.status).toBe(200)
  })

  it('surfaces verifier infrastructure failures as server errors', async () => {
    const verifier = vi.fn(async () => {
      throw new Error('JWKS fetch failed')
    })
    const response = await buildApp(verifier).request('/me', {
      headers: { authorization: 'Bearer good' },
    })
    expect(response.status).toBe(500)
  })
})
