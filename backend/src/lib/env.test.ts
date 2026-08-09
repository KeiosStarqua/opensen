import { describe, expect, it } from 'vitest'
import {
  isDialoguePersistenceAllowed,
  loadDatabaseEnv,
  loadEnv,
  loadMigrationEnv,
  loadTestDatabaseEnv,
  resolveMigrationDatabaseUrl,
} from './env.js'

describe('loadEnv', () => {
  it('parses route configuration without requiring DATABASE_URL', () => {
    const env = loadEnv({
      AI_PROVIDER: 'openrouter',
      AI_MODEL: 'openai/gpt-4o-mini',
      OPENROUTER_APP_NAME: 'OpenSen',
    })

    expect(env.AI_PROVIDER).toBe('openrouter')
    expect(env.CORS_ORIGINS).toContain('http://localhost:3000')
    expect(env.DIALOGUE_PERSISTENCE_MODE).toBe('disabled')
  })
})

describe('loadDatabaseEnv', () => {
  it('rejects missing DATABASE_URL', () => {
    expect(() => loadDatabaseEnv({})).toThrow()
  })

  it('rejects whitespace-only DATABASE_URL', () => {
    expect(() =>
      loadDatabaseEnv({ DATABASE_URL: '   ' }),
    ).toThrow()
  })

  it('accepts a valid PostgreSQL URL', () => {
    const env = loadDatabaseEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen',
    })

    expect(env.DATABASE_URL).toBe(
      'postgresql://user:pass@localhost:5432/opensen',
    )
  })
})

describe('loadMigrationEnv', () => {
  it('prefers MIGRATION_DATABASE_URL when present', () => {
    const env = loadMigrationEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/opensen',
      MIGRATION_DATABASE_URL:
        'postgresql://user:pass@localhost:5432/opensen_direct',
    })

    expect(resolveMigrationDatabaseUrl({
      DATABASE_URL: env.DATABASE_URL,
      MIGRATION_DATABASE_URL: env.MIGRATION_DATABASE_URL,
    })).toBe('postgresql://user:pass@localhost:5432/opensen_direct')
  })
})

describe('isDialoguePersistenceAllowed', () => {
  it('allows internal and ephemeral modes only', () => {
    expect(
      isDialoguePersistenceAllowed({
        ...loadEnv({ OPENROUTER_APP_NAME: 'OpenSen' }),
        DIALOGUE_PERSISTENCE_MODE: 'internal',
      }),
    ).toBe(true)
    expect(
      isDialoguePersistenceAllowed({
        ...loadEnv({ OPENROUTER_APP_NAME: 'OpenSen' }),
        DIALOGUE_PERSISTENCE_MODE: 'ephemeral',
      }),
    ).toBe(true)
    expect(
      isDialoguePersistenceAllowed({
        ...loadEnv({ OPENROUTER_APP_NAME: 'OpenSen' }),
        DIALOGUE_PERSISTENCE_MODE: 'disabled',
      }),
    ).toBe(false)
  })
})

describe('loadTestDatabaseEnv', () => {
  it('rejects non-test database names', () => {
    expect(() =>
      loadTestDatabaseEnv({
        TEST_DATABASE_URL: 'postgresql://user:pass@localhost:5432/production',
      }),
    ).toThrow('opensen_test')
  })

  it('accepts the designated test database', () => {
    const env = loadTestDatabaseEnv({
      TEST_DATABASE_URL:
        'postgresql://opensen:opensen@localhost:5433/opensen_test',
    })

    expect(env.TEST_DATABASE_URL).toContain('opensen_test')
  })
})
