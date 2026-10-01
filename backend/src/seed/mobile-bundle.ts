import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export type MobileSeedBundle = {
  version: number
  intents: Array<{ id: string; name: string; description: string }>
  situations: Array<{
    id: string
    name: string
    description: string
    category: string
    roleSelf: string
    roleOther: string
    goal: string
    tone: string
    level: string
  }>
  patterns: Array<{
    id: string
    template: string
    meaning: string
    difficulty: number
    level: string
    register: 'casual' | 'neutral' | 'polite' | 'formal'
    intents: string[]
    situations: string[]
    slots: Array<{
      name: string
      expectedPos: string
      variants: Array<{ text: string; meaning?: string }>
    }>
  }>
  chunks: Array<{
    id: string
    text: string
    meaning: string
    /** Omitted on pattern-derived chunks; inherited from the pattern. */
    level?: string
    register?: 'casual' | 'neutral' | 'polite' | 'formal'
    patternId?: string
    situationId?: string
    type?: string
  }>
  dialogues: Array<{
    id: string
    situationId: string
    title: string
    level: string
    lines: Array<{
      speaker: 'self' | 'other'
      text: string
      chunkIds?: string[]
    }>
  }>
}

export function loadMobileSeedBundle(
  repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../..',
  ),
): MobileSeedBundle {
  const filePath = path.join(repoRoot, 'mobile/assets/seed/content.json')
  const raw = readFileSync(filePath, 'utf8')
  return JSON.parse(raw) as MobileSeedBundle
}
