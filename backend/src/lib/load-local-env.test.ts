import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { loadLocalEnv } from './load-local-env.js'

const KEY = 'OPENSEN_LOAD_LOCAL_ENV_TEST'
const ONLY_ENV = 'OPENSEN_LOAD_LOCAL_ENV_ONLY_DOTENV'

describe('loadLocalEnv', () => {
  const directories: string[] = []

  afterEach(() => {
    delete process.env[KEY]
    delete process.env[ONLY_ENV]
    for (const directory of directories.splice(0)) {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('prefers .env.local over .env and keeps variables already in the shell', () => {
    const directory = mkdtempSync(join(tmpdir(), 'opensen-env-'))
    directories.push(directory)
    writeFileSync(
      join(directory, '.env.local'),
      `${KEY}=from-local\n`,
    )
    writeFileSync(
      join(directory, '.env'),
      `${KEY}=from-dotenv\n${ONLY_ENV}=from-dotenv\n`,
    )
    process.env[KEY] = 'from-shell'

    loadLocalEnv(directory)

    expect(process.env[KEY]).toBe('from-shell')
    expect(process.env[ONLY_ENV]).toBe('from-dotenv')
  })

  it('reads .env.local when the shell has not set the variable', () => {
    const directory = mkdtempSync(join(tmpdir(), 'opensen-env-'))
    directories.push(directory)
    writeFileSync(join(directory, '.env.local'), `${KEY}=from-local\n`)

    loadLocalEnv(directory)

    expect(process.env[KEY]).toBe('from-local')
  })
})
