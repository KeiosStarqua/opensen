import { Collection } from 'ankipack'
import { describe, expect, it, vi } from 'vitest'
import { signedInAs } from '../auth/test-support.js'
import { noteForChunk } from '../export/anki-deck-formatter.js'
import { ANKI_PACKAGE_MEDIA_TYPE, loadSqlJs } from '../export/anki-package.js'
import { createExportRouter, type ExportRouteDeps } from './export.js'

const userId = '11111111-1111-4111-8111-111111111111'

const latte = noteForChunk({
  text: 'Could I get a latte?',
  meaning: 'Xin một latte',
  register: 'polite',
  level: 'a2',
  template: 'Could I get a [drink]?',
  situationName: 'Ordering coffee',
})

function router(overrides: ExportRouteDeps = {}) {
  return createExportRouter({
    loadDatabaseEnv: () => undefined,
    getDatabase: () => ({}) as never,
    listNotes: vi.fn(async () => [latte]),
    ...overrides,
  })
}

describe('GET /api/export/anki', () => {
  it('rejects anonymous callers', async () => {
    const response = await router().request('/anki')
    expect(response.status).toBe(401)
  })

  it('rejects an unknown scope', async () => {
    const response = await signedInAs(router(), userId).request('/anki?scope=library')
    expect(response.status).toBe(400)
  })

  it('returns an empty marker when the scope has no notes', async () => {
    const listNotes = vi.fn(async () => [])
    const response = await signedInAs(router({ listNotes }), userId).request(
      '/anki?scope=all',
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    await expect(response.json()).resolves.toEqual({ empty: true, noteCount: 0 })
    expect(listNotes).toHaveBeenCalledWith(expect.anything(), userId, 'all')
  })

  it('returns an apkg built from the scoped notes', async () => {
    const listNotes = vi.fn(async () => [latte])
    const response = await signedInAs(router({ listNotes }), userId).request(
      '/anki?scope=enrolled',
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain(ANKI_PACKAGE_MEDIA_TYPE)
    expect(response.headers.get('content-disposition')).toContain(
      'filename="opensen-anki-enrolled.apkg"',
    )
    expect(listNotes).toHaveBeenCalledWith(expect.anything(), userId, 'enrolled')

    const bytes = new Uint8Array(await response.arrayBuffer())
    const notes = Collection.open(bytes, await loadSqlJs()).notes()
    expect(notes).toHaveLength(1)
    expect(notes[0]?.field('Front')).toBe('Xin một latte')
    expect(notes[0]?.field('Back')).toContain('Could I get a latte?')
    expect(notes[0]?.field('Back')).toContain('Could I get a [drink]?')
    expect(notes[0]?.field('Back')).toContain('Ordering coffee')
    expect(notes[0]?.tags).toEqual(['opensen', 'register::polite', 'level::a2'])
  })
})
