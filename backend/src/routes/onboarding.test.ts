import { describe, expect, it } from 'vitest'
import { signedInAs } from '../auth/test-support.js'
import type {
  OnboardingRepository,
  OnboardingStatus,
} from '../db/onboarding-repository.js'
import { createOnboardingRouter } from './onboarding.js'

const LEARNER_A = '11111111-1111-4111-8111-111111111111'
const LEARNER_B = '22222222-2222-4222-8222-222222222222'

function memoryStore(): OnboardingRepository & {
  byUser: Map<string, boolean>
} {
  const byUser = new Map<string, boolean>()
  return {
    byUser,
    async get(userId): Promise<OnboardingStatus> {
      return { complete: byUser.get(userId) === true }
    },
    async set(userId, complete): Promise<OnboardingStatus> {
      byUser.set(userId, complete)
      return { complete }
    },
  }
}

function appFor(userId: string, store: OnboardingRepository) {
  return signedInAs(
    createOnboardingRouter({
      getDatabase: () => ({}) as never,
      loadDatabaseEnv: () => ({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
      }),
      createRepository: () => store,
    }),
    userId,
  )
}

describe('onboarding status', () => {
  it('rejects an anonymous read', async () => {
    const app = createOnboardingRouter({
      loadDatabaseEnv: () => ({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
      }),
    })
    const response = await app.request('/')
    expect(response.status).toBe(401)
  })

  it('treats a learner with no row as not finished', async () => {
    const store = memoryStore()
    const response = await appFor(LEARNER_A, store).request('/')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ complete: false })
  })

  it('records completion on the signed-in account', async () => {
    const store = memoryStore()
    const app = appFor(LEARNER_A, store)
    const saved = await app.request('/', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ complete: true }),
    })
    expect(saved.status).toBe(200)
    expect(await saved.json()).toEqual({ complete: true })
    expect(store.byUser.get(LEARNER_A)).toBe(true)

    const read = await app.request('/')
    expect(await read.json()).toEqual({ complete: true })
  })

  it('does not mark another learner complete', async () => {
    const store = memoryStore()
    await appFor(LEARNER_A, store).request('/', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ complete: true }),
    })

    const other = await appFor(LEARNER_B, store).request('/')
    expect(await other.json()).toEqual({ complete: false })
  })

  it('clears completion so the learner can redo the wizard', async () => {
    const store = memoryStore()
    const app = appFor(LEARNER_A, store)
    await store.set(LEARNER_A, true)
    const response = await app.request('/', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ complete: false }),
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ complete: false })
  })

  it('rejects a body that is not a boolean', async () => {
    const store = memoryStore()
    const response = await appFor(LEARNER_A, store).request('/', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ complete: 'yes' }),
    })
    expect(response.status).toBe(400)
    expect(store.byUser.size).toBe(0)
  })
})
