import { describe, expect, it } from 'vitest'
import { formatAnkiDeck, noteForChunk } from './anki-deck-formatter.js'

describe('anki deck formatter', () => {
  it('formats header and tab-separated rows', () => {
    const deck = formatAnkiDeck([
      { front: 'Chào', back: '<b>Hello</b>', tags: ['opensen'] },
    ])
    expect(deck).toContain('#separator:tab')
    expect(deck).toContain('Chào\t<b>Hello</b>\topensen')
  })

  it('builds note from chunk', () => {
    const note = noteForChunk({
      text: 'Hello',
      meaning: 'Chào',
      register: 'neutral',
      level: 'a1',
    })
    expect(note.front).toBe('Chào')
    expect(note.back).toContain('Hello')
  })
})
