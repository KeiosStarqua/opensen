import { createHash } from 'node:crypto'

const NAMESPACE = 'opensen-seed-v1'

/** Stable UUID for authored seed ids (`sit_*`, `pat_*`, …). */
export function uuidFromSeed(kind: string, authoredId: string): string {
  const hash = createHash('sha256')
    .update(`${NAMESPACE}:${kind}:${authoredId}`)
    .digest('hex')
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `${((Number.parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0')}${hash.slice(18, 20)}`,
    hash.slice(20, 32),
  ].join('-')
}
