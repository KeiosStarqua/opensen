import { describe, expect, it, vi } from 'vitest'
import { signedInAs } from '../auth/test-support.js'
import type { SavedSentence, SavedSentencesRepository } from '../db/saved-sentences-repository.js'
import { createSavedSentencesRouter } from './saved-sentences.js'

const LEARNER_A = '11111111-1111-4111-8111-111111111111'
const LEARNER_B = '22222222-2222-4222-8222-222222222222'

function memoryStore(): SavedSentencesRepository & {
  rows: Array<SavedSentence & { ownerId: string }>
} {
  const rows: Array<SavedSentence & { ownerId: string }> = []
  return {
    rows,
    async create(ownerId, text) {
      const sentence = {
        id: `id-${rows.length + 1}`,
        text,
        createdAt: new Date(Date.UTC(2026, 9, 3, 12, rows.length)).toISOString(),
        ownerId,
      }
      rows.push(sentence)
      return { id: sentence.id, text: sentence.text, createdAt: sentence.createdAt }
    },
    async list(ownerId) {
      return rows
        .filter((row) => row.ownerId === ownerId)
        .map(({ id, text, createdAt }) => ({ id, text, createdAt }))
        .reverse()
    },
    async getById(ownerId, id) {
      const row = rows.find((item) => item.id === id && item.ownerId === ownerId)
      return row
        ? { id: row.id, text: row.text, createdAt: row.createdAt }
        : null
    },
    async update(ownerId, id, text) {
      const row = rows.find((item) => item.id === id && item.ownerId === ownerId)
      if (!row) return null
      row.text = text
      return { id: row.id, text: row.text, createdAt: row.createdAt }
    },
  }
}

function appFor(userId: string, store: SavedSentencesRepository) {
  return signedInAs(
    createSavedSentencesRouter({
      getDatabase: () => ({}) as never,
      loadDatabaseEnv: () => ({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
      }),
      createRepository: () => store,
    }),
    userId,
  )
}

describe('saved sentences', () => {
  it('rejects anonymous saves', async () => {
    const app = createSavedSentencesRouter({
      loadDatabaseEnv: () => ({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen_test',
      }),
    })
    const response = await app.request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Could you say that again?' }),
    })
    expect(response.status).toBe(401)
  })

  it('saves a sentence the catalog does not need to contain', async () => {
    const store = memoryStore()
    const response = await appFor(LEARNER_A, store).request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '  Could you say that again?  ' }),
    })
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.text).toBe('Could you say that again?')
    expect(body.id).toBe('id-1')
  })

  it('rejects an empty sentence', async () => {
    const store = memoryStore()
    const response = await appFor(LEARNER_A, store).request('/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '   ' }),
    })
    expect(response.status).toBe(400)
    expect(store.rows).toHaveLength(0)
  })

  it('lists only the signed-in learner’s sentences', async () => {
    const store = memoryStore()
    await store.create(LEARNER_A, 'Mine')
    await store.create(LEARNER_B, 'Theirs')

    const response = await appFor(LEARNER_A, store).request('/')
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.items.map((item: { text: string }) => item.text)).toEqual(['Mine'])
  })

  it('hides another learner’s sentence on detail', async () => {
    const store = memoryStore()
    const theirs = await store.create(LEARNER_B, 'Theirs')
    const response = await appFor(LEARNER_A, store).request(`/${theirs.id}`)
    expect(response.status).toBe(404)
  })

  it('returns the owner’s sentence so a study step can open it', async () => {
    const store = memoryStore()
    const mine = await store.create(LEARNER_A, 'Could you say that again?')
    const response = await appFor(LEARNER_A, store).request(`/${mine.id}`)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      id: mine.id,
      text: 'Could you say that again?',
    })
  })

  it('does not call the database env loader before auth fails', async () => {
    const loadDatabaseEnv = vi.fn()
    const app = createSavedSentencesRouter({ loadDatabaseEnv })
    const response = await app.request('/')
    expect(response.status).toBe(401)
    expect(loadDatabaseEnv).not.toHaveBeenCalled()
  })

  it('replaces the owner’s sentence so list and study use the new text', async () => {
    const store = memoryStore()
    const mine = await store.create(LEARNER_A, 'Could you say that again?')
    const response = await appFor(LEARNER_A, store).request(`/${mine.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '  Could you repeat that?  ' }),
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      id: mine.id,
      text: 'Could you repeat that?',
    })

    const listed = await appFor(LEARNER_A, store).request('/')
    const body = await listed.json()
    expect(body.items.map((item: { text: string }) => item.text)).toEqual([
      'Could you repeat that?',
    ])
    const detail = await appFor(LEARNER_A, store).request(`/${mine.id}`)
    expect(await detail.json()).toMatchObject({ text: 'Could you repeat that?' })
  })

  it('rejects an empty edit and leaves the saved text', async () => {
    const store = memoryStore()
    const mine = await store.create(LEARNER_A, 'Could you say that again?')
    const response = await appFor(LEARNER_A, store).request(`/${mine.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '   ' }),
    })
    expect(response.status).toBe(400)
    expect(store.rows[0]?.text).toBe('Could you say that again?')
  })

  it('rejects an edit from another learner', async () => {
    const store = memoryStore()
    const theirs = await store.create(LEARNER_B, 'Theirs')
    const response = await appFor(LEARNER_A, store).request(`/${theirs.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Stolen' }),
    })
    expect(response.status).toBe(404)
    expect(store.rows[0]?.text).toBe('Theirs')
  })

  it('rejects an anonymous edit before touching the database', async () => {
    const loadDatabaseEnv = vi.fn()
    const app = createSavedSentencesRouter({ loadDatabaseEnv })
    const response = await app.request('/id-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Could you repeat that?' }),
    })
    expect(response.status).toBe(401)
    expect(loadDatabaseEnv).not.toHaveBeenCalled()
  })
})
