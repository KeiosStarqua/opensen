import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { loadDatabaseEnv } from '../lib/env.js'
import { schema } from './schema/index.js'

export type Database =
  | ReturnType<typeof drizzleNeon<typeof schema>>
  | ReturnType<typeof drizzlePostgres<typeof schema>>

let databaseInstance: Database | undefined

export function isNeonHostedDatabaseUrl(databaseUrl: string): boolean {
  try {
    return new URL(databaseUrl).hostname.endsWith('.neon.tech')
  } catch {
    return false
  }
}

export function createDatabase(databaseUrl: string): Database {
  if (isNeonHostedDatabaseUrl(databaseUrl)) {
    const client = neon(databaseUrl)
    return drizzleNeon({ client, schema })
  }

  const client = postgres(databaseUrl, { max: 10 })
  return drizzlePostgres(client, { schema })
}

export function getDatabase(): Database {
  if (!databaseInstance) {
    const { DATABASE_URL } = loadDatabaseEnv()
    databaseInstance = createDatabase(DATABASE_URL)
  }

  return databaseInstance
}

export function resetDatabaseForTests(): void {
  databaseInstance = undefined
}
