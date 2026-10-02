import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const ORIGIN = 'http://localhost:8080'

describe('CORS', () => {
  let app: typeof import('./index.js').default

  beforeAll(async () => {
    vi.stubEnv('CORS_ORIGINS', ORIGIN)
    vi.resetModules()
    app = (await import('./index.js')).default
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  it.each(['/health', '/health/db', '/api/situations'])(
    'answers preflight for %s from an allowed origin',
    async (path) => {
      const res = await app.request(path, {
        method: 'OPTIONS',
        headers: {
          Origin: ORIGIN,
          'Access-Control-Request-Method': 'GET',
        },
      })
      expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN)
    },
  )

  it('allows the bearer header, drops X-User-Id, and caches preflights', async () => {
    const res = await app.request('/api/practice/due', {
      method: 'OPTIONS',
      headers: {
        Origin: ORIGIN,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization',
      },
    })
    const allowed = res.headers.get('access-control-allow-headers')?.toLowerCase()
    expect(allowed).toContain('authorization')
    expect(allowed).not.toContain('x-user-id')
    expect(res.headers.get('access-control-max-age')).toBe('7200')
  })

  it('keeps CORS headers on a 401 so the browser can read it', async () => {
    const res = await app.request('/api/practice/due', {
      headers: { Origin: ORIGIN },
    })
    expect(res.status).toBe(401)
    expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN)
  })

  it('sets the allow-origin header on a plain /health GET', async () => {
    const res = await app.request('/health', { headers: { Origin: ORIGIN } })
    expect(res.status).toBe(200)
    expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN)
  })

  it('does not echo unknown origins', async () => {
    const res = await app.request('/health', {
      headers: { Origin: 'https://evil.example' },
    })
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })
})
