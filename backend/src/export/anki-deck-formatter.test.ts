import { describe, expect, it } from 'vitest'
import { noteForChunk } from './anki-deck-formatter.js'

describe('anki note contract', () => {
  it('puts meaning on the front and the sentence on the back', () => {
    const note = noteForChunk({
      text: 'Hello',
      meaning: 'Chào',
      register: 'neutral',
      level: 'a1',
    })
    expect(note.front).toBe('Chào')
    expect(note.back).toContain('Hello')
    expect(note.tags).toEqual(['opensen', 'register::neutral', 'level::a1'])
  })

  it('adds the frame and situation to the back when the chunk has them', () => {
    const note = noteForChunk({
      text: 'Could I get a latte?',
      meaning: 'Xin một latte',
      register: 'polite',
      level: 'a2',
      template: 'Could I get a [drink]?',
      situationName: 'Ordering coffee',
    })
    expect(note.back).toContain('Frame:')
    expect(note.back).toContain('Could I get a [drink]?')
    expect(note.back).toContain('Ordering coffee')
    expect(note.tags).not.toContain('ordering_coffee')
  })
})
