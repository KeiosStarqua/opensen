import { Collection } from 'ankipack'
import { describe, expect, it } from 'vitest'
import { noteForChunk } from './anki-deck-formatter.js'
import { ANKI_DECK_NAME, buildAnkiPackage, loadSqlJs } from './anki-package.js'

describe('anki package', () => {
  it('opens as an apkg whose notes keep the chunk contract', async () => {
    const source = noteForChunk({
      text: 'Could I get a latte?',
      meaning: 'Xin một latte',
      register: 'polite',
      level: 'A2',
      template: 'Could I get a [drink]?',
      situationName: 'Ordering coffee',
    })

    const bytes = await buildAnkiPackage([source])
    const collection = Collection.open(bytes, await loadSqlJs())

    expect(collection.deckNames()).toContain(ANKI_DECK_NAME)
    const notes = collection.notes({ deck: ANKI_DECK_NAME })
    expect(notes).toHaveLength(1)
    expect(notes[0]?.field('Front')).toBe('Xin một latte')
    expect(notes[0]?.field('Back')).toContain('Could I get a latte?')
    expect(notes[0]?.field('Back')).toContain('Could I get a [drink]?')
    expect(notes[0]?.field('Back')).toContain('Ordering coffee')
    expect(notes[0]?.tags).toEqual(['opensen', 'register::polite', 'level::a2'])
  })
})
