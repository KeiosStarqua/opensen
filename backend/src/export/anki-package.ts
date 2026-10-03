import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { Deck, Note, Notetype, Package } from 'ankipack'
import type { SqlJsStatic } from 'sql.js'
import type { AnkiNote } from './anki-deck-formatter.js'

export const ANKI_PACKAGE_MEDIA_TYPE = 'application/apkg'
export const ANKI_DECK_NAME = 'OpenSen'

const require = createRequire(import.meta.url)

type InitSqlJs = (config?: { wasmBinary?: ArrayBuffer }) => Promise<SqlJsStatic>

const initSqlJs = require('sql.js') as InitSqlJs

let sqlJs: Promise<SqlJsStatic> | undefined

/** sql.js WASM, resolved from the installed package so Node and Vercel both find it. */
export function loadSqlJs(): Promise<SqlJsStatic> {
  sqlJs ??= initSqlJs({
    wasmBinary: readWasm(),
  })
  return sqlJs
}

function readWasm(): ArrayBuffer {
  const bytes = readFileSync(require.resolve('sql.js/dist/sql-wasm.wasm'))
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
}

/** Anki splits tags on spaces. Same slug the text export wrote into the file. */
function ankiTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * Builds one OpenSen deck. Notes keep `noteForChunk` fields: Front is the
 * meaning, Back is the sentence (and frame when present).
 */
export async function buildAnkiPackage(notes: AnkiNote[]): Promise<Uint8Array> {
  const SQL = await loadSqlJs()
  const notetype = Notetype.basic()
  const deck = new Deck({ name: ANKI_DECK_NAME })
  for (const note of notes) {
    deck.addNote(
      new Note({
        notetype,
        fields: [note.front, note.back],
        tags: note.tags.map(ankiTag).filter(Boolean),
      }),
    )
  }
  const pkg = new Package()
  pkg.addDeck(deck)
  return pkg.toUint8Array(SQL)
}
