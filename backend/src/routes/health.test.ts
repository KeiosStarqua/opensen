import { describe, expect, it, vi } from 'vitest'
import { createHealthRouter } from './health.js'

describe('health routes', () => {
  it('GET /health is a liveness check with no dependencies', async () => {
    const app = createHealthRouter()
    const response = await app.request('/health')
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.ok).toBe(true)
  })

  it('GET /health/db returns 503 when DATABASE_URL is missing or invalid', async () => {
    const app = createHealthRouter({
      loadDatabaseEnv: () => {
        throw new Error('DATABASE_URL: Required')
      },
    })

    const response = await app.request('/health/db')
    expect(response.status).toBe(503)
    const body = await response.json()
    expect(body.ok).toBe(false)
    expect(body.error).toBe('DATABASE_URL is missing or invalid')
  })

  it('GET /health/db returns 503 when the database query fails', async () => {
    const app = createHealthRouter({
      loadDatabaseEnv: () => ({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
      }),
      getDatabase: () =>
        ({
          execute: vi.fn(async () => {
            throw new Error('connection refused')
          }),
        }) as never,
    })

    const response = await app.request('/health/db')
    expect(response.status).toBe(503)
    const body = await response.json()
    expect(body.ok).toBe(false)
    expect(body.error).toBe('Database query failed')
    expect(body.detail).toContain('connection refused')
  })

  it('GET /health/db returns 200 when the database responds', async () => {
    const app = createHealthRouter({
      loadDatabaseEnv: () => ({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
      }),
      getDatabase: () =>
        ({
          execute: vi.fn(async () => [{ ok: 1 }]),
        }) as never,
    })

    const response = await app.request('/health/db')
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.ok).toBe(true)
  })
})
