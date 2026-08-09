import 'dotenv/config'
import postgres from 'postgres'
import { resolveMigrationDatabaseUrl } from '../lib/env.js'

type PreflightResult = {
  postgresVersion: string
  vectorInstalled: boolean
  canCreateVectorExtension: boolean
  targetHost: string
  targetDatabase: string
}

export async function runDatabasePreflight(
  databaseUrl = resolveMigrationDatabaseUrl(),
): Promise<PreflightResult> {
  const parsedUrl = new URL(databaseUrl)
  const sql = postgres(databaseUrl, { max: 1 })

  try {
    const versionRows = await sql<{ version: string }[]>`
      select version() as version
    `
    const extensionRows = await sql<{ extname: string }[]>`
      select extname from pg_extension where extname = 'vector'
    `
    const privilegeRows = await sql<{ has_privilege: boolean }[]>`
      select has_database_privilege(current_user, current_database(), 'CREATE') as has_privilege
    `

    return {
      postgresVersion: versionRows[0]?.version ?? 'unknown',
      vectorInstalled: extensionRows.length > 0,
      canCreateVectorExtension: privilegeRows[0]?.has_privilege ?? false,
      targetHost: parsedUrl.hostname,
      targetDatabase: parsedUrl.pathname.replace(/^\//, '').split('/')[0] ?? '',
    }
  } finally {
    await sql.end({ timeout: 5 })
  }
}

if (process.argv[1]?.includes('preflight.ts')) {
  runDatabasePreflight()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2))
      if (!result.vectorInstalled && !result.canCreateVectorExtension) {
        console.error(
          'Target database cannot create the vector extension. Install pgvector or use a privileged migration role.',
        )
        process.exit(1)
      }
    })
    .catch((error: unknown) => {
      console.error('Database preflight failed:', error)
      process.exit(1)
    })
}
